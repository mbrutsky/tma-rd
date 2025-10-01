// app/api/tasks/[id]/checklist/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { getUserCompanyInfo, validateTaskAccess } from '@/src/lib/utils/multiTenant';

interface CreateChecklistItemRequest {
  text: string;
  level?: number;
  parentId?: string;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const result = await query(
      `SELECT 
        c.*, 
        creator.name as creator_name, 
        completed_user.name as completed_by_name
      FROM checklist_items c
      LEFT JOIN users creator ON c.created_by = creator.id AND creator.company_id = $2
      LEFT JOIN users completed_user ON c.completed_by = completed_user.id AND completed_user.company_id = $2
      WHERE c.task_id = $1
      ORDER BY c.item_order ASC`,
      [params.id, userCompanyInfo.companyId]
    );
    
    const checklistItems = result.rows.map(row => ({
      id: row.id,
      text: row.text,
      completed: row.completed,
      createdBy: row.created_by,
      completedBy: row.completed_by,
      parentId: row.parent_id,
      level: row.level,
      order: row.item_order,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      creator: row.creator_name ? { 
        id: row.created_by, 
        name: row.creator_name 
      } : null,
      completedByUser: row.completed_by_name ? { 
        id: row.completed_by, 
        name: row.completed_by_name 
      } : null
    }));
    
    return NextResponse.json({ success: true, data: checklistItems });
  } catch (error) {
    console.error('Error fetching checklist items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch checklist items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const taskCheck = await query(
      'SELECT is_deleted FROM tasks WHERE id = $1',
      [params.id]
    );
    
    if (taskCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    if (taskCheck.rows[0].is_deleted) {
      return NextResponse.json(
        { success: false, error: 'Cannot add checklist items to task in trash', message: 'Задача находится в корзине' },
        { status: 403 }
      );
    }

    const body: CreateChecklistItemRequest = await request.json();
    const { text, level = 0, parentId } = body;
    
    const createdBy = userCompanyInfo.userId;
    
    // Get max order for new item
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(item_order), 0) as max_order FROM checklist_items WHERE task_id = $1',
      [params.id]
    );
    const nextOrder = maxOrderResult.rows[0].max_order + 1;
    
    const result = await query(
      `INSERT INTO checklist_items (task_id, text, level, parent_id, created_by, item_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [params.id, text, level, parentId, createdBy, nextOrder]
    );
    
    // Add history entry
    await query(
      `INSERT INTO history_entries (task_id, action_type, user_id, description)
       VALUES ($1, $2, $3, $4)`,
      [params.id, 'checklist_updated', createdBy, 'Добавлен пункт чек-листа']
    );
    
    const item = result.rows[0];
    const formattedItem = {
      id: item.id,
      text: item.text,
      completed: item.completed,
      createdBy: item.created_by,
      completedBy: item.completed_by,
      parentId: item.parent_id,
      level: item.level,
      order: item.item_order,
      createdAt: item.created_at,
      completedAt: item.completed_at
    };
    
    return NextResponse.json({ success: true, data: formattedItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating checklist item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create checklist item' },
      { status: 500 }
    );
  }
}