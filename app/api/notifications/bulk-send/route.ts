import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/src/lib/db';
import { getUserCompanyInfo, validateUserAccess } from '@/src/lib/utils/multiTenant';

interface BulkSendRequest {
  recipientIds: string[];
  messageText: string;
  sendToTelegram?: boolean;
  sendToEmail?: boolean;
  notificationType?: string;
  taskId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const body: BulkSendRequest = await request.json();
    const { 
      recipientIds,
      messageText,
      sendToTelegram = true,
      sendToEmail = true,
      notificationType = 'general',
      taskId
    } = body;

    // Валидируем всех получателей - все должны быть из той же компании
    const recipientsValidation = await query(
      'SELECT id FROM users WHERE id = ANY($1) AND company_id = $2',
      [recipientIds, userCompanyInfo.companyId]
    );

    if (recipientsValidation.rows.length !== recipientIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some recipients are not from the same company' },
        { status: 400 }
      );
    }

    // Валидируем задачу если указана
    if (taskId) {
      const taskValidation = await query(
        'SELECT id FROM tasks WHERE id = $1 AND company_id = $2',
        [taskId, userCompanyInfo.companyId]
      );

      if (taskValidation.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Task not found or not accessible' },
          { status: 400 }
        );
      }
    }

    const result = await transaction(async (client) => {
      let successCount = 0;
      let failedCount = 0;

      for (const recipientId of recipientIds) {
        try {
          await client.query(
            `INSERT INTO notifications (
              recipient_user_id, 
              send_to_telegram, 
              send_to_email, 
              message_text, 
              notification_type,
              task_id,
              company_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              recipientId,
              sendToTelegram,
              sendToEmail,
              messageText,
              notificationType,
              taskId,
              userCompanyInfo.companyId
            ]
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to create notification for user ${recipientId}:`, error);
          failedCount++;
        }
      }

      return { success: successCount, failed: failedCount };
    });

    return NextResponse.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send bulk notifications' },
      { status: 500 }
    );
  }
}