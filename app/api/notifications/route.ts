// app/api/notifications/route.ts - Updated with multi-tenant support

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { CreateNotificationRequest } from '@/src/lib/models/types';
import { getUserCompanyInfo, validateUserAccess, validateTaskAccess } from '@/src/lib/utils/multiTenant';

export async function GET(request: NextRequest) {
  try {
    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isSent = searchParams.get('isSent');
    const notificationType = searchParams.get('notificationType');
    const taskId = searchParams.get('taskId');
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;
    
    // ОСНОВНОЙ MULTI-TENANT ФИЛЬТР
    whereConditions.push(`n.company_id = $${paramIndex}`);
    params.push(userCompanyInfo.companyId);
    paramIndex++;
    
    if (userId) {
      // Валидируем, что пользователь из той же компании
      const hasAccess = await validateUserAccess(userId, userCompanyInfo.companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "Access denied to user notifications" },
          { status: 403 }
        );
      }
      
      whereConditions.push(`n.recipient_user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }
    
    if (isSent !== null) {
      whereConditions.push(`n.is_sent = $${paramIndex}`);
      params.push(isSent === 'true');
      paramIndex++;
    }
    
    if (notificationType) {
      whereConditions.push(`n.notification_type = $${paramIndex}`);
      params.push(notificationType);
      paramIndex++;
    }
    
    if (taskId) {
      // Валидируем, что задача из той же компании
      const hasAccess = await validateTaskAccess(taskId, userCompanyInfo.companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "Access denied to task notifications" },
          { status: 403 }
        );
      }
      
      whereConditions.push(`n.task_id = $${paramIndex}`);
      params.push(taskId);
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
    `, [...params, limit, offset]);
    
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
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const body: CreateNotificationRequest = await request.json();
    const { 
      recipient_user_id,
      send_to_telegram = true,
      send_to_email = true,
      message_text,
      notification_type = 'general',
      task_id,
    } = body;
    
    // Валидируем получателя
    const hasAccessToRecipient = await validateUserAccess(recipient_user_id, userCompanyInfo.companyId);
    if (!hasAccessToRecipient) {
      return NextResponse.json(
        { success: false, error: "Recipient user not found or not accessible" },
        { status: 400 }
      );
    }
    
    // Валидируем задачу если указана
    if (task_id) {
      const hasAccessToTask = await validateTaskAccess(task_id, userCompanyInfo.companyId);
      if (!hasAccessToTask) {
        return NextResponse.json(
          { success: false, error: "Task not found or not accessible" },
          { status: 400 }
        );
      }
    }
    
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
        recipient_user_id,
        send_to_telegram,
        send_to_email,
        message_text,
        notification_type,
        task_id,
        userCompanyInfo.companyId // ОБЯЗАТЕЛЬНО указываем company_id
      ]
    );
    
    const notification = result.rows[0];
    
    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}