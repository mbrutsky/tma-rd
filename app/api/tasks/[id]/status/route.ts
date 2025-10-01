// app/api/tasks/[id]/status/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { getUserCompanyInfo, validateTaskAccess } from '@/src/lib/utils/multiTenant';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Multi-tenant проверка
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ success: false, error: "User not assigned to any company" }, { status: 403 });
    }

    const hasAccess = await validateTaskAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Task not found or access denied" }, { status: 404 });
    }

    // Проверяем, не удалена ли задача
    const checkResult = await query(
      'SELECT is_deleted, status FROM tasks WHERE id = $1',
      [params.id]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    if (checkResult.rows[0].is_deleted) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify task in trash', message: 'Задача находится в корзине и не может быть изменена' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, result, aiScore, actualHours } = body;
    
    const userId = userCompanyInfo.userId;
    
    // Get current task status for history
    const currentTaskResult = await query(
      'SELECT status FROM tasks WHERE id = $1',
      [params.id]
    );
    
    if (currentTaskResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    const oldStatus = currentTaskResult.rows[0].status;
    
    // Update task
    const updateResult = await query(
      `UPDATE tasks 
       SET status = $1, 
           result = COALESCE($2, result),
           ai_score = COALESCE($3, ai_score),
           actual_hours = COALESCE($4, actual_hours),
           completed_at = CASE 
             WHEN $1 = 'completed' AND completed_at IS NULL THEN NOW()
             WHEN $1 != 'completed' THEN NULL
             ELSE completed_at
           END,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, result, aiScore, actualHours, params.id]
    );
    
    // Add history entry
    await query(
      `INSERT INTO history_entries (task_id, action_type, user_id, description, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.id, 
        'status_changed', 
        userId, 
        `Статус изменен с '${oldStatus}' на '${status}'`,
        JSON.stringify(oldStatus),
        JSON.stringify(status)
      ]
    );
    
    const task = updateResult.rows[0];
    const formattedTask = {
      id: task.id,
      status: task.status,
      result: task.result,
      aiScore: task.ai_score,
      actualHours: task.actual_hours,
      completedAt: task.completed_at,
      updatedAt: task.updated_at
    };
    
    return NextResponse.json({ success: true, data: formattedTask });
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task status' },
      { status: 500 }
    );
  }
}