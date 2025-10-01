// app/api/notifications/test-send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';

interface TestSendRequest {
  recipientId: string;
  messageText: string;
  sendToTelegram?: boolean;
  sendToEmail?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestSendRequest = await request.json();
    const { 
      recipientId,
      messageText,
      sendToTelegram = true,
      sendToEmail = false
    } = body;

    // Получаем company_id из текущего пользователя
    const userId = request.headers.get('x-user-id');
    const userResult = await query('SELECT company_id FROM users WHERE id = $1', [userId]);
    const companyId = userResult.rows[0]?.company_id;

    // Создаем тестовое уведомление
    const result = await query(
      `INSERT INTO notifications (
        recipient_user_id, 
        send_to_telegram, 
        send_to_email, 
        message_text, 
        notification_type,
        company_id,
        is_sent,
        telegram_sent,
        email_sent,
        sent_at,
        telegram_sent_at,
        email_sent_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        recipientId,
        sendToTelegram,
        sendToEmail,
        messageText,
        'system',
        companyId,
        true, // Помечаем как отправленное
        sendToTelegram,
        sendToEmail,
        new Date(),
        sendToTelegram ? new Date() : null,
        sendToEmail ? new Date() : null
      ]
    );

    const notification = result.rows[0];

    // Получаем информацию о получателе для ответа
    const recipientResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [recipientId]
    );
    
    const recipient = recipientResult.rows[0];

    const responseData = {
      ...notification,
      recipient: recipient ? {
        id: recipientId,
        name: recipient.name,
        email: recipient.email
      } : null
    };

    return NextResponse.json({ 
      success: true, 
      data: responseData,
      message: 'Тестовое уведомление отправлено'
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}