// app/api/tasks/[id]/route.ts - Updated with multi-tenant support

import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/src/lib/db";
import { UpdateTaskRequest } from "@/src/lib/models/types";
import { getUserCompanyInfo, validateTaskAccess, validateUserAccess } from "@/src/lib/utils/multiTenant";

// GET single task with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Валидируем доступ к задаче
    const hasAccess = await validateTaskAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Получаем задачу с учетом multi-tenant ограничений
    const taskResult = await query(
      `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.type,
        t.creator_id,
        t.responsible_id,
        t.process_id,
        t.due_date,
        t.created_at,
        t.updated_at,
        t.completed_at,
        t.tags,
        t.estimated_hours,
        t.actual_hours,
        t.result,
        t.ai_score,
        t.is_overdue,
        t.is_almost_overdue,
        t.is_deleted,
        t.deleted_at,
        t.deleted_by,
        t.company_id,
        -- Creator info
        creator.name as creator_name,
        creator.avatar as creator_avatar,
        -- Responsible info
        resp.name as responsible_name,
        resp.avatar as responsible_avatar,
        -- Process info
        bp.name as process_name,
        bp.description as process_description
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id AND creator.company_id = t.company_id
      LEFT JOIN users resp ON t.responsible_id = resp.id AND resp.company_id = t.company_id
      LEFT JOIN business_processes bp ON t.process_id = bp.id AND bp.company_id = t.company_id
      WHERE t.id = $1 AND t.company_id = $2
    `,
      [params.id, userCompanyInfo.companyId]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const row = taskResult.rows[0];

    // Получаем исполнителей (только из той же компании)
    const assigneesResult = await query(
      `
      SELECT u.id, u.name, u.avatar, u.role, u.position
      FROM users u
      JOIN task_assignees ta ON u.id = ta.user_id
      WHERE ta.task_id = $1 AND u.company_id = $2
    `,
      [params.id, userCompanyInfo.companyId]
    );

    // Получаем наблюдателей (только из той же компании)
    const observersResult = await query(
      `
      SELECT u.id, u.name, u.avatar, u.role, u.position
      FROM users u
      JOIN task_observers tob ON u.id = tob.user_id
      WHERE tob.task_id = $1 AND u.company_id = $2
    `,
      [params.id, userCompanyInfo.companyId]
    );

    // Получаем комментарии (автоматически фильтруются через task_id)
    const commentsResult = await query(
      `
      SELECT c.*, u.name as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id AND u.company_id = $2
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
    `,
      [params.id, userCompanyInfo.companyId]
    );

    // Получаем историю (автоматически фильтруется через task_id)
    const historyResult = await query(
      `
      SELECT h.*, u.name as user_name, u.avatar as user_avatar
      FROM history_entries h
      LEFT JOIN users u ON h.user_id = u.id AND u.company_id = $2
      WHERE h.task_id = $1
      ORDER BY h.created_at DESC
    `,
      [params.id, userCompanyInfo.companyId]
    );

    // Получаем чек-лист (автоматически фильтруется через task_id)
    const checklistResult = await query(
      `
      SELECT c.*, 
             creator.name as creator_name, 
             completed_user.name as completed_by_name
      FROM checklist_items c
      LEFT JOIN users creator ON c.created_by = creator.id AND creator.company_id = $2
      LEFT JOIN users completed_user ON c.completed_by = completed_user.id AND completed_user.company_id = $2
      WHERE c.task_id = $1
      ORDER BY c.item_order ASC
    `,
      [params.id, userCompanyInfo.companyId]
    );

    const task = {
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      type: row.type,
      creatorId: row.creator_id,
      responsibleId: row.responsible_id,
      processId: row.process_id,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      tags: row.tags || [],
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      result: row.result,
      aiScore: row.ai_score,
      isOverdue: row.is_overdue,
      isAlmostOverdue: row.is_almost_overdue,
      isDeleted: Boolean(row.is_deleted),
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      companyId: row.company_id,
      assigneeIds: assigneesResult.rows.map((a: any) => a.id),
      observerIds: observersResult.rows.map((o: any) => o.id),
      assignees: assigneesResult.rows,
      observers: observersResult.rows,
      comments: commentsResult.rows.map((c) => ({
        id: c.id,
        authorId: c.author_id,
        text: c.text,
        isResult: c.is_result,
        isEdited: c.is_edited,
        aiScore: c.ai_score,
        timestamp: c.created_at,
        editedAt: c.edited_at,
        author: c.author_name
          ? { id: c.author_id, name: c.author_name, avatar: c.author_avatar }
          : null,
      })),
      history: historyResult.rows.map((h) => ({
        id: h.id,
        actionType: h.action_type,
        userId: h.user_id,
        description: h.description,
        oldValue: h.old_value,
        newValue: h.new_value,
        additionalData: h.additional_data,
        timestamp: h.created_at,
        user: h.user_name
          ? { id: h.user_id, name: h.user_name, avatar: h.user_avatar }
          : null,
      })),
      checklist: checklistResult.rows.map((c) => ({
        id: c.id,
        text: c.text,
        completed: c.completed,
        createdBy: c.created_by,
        completedBy: c.completed_by,
        parentId: c.parent_id,
        level: c.level,
        order: c.item_order,
        createdAt: c.created_at,
        completedAt: c.completed_at,
        creator: c.creator_name
          ? { id: c.created_by, name: c.creator_name }
          : null,
        completedByUser: c.completed_by_name
          ? { id: c.completed_by, name: c.completed_by_name }
          : null,
      })),
    };

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Валидируем доступ к задаче
    const hasAccess = await validateTaskAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    const body: UpdateTaskRequest = await request.json();
    const {
      title,
      description,
      priority,
      status,
      assigneeIds,
      observerIds,
      processId,
      dueDate,
      tags,
      actualHours,
      result,
      estimatedDays,
      estimatedHours,
      estimatedMinutes
    }: any = body;

    const userId = userCompanyInfo.userId;

    // Валидация assigneeIds - все должны быть из той же компании
    if (assigneeIds && assigneeIds.length > 0) {
      for (const assigneeId of assigneeIds) {
        const hasAccessToUser = await validateUserAccess(assigneeId, userCompanyInfo.companyId);
        if (!hasAccessToUser) {
          return NextResponse.json(
            { success: false, error: `Assignee ${assigneeId} not found or not from the same company` },
            { status: 400 }
          );
        }
      }
    }

    // Валидация observerIds
    if (observerIds && observerIds.length > 0) {
      for (const observerId of observerIds) {
        const hasAccessToUser = await validateUserAccess(observerId, userCompanyInfo.companyId);
        if (!hasAccessToUser) {
          return NextResponse.json(
            { success: false, error: `Observer ${observerId} not found or not from the same company` },
            { status: 400 }
          );
        }
      }
    }

    // Валидация processId
    if (processId) {
      const processCheck = await query(
        'SELECT id FROM business_processes WHERE id = $1 AND company_id = $2',
        [processId, userCompanyInfo.companyId]
      );
      
      if (processCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Process not found or not accessible" },
          { status: 400 }
        );
      }
    }

    const updateResult = await transaction(async (client) => {
      // Получаем текущую задачу для отслеживания истории
      const currentTaskResult = await client.query(
        "SELECT * FROM tasks WHERE id = $1 AND company_id = $2",
        [params.id, userCompanyInfo.companyId]
      );

      if (currentTaskResult.rows.length === 0) {
        throw new Error("Task not found");
      }

      if (currentTaskResult.rows[0].is_deleted) {
        throw new Error("Cannot modify task in trash");
      }

      const currentTask = currentTaskResult.rows[0];

      // Преобразуем пустую строку processId в null
      const normalizedProcessId = processId === "" ? null : processId;

      // Строим динамический запрос обновления
      const updateFields = [];
      const updateValues = [params.id, userCompanyInfo.companyId];
      let paramIndex = 3;

      if (title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        updateValues.push(title);
        paramIndex++;
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(description);
        paramIndex++;
      }
      if (priority !== undefined) {
        updateFields.push(`priority = $${paramIndex}`);
        updateValues.push(priority);
        paramIndex++;
      }
      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(status);
        paramIndex++;
      }
      if (processId !== undefined) {
        updateFields.push(`process_id = $${paramIndex}`);
        updateValues.push(normalizedProcessId);
        paramIndex++;
      }
      if (estimatedDays !== undefined) {
        updateFields.push(`estimated_days = $${paramIndex}`);
        updateValues.push(estimatedDays);
        paramIndex++;
      }
      if (estimatedHours !== undefined) {
        updateFields.push(`estimated_hours = $${paramIndex}`);
        updateValues.push(estimatedHours);
        paramIndex++;
      }
      if (estimatedMinutes !== undefined) {
        updateFields.push(`estimated_minutes = $${paramIndex}`);
        updateValues.push(estimatedMinutes);
        paramIndex++;
      }
      if (dueDate !== undefined) {
        updateFields.push(`due_date = $${paramIndex}`);
        updateValues.push(new Date(dueDate).toISOString());
        paramIndex++;
      }
      if (tags !== undefined) {
        updateFields.push(`tags = $${paramIndex}`);
        const tagsArray: string[] = Array.isArray(tags) ? tags : [];
        updateValues.push(tagsArray as any);
        paramIndex++;
      }
      if (actualHours !== undefined) {
        updateFields.push(`actual_hours = $${paramIndex}`);
        updateValues.push(actualHours);
        paramIndex++;
      }
      if (result !== undefined) {
        updateFields.push(`result = $${paramIndex}`);
        updateValues.push(result);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updateFields.push("updated_at = NOW()");

      // Обработка completed_at
      if (status === "completed") {
        updateFields.push(
          `completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE completed_at END`
        );
      } else if (status && status !== "completed") {
        updateFields.push("completed_at = NULL");
      }

      const updateQuery = `
        UPDATE tasks SET ${updateFields.join(", ")}
        WHERE id = $1 AND company_id = $2
        RETURNING *
      `;

      const taskResult = await client.query(updateQuery, updateValues);
      const updatedTask = taskResult.rows[0];

      // Обновление исполнителей если указаны
      if (assigneeIds && Array.isArray(assigneeIds)) {
        // Удаляем существующих исполнителей
        await client.query("DELETE FROM task_assignees WHERE task_id = $1", [
          params.id,
        ]);

        // Добавляем новых исполнителей
        for (const assigneeId of assigneeIds) {
          await client.query(
            "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
            [params.id, assigneeId]
          );
        }

        // Обновляем responsible_id на первого исполнителя
        if (assigneeIds.length > 0) {
          await client.query(
            "UPDATE tasks SET responsible_id = $1 WHERE id = $2 AND company_id = $3",
            [assigneeIds[0], params.id, userCompanyInfo.companyId]
          );
        }
      }

      // Обновление наблюдателей если указаны
      if (observerIds && Array.isArray(observerIds)) {
        // Удаляем существующих наблюдателей
        await client.query("DELETE FROM task_observers WHERE task_id = $1", [
          params.id,
        ]);

        // Добавляем новых наблюдателей
        for (const observerId of observerIds) {
          await client.query(
            "INSERT INTO task_observers (task_id, user_id) VALUES ($1, $2)",
            [params.id, observerId]
          );
        }
      }

      // Добавляем записи в историю для изменений
      const changes = [];
      if (title && title !== currentTask.title) {
        changes.push({
          field: "title",
          oldValue: currentTask.title,
          newValue: title,
          description: "Название изменено",
        });
      }
      if (
        description !== undefined &&
        description !== currentTask.description
      ) {
        changes.push({
          field: "description",
          oldValue: currentTask.description,
          newValue: description,
          description: "Описание изменено",
        });
      }
      if (priority && priority !== currentTask.priority) {
        changes.push({
          field: "priority",
          oldValue: currentTask.priority,
          newValue: priority,
          description: "Приоритет изменен",
        });
      }
      if (status && status !== currentTask.status) {
        changes.push({
          field: "status",
          oldValue: currentTask.status,
          newValue: status,
          description: `Статус изменен с '${currentTask.status}' на '${status}'`,
        });
      }
      if (
        dueDate &&
        new Date(dueDate).getTime() !== new Date(currentTask.due_date).getTime()
      ) {
        changes.push({
          field: "due_date",
          oldValue: currentTask.due_date,
          newValue: new Date(dueDate),
          description: "Дедлайн изменен",
        });
      }
      if (
        processId !== undefined &&
        normalizedProcessId !== currentTask.process_id
      ) {
        const oldProcessName = currentTask.process_id
          ? "Процесс был установлен"
          : "Процесс не был установлен";
        const newProcessName = normalizedProcessId
          ? "Процесс установлен"
          : "Процесс удален";
        changes.push({
          field: "process_id",
          oldValue: currentTask.process_id,
          newValue: normalizedProcessId,
          description: `Бизнес-процесс изменен: ${oldProcessName} → ${newProcessName}`,
        });
      }

      // Добавляем записи в историю
      for (const change of changes) {
        await client.query(
          `
          INSERT INTO history_entries (task_id, action_type, user_id, description, old_value, new_value)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            params.id,
            `${change.field}_changed`,
            userId,
            change.description,
            JSON.stringify(change.oldValue),
            JSON.stringify(change.newValue),
          ]
        );
      }

      return updatedTask;
    });

    // Возвращаем обновленную задачу
    const responseTask = {
      id: updateResult.id,
      title: updateResult.title,
      description: updateResult.description,
      priority: updateResult.priority,
      status: updateResult.status,
      type: updateResult.type,
      creatorId: updateResult.creator_id,
      responsibleId: updateResult.responsible_id,
      processId: updateResult.process_id,
      dueDate: updateResult.due_date,
      createdAt: updateResult.created_at,
      updatedAt: updateResult.updated_at,
      completedAt: updateResult.completed_at,
      tags: updateResult.tags || [],
      estimatedHours: updateResult.estimated_hours,
      actualHours: updateResult.actual_hours,
      result: updateResult.result,
      isOverdue: updateResult.is_overdue,
      isAlmostOverdue: updateResult.is_almost_overdue,
      companyId: updateResult.company_id,
    };

    return NextResponse.json({ success: true, data: responseTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
      { status: 500 }
    );
  }
}