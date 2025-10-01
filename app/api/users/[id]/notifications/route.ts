// app/api/users/[id]/notifications/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { getUserCompanyInfo, validateUserAccess } from '@/src/lib/utils/multiTenant';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Получаем информацию о компании текущего пользователя
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Проверяем доступ к целевому пользователю
    const hasAccess = await validateUserAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied to user notifications" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let whereConditions: string[] = [`n.recipient_user_id = $1`, `n.company_id = $2`];
    let queryParams: any[] = [params.id, userCompanyInfo.companyId];
    let paramIndex = 3;
    
    if (unreadOnly) {
      whereConditions.push(`n.is_sent = $${paramIndex}`);
      queryParams.push(false);
      paramIndex++;
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    const result = await query(`
      SELECT 
        n.*,
        u.name as recipient_name,
        u.avatar as recipient_avatar,
        u.email as recipient_email,
        t.title as task_title,
        c.id as company_id,
        director_user.name as company_director_name
      FROM notifications n
      LEFT JOIN users u ON n.recipient_user_id = u.id AND u.company_id = n.company_id
      LEFT JOIN tasks t ON n.task_id = t.id AND t.company_id = n.company_id
      LEFT JOIN companies c ON n.company_id = c.id
      LEFT JOIN users director_user ON c.director_app_user_id = director_user.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);
    
    const notifications = result.rows.map(row => ({
      id: row.id,
      recipient_user_id: row.recipient_user_id,
      send_to_telegram: row.send_to_telegram,
      send_to_email: row.send_to_email,
      message_text: row.message_text,
      created_at: row.created_at,
      sent_at: row.sent_at,
      is_sent: row.is_sent,
      telegram_sent: row.telegram_sent,
      email_sent: row.email_sent,
      telegram_sent_at: row.telegram_sent_at,
      email_sent_at: row.email_sent_at,
      notification_type: row.notification_type,
      task_id: row.task_id,
      company_id: row.company_id,
      recipient: row.recipient_name ? {
        id: row.recipient_user_id,
        name: row.recipient_name,
        avatar: row.recipient_avatar,
        email: row.recipient_email
      } : null,
      task: row.task_title ? {
        id: row.task_id,
        title: row.task_title
      } : null,
      company: row.company_id ? {
        id: row.company_id,
        director_name: row.company_director_name
      } : null
    }));
    
    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user notifications' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Проверяем доступ к целевому пользователю
    const hasAccess = await validateUserAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Cannot create notification for user from different company" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      send_to_telegram = true,
      send_to_email = true,
      message_text,
      notification_type = 'general',
      task_id
    } = body;
    
    const result = await query(
      `INSERT INTO notifications (
        recipient_user_id, 
        send_to_telegram, 
        send_to_email, 
        message_text, 
        notification_type,
        task_id,
        company_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        params.id,
        send_to_telegram,
        send_to_email,
        message_text,
        notification_type,
        task_id,
        userCompanyInfo.companyId
      ]
    );
    
    const notification = result.rows[0];
    
    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating user notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user notification' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Проверяем доступ к целевому пользователю
    const hasAccess = await validateUserAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied to user notifications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;
    
    if (action === 'mark_all_read') {
      const result = await query(
        `UPDATE notifications 
         SET is_sent = true, sent_at = NOW(), telegram_sent = true, email_sent = true, 
             telegram_sent_at = NOW(), email_sent_at = NOW()
         WHERE recipient_user_id = $1 AND company_id = $2 AND is_sent = false
         RETURNING id`,
        [params.id, userCompanyInfo.companyId]
      );
      
      return NextResponse.json({ 
        success: true, 
        data: { updated_count: result.rows.length }
      });
    }
    
    if (action === 'delete_read') {
      const result = await query(
        `DELETE FROM notifications 
         WHERE recipient_user_id = $1 AND company_id = $2 AND is_sent = true
         RETURNING id`,
        [params.id, userCompanyInfo.companyId]
      );
      
      return NextResponse.json({ 
        success: true, 
        data: { deleted_count: result.rows.length }
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error performing bulk operation on user notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}