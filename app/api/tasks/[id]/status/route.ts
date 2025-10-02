// app/api/tasks/[id]/status/route.ts - Fixed version
import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/src/lib/db';
import { getUserCompanyInfo, validateTaskAccess } from '@/src/lib/utils/multiTenant';

// Middleware для логирования
function logRequest(request: NextRequest, params: { id: string }) {
  console.log('Middleware check:', {
    pathname: request.nextUrl.pathname,
    hasAuth: request.headers.has('authorization'),
    hasUserId: request.headers.has('x-user-id'),
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Логируем запрос
    logRequest(request, params);
    
    // Multi-tenant проверка
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ success: false, error: "User not assigned to any company" }, { status: 403 });
    }

    // Проверяем доступ к задаче
    const hasAccess = await validateTaskAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Task not found or access denied" }, { status: 404 });
    }

    const body = await request.json();
    const { status, result, actualHours } = body;
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }
    
    const userId = userCompanyInfo.userId;
    
    // Используем транзакцию для атомарности операции
    const updateResult = await transaction(async (client) => {
      // Проверяем текущее состояние задачи
      const checkResult = await client.query(
        'SELECT id, is_deleted, status FROM tasks WHERE id = $1 AND company_id = $2',
        [params.id, userCompanyInfo.companyId]
      );
      
      if (checkResult.rows.length === 0) {
        throw new Error('Task not found');
      }
      
      const currentTask = checkResult.rows[0];
      
      if (currentTask.is_deleted) {
        throw new Error('Cannot modify task in trash');
      }
      
      const oldStatus = currentTask.status;
      
      // Подготавливаем поля для обновления
      const updateFields = ['status = $1', 'updated_at = NOW()'];
      const updateValues = [status];
      let paramIndex = 2;
      
      // Добавляем дополнительные поля если они есть
      if (result !== undefined) {
        updateFields.push(`result = $${paramIndex}`);
        updateValues.push(result);
        paramIndex++;
      }
      
      if (actualHours !== undefined) {
        updateFields.push(`actual_hours = $${paramIndex}`);
        updateValues.push(actualHours);
        paramIndex++;
      }
      
      // Обрабатываем completed_at
      if (status === 'completed') {
        updateFields.push(`completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE completed_at END`);
      } else if (status !== 'completed' && oldStatus === 'completed') {
        updateFields.push('completed_at = NULL');
      }
      
      // Добавляем id и company_id в конец параметров
      updateValues.push(params.id, userCompanyInfo.companyId);
      
      // Выполняем обновление
      const updateQuery = `
        UPDATE tasks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
        RETURNING id, status, result, actual_hours, completed_at, updated_at
      `;
      
      const updateResult = await client.query(updateQuery, updateValues);
      
      if (updateResult.rows.length === 0) {
        throw new Error('Failed to update task');
      }
      
      // Добавляем запись в историю
      await client.query(
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
      
      return updateResult.rows[0];
    });
    
    // Форматируем ответ
    const formattedTask = {
      id: updateResult.id,
      status: updateResult.status,
      result: updateResult.result,
      actualHours: updateResult.actual_hours,
      completedAt: updateResult.completed_at,
      updatedAt: updateResult.updated_at
    };
    
    return NextResponse.json({ success: true, data: formattedTask });
    
  } catch (error: any) {
    console.error('Error updating task status:', error);
    
    // Различные типы ошибок
    if (error.message === 'Task not found') {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    if (error.message === 'Cannot modify task in trash') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify task in trash' },
        { status: 403 }
      );
    }
    
    // Проверяем на ошибки типов PostgreSQL
    if (error.code === '42P08') {
      console.error('Type mismatch error:', error.detail);
      return NextResponse.json(
        { success: false, error: 'Database type mismatch: ' + (error.detail || 'Unknown') },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update task status' },
      { status: 500 }
    );
  }
}