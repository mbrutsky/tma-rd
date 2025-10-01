// app/api/tasks/[id]/checklist/[itemId]/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/src/lib/db";
import { getUserCompanyInfo, validateTaskAccess } from '@/src/lib/utils/multiTenant';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    // Проверяем, не удалена ли задача
    const taskCheck = await query(
      "SELECT is_deleted FROM tasks WHERE id = $1",
      [params.id]
    );

    if (taskCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    if (taskCheck.rows[0].is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot modify checklist in task in trash",
          message: "Задача находится в корзине",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { text, completed } = body;
    const userId = userCompanyInfo.userId;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    updateValues.push(params.itemId);
    updateValues.push(params.id);
    paramIndex = 3;

    if (text !== undefined) {
      updateFields.push(`text = ${paramIndex}`);
      updateValues.push(text);
      paramIndex++;
    }

    if (completed !== undefined) {
      updateFields.push(`completed = ${paramIndex}`);
      updateValues.push(completed);
      paramIndex++;

      if (completed) {
        updateFields.push(`completed_at = NOW()`);
        updateFields.push(`completed_by = ${paramIndex}`);
        updateValues.push(userId);
        paramIndex++;
      } else {
        updateFields.push(`completed_at = NULL`);
        updateFields.push(`completed_by = NULL`);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE checklist_items 
       SET ${updateFields.join(", ")}
       WHERE id = $1 AND task_id = $2
       RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Checklist item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating checklist item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update checklist item" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    const taskCheck = await query(
      "SELECT is_deleted FROM tasks WHERE id = $1",
      [params.id]
    );

    if (taskCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    if (taskCheck.rows[0].is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot modify checklist structure in task in trash",
          message: "Задача находится в корзине",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, direction } = body;

    const result = await transaction(async (client) => {
      const currentItemResult = await client.query(
        "SELECT * FROM checklist_items WHERE id = $1 AND task_id = $2",
        [params.itemId, params.id]
      );

      if (currentItemResult.rows.length === 0) {
        throw new Error("Checklist item not found");
      }

      const currentItem = currentItemResult.rows[0];

      if (action === "indent") {
        const newLevel = Math.min(currentItem.level + 1, 5);
        await client.query(
          "UPDATE checklist_items SET level = $1 WHERE id = $2",
          [newLevel, params.itemId]
        );
      } else if (action === "outdent") {
        const newLevel = Math.max(currentItem.level - 1, 0);
        await client.query(
          "UPDATE checklist_items SET level = $1 WHERE id = $2",
          [newLevel, params.itemId]
        );
      } else if (action === "move") {
        const allItemsResult = await client.query(
          "SELECT id, item_order FROM checklist_items WHERE task_id = $1 ORDER BY item_order",
          [params.id]
        );

        const allItems = allItemsResult.rows;
        const currentIndex = allItems.findIndex(
          (item: { id: string }) => item.id === params.itemId
        );

        if (currentIndex === -1) {
          throw new Error("Item not found in list");
        }

        let targetIndex;
        if (direction === "up" && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        } else if (direction === "down" && currentIndex < allItems.length - 1) {
          targetIndex = currentIndex + 1;
        } else {
          return currentItem;
        }

        const targetItem = allItems[targetIndex];

        await client.query(
          "UPDATE checklist_items SET item_order = $1 WHERE id = $2",
          [targetItem.item_order, params.itemId]
        );

        await client.query(
          "UPDATE checklist_items SET item_order = $1 WHERE id = $2",
          [currentItem.item_order, targetItem.id]
        );
      }

      const updatedResult = await client.query(
        "SELECT * FROM checklist_items WHERE id = $1",
        [params.itemId]
      );

      return updatedResult.rows[0];
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating checklist structure:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as any).message || "Failed to update checklist structure",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    const taskCheck = await query(
      "SELECT is_deleted FROM tasks WHERE id = $1",
      [params.id]
    );

    if (taskCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    if (taskCheck.rows[0].is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete checklist items in task in trash",
          message: "Задача находится в корзине",
        },
        { status: 403 }
      );
    }

    const result = await query(
      "DELETE FROM checklist_items WHERE id = $1 AND task_id = $2 RETURNING id",
      [params.itemId, params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Checklist item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Checklist item deleted",
    });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete checklist item" },
      { status: 500 }
    );
  }
}