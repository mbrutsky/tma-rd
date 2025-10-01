// app/api/notifications/[id]/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { getUserCompanyInfo } from '@/src/lib/utils/multiTenant';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Multi-tenant проверка
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ success: false, error: "User not assigned to any company" }, { status: 403 });
    }

    // Проверить, что уведомление принадлежит компании пользователя
    const notificationCheck = await query(
      'SELECT company_id FROM notifications WHERE id = $1',
      [params.id]
    );

    if (notificationCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    if (notificationCheck.rows[0].company_id !== userCompanyInfo.companyId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

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
      WHERE n.id = $1 AND n.company_id = $2
    `, [params.id, userCompanyInfo.companyId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    const row = result.rows[0];
    const notification = {
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
    };
    
    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Multi-tenant проверка
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ success: false, error: "User not assigned to any company" }, { status: 403 });
    }

    // Проверить, что уведомление принадлежит компании пользователя
    const notificationCheck = await query(
      'SELECT company_id FROM notifications WHERE id = $1',
      [params.id]
    );

    if (notificationCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    if (notificationCheck.rows[0].company_id !== userCompanyInfo.companyId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      send_to_telegram,
      send_to_email,
      message_text,
      is_sent,
      telegram_sent,
      email_sent
    } = body;
    
    const updateFields = [];
    const updateValues = [params.id];
    let paramIndex = 2;
    
    if (send_to_telegram !== undefined) {
      updateFields.push(`send_to_telegram = ${paramIndex}`);
      updateValues.push(send_to_telegram);
      paramIndex++;
    }
    
    if (send_to_email !== undefined) {
      updateFields.push(`send_to_email = ${paramIndex}`);
      updateValues.push(send_to_email);
      paramIndex++;
    }
    
    if (message_text !== undefined) {
      updateFields.push(`message_text = ${paramIndex}`);
      updateValues.push(message_text);
      paramIndex++;
    }
    
    if (is_sent !== undefined) {
      updateFields.push(`is_sent = ${paramIndex}`);
      updateValues.push(is_sent);
      paramIndex++;
      
      if (is_sent) {
        updateFields.push(`sent_at = NOW()`);
      }
    }
    
    if (telegram_sent !== undefined) {
      updateFields.push(`telegram_sent = ${paramIndex}`);
      updateValues.push(telegram_sent);
      paramIndex++;
      
      if (telegram_sent) {
        updateFields.push(`telegram_sent_at = NOW()`);
      } else {
        updateFields.push(`telegram_sent_at = NULL`);
      }
    }
    
    if (email_sent !== undefined) {
      updateFields.push(`email_sent = ${paramIndex}`);
      updateValues.push(email_sent);
      paramIndex++;
      
      if (email_sent) {
        updateFields.push(`email_sent_at = NOW()`);
      } else {
        updateFields.push(`email_sent_at = NULL`);
      }
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    const result = await query(`
      UPDATE notifications 
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND company_id = ${paramIndex}
      RETURNING *
    `, [...updateValues, userCompanyInfo.companyId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    const notification = result.rows[0];
    
    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Multi-tenant проверка
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ success: false, error: "User not assigned to any company" }, { status: 403 });
    }

    const currentUserId = userCompanyInfo.userId;
    
    // Проверяем, что уведомление существует и принадлежит текущему пользователю
    const checkResult = await query(
      'SELECT recipient_user_id, company_id FROM notifications WHERE id = $1',
      [params.id]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    const notification = checkResult.rows[0];
    
    // Проверяем права доступа
    if (notification.company_id !== userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    if (notification.recipient_user_id !== currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Удаляем уведомление
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND company_id = $2 RETURNING id',
      [params.id, userCompanyInfo.companyId]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification deleted successfully',
      data: { id: params.id }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}