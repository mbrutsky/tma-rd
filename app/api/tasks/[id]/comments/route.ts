// app/api/tasks/[id]/comments/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { getUserCompanyInfo, validateTaskAccess } from '@/src/lib/utils/multiTenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
        ? (process.env.NEXT_PUBLIC_DOMAIN ?? '*')
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
      'Access-Control-Max-Age': '86400',
    },
  });
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
        c.id, c.task_id, c.author_id, c.text, c.is_result, c.is_edited, c.ai_score,
        c.created_at, c.edited_at,
        u.name as author_name, u.avatar as author_avatar, u.role as author_role
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id AND u.company_id = $2
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [params.id, userCompanyInfo.companyId]
    );

    const comments = result.rows.map(row => ({
      id: row.id,
      author_id: row.author_id,
      text: row.text,
      is_result: row.is_result,
      is_edited: row.is_edited,
      ai_score: row.ai_score,
      created_at: row.created_at,
      edited_at: row.edited_at,
      author: row.author_name ? {
        id: row.author_id, name: row.author_name, avatar: row.author_avatar, role: row.author_role
      } : null
    }));

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('POST /api/tasks/' + params.id + '/comments started');

    // Multi-tenant проверка
    const userCompanyInfo = await getUserCompanyInfo(request);
    if (!userCompanyInfo.companyId) {
      return NextResponse.json({ success: false, error: "User not assigned to any company" }, { status: 403 });
    }

    const hasAccess = await validateTaskAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Task not found or access denied" }, { status: 404 });
    }

    const { sanitizeAndFormatHTML } = await import('@/src/lib/utils/htmlUtils');

    const body = await request.json() as { text: string; isResult?: boolean };
    const { text, isResult = false } = body;

    const authorId = userCompanyInfo.userId;

    const taskCheck = await query('SELECT id, is_deleted FROM tasks WHERE id = $1', [params.id]);
    if (taskCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (taskCheck.rows[0].is_deleted) {
      return NextResponse.json(
        { success: false, error: 'Cannot add comments to task in trash', message: 'Задача находится в корзине' },
        { status: 403 }
      );
    }

    const cleanText = sanitizeAndFormatHTML(text, 'TIPTAP');

    const commentResult = await query(
      `INSERT INTO comments (task_id, author_id, text, is_result, ai_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, task_id, author_id, text, is_result, is_edited, ai_score, created_at, edited_at`,
      [params.id, authorId, cleanText, isResult, null]
    );

    await query(
      `INSERT INTO history_entries (task_id, action_type, user_id, description)
       VALUES ($1, $2, $3, $4)`,
      [params.id, 'comment_added', authorId, isResult ? 'Добавлен результат выполнения' : 'Добавлен комментарий']
    );

    const author = await query(
      `SELECT id, name, avatar, role FROM users WHERE id = $1 AND company_id = $2`, 
      [authorId, userCompanyInfo.companyId]
    ).then(r => r.rows[0] || null);

    const c = commentResult.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: c.id,
        author_id: c.author_id,
        text: c.text,
        is_result: c.is_result,
        is_edited: c.is_edited,
        ai_score: c.ai_score,
        created_at: c.created_at,
        edited_at: c.edited_at,
        author: author ? { id: author.id, name: author.name, avatar: author.avatar, role: author.role } : null
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment', details: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}