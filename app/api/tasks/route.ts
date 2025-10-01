// app/api/tasks/route.ts - Updated with multi-tenant support

import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/src/lib/db";
import { CreateTaskRequest } from "@/src/lib/models/types";
import { validateRequest } from "@/src/lib/cors";
import { getUserCompanyInfo } from "@/src/lib/utils/multiTenant";

async function getTasksWithRelations(whereClause = "", params: any[] = []) {
  const queryText = `
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
      resp.avatar as resp_avatar,
      -- Process info
      bp.name as process_name,
      bp.description as process_description,
      -- Aggregated assignees
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', au.id,
            'name', au.name,
            'avatar', au.avatar,
            'role', au.role,
            'position', au.position
          )
        ) FILTER (WHERE au.id IS NOT NULL), 
        '[]'::json
      ) as assignees,
      -- Aggregated observers
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', ou.id,
            'name', ou.name,
            'avatar', ou.avatar,
            'role', ou.role,
            'position', ou.position
          )
        ) FILTER (WHERE ou.id IS NOT NULL), 
        '[]'::json
      ) as observers
    FROM tasks t
    LEFT JOIN users creator ON t.creator_id = creator.id
    LEFT JOIN users resp ON t.responsible_id = resp.id
    LEFT JOIN business_processes bp ON t.process_id = bp.id AND bp.company_id = t.company_id
    LEFT JOIN task_assignees ta ON t.id = ta.task_id
    LEFT JOIN users au ON ta.user_id = au.id AND au.company_id = t.company_id
    LEFT JOIN task_observers tob ON t.id = tob.task_id
    LEFT JOIN users ou ON tob.user_id = ou.id AND ou.company_id = t.company_id
    ${whereClause}
    GROUP BY 
      t.id, t.title, t.description, t.priority, t.status, t.type, 
      t.creator_id, t.responsible_id, t.process_id, t.due_date,
      t.created_at, t.updated_at, t.completed_at, t.tags, 
      t.estimated_hours, t.actual_hours, t.result, t.ai_score,
      t.is_overdue, t.is_almost_overdue, t.is_deleted, t.deleted_at, t.deleted_by, t.company_id,
      creator.name, creator.avatar,
      resp.name, resp.avatar,
      bp.name, bp.description
    ORDER BY t.due_date ASC
  `;

  return await query(queryText, params);
}

export async function GET(request: NextRequest) {
  try {
    const validation = validateRequest(request);
    if (!validation.allowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    // const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");
    const createdBy = searchParams.get("createdBy");
    const processId = searchParams.get("processId");
    const overdue = searchParams.get("overdue");
    const almostOverdue = searchParams.get("almostOverdue");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    // ОСНОВНОЙ MULTI-TENANT ФИЛЬТР
    whereConditions.push(`t.company_id = $${paramIndex}`);
    params.push(userCompanyInfo.companyId);
    paramIndex++;

    // Фильтр по удаленным задачам
    if (!includeDeleted) {
      whereConditions.push(`COALESCE(t.is_deleted, false) = false`);
    }

    if (status) {
      whereConditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (assignedTo) {
      // Проверяем, что assignedTo пользователь из той же компании
      const userAccessCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND company_id = $2',
        [assignedTo, userCompanyInfo.companyId]
      );
      
      if (userAccessCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid assignedTo user" },
          { status: 400 }
        );
      }
      
      whereConditions.push(`ta.user_id = $${paramIndex}`);
      params.push(assignedTo);
      paramIndex++;
    }

    if (createdBy) {
      // Проверяем, что createdBy пользователь из той же компании
      const userAccessCheck = await query(
        'SELECT id FROM users WHERE id = $1 AND company_id = $2',
        [createdBy, userCompanyInfo.companyId]
      );
      
      if (userAccessCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid createdBy user" },
          { status: 400 }
        );
      }
      
      whereConditions.push(`t.creator_id = $${paramIndex}`);
      params.push(createdBy);
      paramIndex++;
    }

    if (processId) {
      // Проверяем, что процесс принадлежит той же компании
      const processAccessCheck = await query(
        'SELECT id FROM business_processes WHERE id = $1 AND company_id = $2',
        [processId, userCompanyInfo.companyId]
      );
      
      if (processAccessCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid process" },
          { status: 400 }
        );
      }
      
      whereConditions.push(`t.process_id = $${paramIndex}`);
      params.push(processId);
      paramIndex++;
    }

    if (overdue === "true") {
      whereConditions.push(`t.is_overdue = true`);
    }

    if (almostOverdue === "true") {
      whereConditions.push(`t.is_almost_overdue = true`);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;
    const result = await getTasksWithRelations(whereClause, params);

    // Transform the results
    const tasks = result.rows.map((row) => ({
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
      assigneeIds: row.assignees.map((a: any) => a.id),
      observerIds: row.observers.map((o: any) => o.id),
      assignees: row.assignees,
      observers: row.observers,
      creator: row.creator_name
        ? {
            id: row.creator_id,
            name: row.creator_name,
            avatar: row.creator_avatar,
          }
        : null,
      responsible: row.responsible_name
        ? {
            id: row.responsible_id,
            name: row.responsible_name,
            avatar: row.responsible_avatar,
          }
        : null,
      process: row.process_name
        ? {
            id: row.process_id,
            name: row.process_name,
            description: row.process_description,
          }
        : null,
      comments: [],
      history: [],
      checklist: [],
    }));

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = validateRequest(request);
    if (!validation.allowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const body: CreateTaskRequest = await request.json();
    const {
      title,
      description,
      priority,
      type,
      assigneeIds,
      observerIds = [],
      processId,
      dueDate,
      tags = [],
      estimatedHours,
      checklist = [],
    } = body;

    // Валидация assigneeIds - все должны быть из той же компании
    if (assigneeIds && assigneeIds.length > 0) {
      const assigneesCheck = await query(
        'SELECT id FROM users WHERE id = ANY($1) AND company_id = $2',
        [assigneeIds, userCompanyInfo.companyId]
      );
      
      if (assigneesCheck.rows.length !== assigneeIds.length) {
        return NextResponse.json(
          { success: false, error: "Some assignees are not from the same company" },
          { status: 400 }
        );
      }
    }

    // Валидация observerIds
    if (observerIds && observerIds.length > 0) {
      const observersCheck = await query(
        'SELECT id FROM users WHERE id = ANY($1) AND company_id = $2',
        [observerIds, userCompanyInfo.companyId]
      );
      
      if (observersCheck.rows.length !== observerIds.length) {
        return NextResponse.json(
          { success: false, error: "Some observers are not from the same company" },
          { status: 400 }
        );
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

    const creatorId = userCompanyInfo.userId;
    const responsibleId = assigneeIds[0] || creatorId;

    const result = await transaction(async (client) => {
      // Создаем задачу с company_id
      const taskResult = await client.query(
        `INSERT INTO tasks (
          title, description, priority, status, type, creator_id, responsible_id, 
          process_id, due_date, tags, estimated_hours, company_id
        )
        VALUES ($1, $2, $3, 'new', $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          title,
          description,
          priority,
          type,
          creatorId,
          responsibleId,
          processId || null,
          dueDate,
          tags,
          estimatedHours,
          userCompanyInfo.companyId, // ОБЯЗАТЕЛЬНО указываем company_id
        ]
      );

      const task = taskResult.rows[0];

      // Добавляем исполнителей
      for (const assigneeId of assigneeIds) {
        await client.query(
          "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
          [task.id, assigneeId]
        );
      }

      // Добавляем наблюдателей
      for (const observerId of observerIds) {
        await client.query(
          "INSERT INTO task_observers (task_id, user_id) VALUES ($1, $2)",
          [task.id, observerId]
        );
      }

      // Добавляем элементы чек-листа
      for (let i = 0; i < checklist.length; i++) {
        const item = checklist[i];
        await client.query(
          "INSERT INTO checklist_items (task_id, text, level, item_order, created_by) VALUES ($1, $2, $3, $4, $5)",
          [task.id, item.text, item.level || 0, item.order || i + 1, creatorId]
        );
      }

      // Добавляем запись в историю
      await client.query(
        "INSERT INTO history_entries (task_id, action_type, user_id, description) VALUES ($1, $2, $3, $4)",
        [task.id, "created", creatorId, "Задача создана"]
      );

      return task;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}