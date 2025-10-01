// app/api/tasks/[id]/comments/[commentId]/route.ts - Updated with multi-tenant support
import { query } from "@/src/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeAndFormatHTML } from '@/src/lib/utils/htmlUtils';
import { getUserCompanyInfo, validateTaskAccess } from '@/src/lib/utils/multiTenant';

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string, commentId: string } }
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
        { success: false, error: 'Cannot modify comments in task in trash', message: 'Задача находится в корзине' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { text } = body;
    
    const cleanText = sanitizeAndFormatHTML(text, 'TIPTAP');
    
    const result = await query(
      `UPDATE comments 
       SET text = $1, is_edited = true, edited_at = NOW()
       WHERE id = $2 AND task_id = $3
       RETURNING *`,
      [cleanText, params.commentId, params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    const comment = result.rows[0];
    const formattedComment = {
      id: comment.id,
      authorId: comment.author_id,
      text: comment.text,
      isResult: comment.is_result,
      isEdited: comment.is_edited,
      aiScore: comment.ai_score,
      timestamp: comment.created_at,
      editedAt: comment.edited_at
    };
    
    return NextResponse.json({ success: true, data: formattedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string, commentId: string } }
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
        { success: false, error: 'Cannot delete comments in task in trash', message: 'Задача находится в корзине' },
        { status: 403 }
      );
    }

    const result = await query(
      `DELETE FROM comments 
       WHERE id = $1 AND task_id = $2
       RETURNING id`,
      [params.commentId, params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}