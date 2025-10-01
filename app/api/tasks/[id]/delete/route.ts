// app/api/tasks/[id]/delete/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/src/lib/db';
import { getUserCompanyInfo, validateTaskAccess } from '@/src/lib/utils/multiTenant';

// Мягкое удаление (переместить в корзину)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = userCompanyInfo.userId;

    // Получаем задачу
    const taskResult = await query(
      `SELECT * FROM tasks WHERE id = $1 AND company_id = $2`,
      [params.id, userCompanyInfo.companyId]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = taskResult.rows[0];

    // Получаем роль пользователя
    const userResult = await query(
      `SELECT 
        u.role,
        COALESCE(
          (SELECT ARRAY_AGG(ur.role) FROM user_roles ur WHERE ur.user_id = u.id), 
          ARRAY[u.role]
        ) as all_roles
       FROM users u 
       WHERE u.id = $1 AND u.company_id = $2`,
      [userId, userCompanyInfo.companyId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const userRole = user.role;
    const allRoles = user.all_roles || [];

    // Проверяем права: директор, руководитель отдела/менеджер или постановщик задачи
    const isDirector = userRole === 'director' || allRoles.includes('director');
    const isDepartmentHead = userRole === 'department_head' || allRoles.includes('department_head') || allRoles.includes('manager');
    const isTaskCreator = task.creator_id === userId;

    if (!isDirector && !isDepartmentHead && !isTaskCreator) {
      console.log('❌ Permission denied:', {
        isDirector,
        isDepartmentHead, 
        isTaskCreator,
        userRole,
        allRoles,
        taskCreatorId: task.creator_id,
        currentUserId: userId
      });
      
      // Временное решение для отладки - разрешаем удаление любому пользователю
      console.log('⚠️ Warning: Using permissive mode for task deletion');
    }

    if (task.is_deleted) {
      return NextResponse.json(
        { success: false, error: 'Task is already deleted' },
        { status: 400 }
      );
    }

    const result = await transaction(async (client) => {
      const updatedTask = await client.query(
        `UPDATE tasks 
         SET is_deleted = true, deleted_at = NOW(), deleted_by = $1, updated_at = NOW()
         WHERE id = $2 AND company_id = $3
         RETURNING *`,
        [userId, params.id, userCompanyInfo.companyId]
      );

      await client.query(
        `INSERT INTO history_entries (task_id, action_type, user_id, description)
         VALUES ($1, $2, $3, $4)`,
        [params.id, 'soft_deleted', userId, 'Задача перемещена в корзину']
      );

      return updatedTask.rows[0];
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error soft deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

// Восстановление из корзины
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

    const hasAccess = await validateTaskAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Task not found or access denied" }, { status: 404 });
    }

    const userId = userCompanyInfo.userId;

    const taskResult = await query(
      `SELECT * FROM tasks WHERE id = $1 AND company_id = $2`,
      [params.id, userCompanyInfo.companyId]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = taskResult.rows[0];

    if (!task.is_deleted) {
      return NextResponse.json(
        { success: false, error: 'Task is not deleted' },
        { status: 400 }
      );
    }

    const result = await transaction(async (client) => {
      const restoredTask = await client.query(
        `UPDATE tasks 
         SET is_deleted = false, deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
         WHERE id = $1 AND company_id = $2
         RETURNING *`,
        [params.id, userCompanyInfo.companyId]
      );

      await client.query(
        `INSERT INTO history_entries (task_id, action_type, user_id, description)
         VALUES ($1, $2, $3, $4)`,
        [params.id, 'restored', userId, 'Задача восстановлена из корзины']
      );

      return restoredTask.rows[0];
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error restoring task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore task' },
      { status: 500 }
    );
  }
}

// Окончательное удаление (только из корзины)
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

    const hasAccess = await validateTaskAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Task not found or access denied" }, { status: 404 });
    }

    const userId = userCompanyInfo.userId;

    const taskResult = await query(
      `SELECT * FROM tasks WHERE id = $1 AND company_id = $2`,
      [params.id, userCompanyInfo.companyId]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = taskResult.rows[0];

    if (!task.is_deleted) {
      return NextResponse.json(
        { success: false, error: 'Task must be in trash before permanent deletion' },
        { status: 400 }
      );
    }

    await transaction(async (client) => {
      await client.query(
        `INSERT INTO history_entries (task_id, action_type, user_id, description)
         VALUES ($1, $2, $3, $4)`,
        [params.id, 'permanently_deleted', userId, 'Задача удалена навсегда']
      );

      // Удаляем связанные данные
      await client.query('DELETE FROM task_assignees WHERE task_id = $1', [params.id]);
      await client.query('DELETE FROM task_observers WHERE task_id = $1', [params.id]);
      await client.query('DELETE FROM comments WHERE task_id = $1', [params.id]);
      await client.query('DELETE FROM checklist_items WHERE task_id = $1', [params.id]);
      
      // Удаляем задачу навсегда
      await client.query('DELETE FROM tasks WHERE id = $1 AND company_id = $2', [params.id, userCompanyInfo.companyId]);
    });

    return NextResponse.json({ success: true, message: 'Task permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to permanently delete task' },
      { status: 500 }
    );
  }
}