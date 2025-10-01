// app/api/tasks/[id]/link/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { getUserCompanyInfo, validateTaskAccess } from '@/src/lib/utils/multiTenant';

export async function GET(
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

    // Проверяем, существует ли задача
    const taskResult = await query(
      'SELECT id, title, is_deleted FROM tasks WHERE id = $1 AND company_id = $2',
      [params.id, userCompanyInfo.companyId]
    );
    
    if (taskResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    const task = taskResult.rows[0];
    
    // Генерируем ссылку
    const baseUrl = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const taskUrl = `${protocol}://${baseUrl}/task/${params.id}`;
    
    return NextResponse.json({ 
      success: true, 
      data: {
        url: taskUrl,
        taskId: task.id,
        taskTitle: task.title,
        isDeleted: task.is_deleted,
        shortUrl: taskUrl
      }
    });
  } catch (error) {
    console.error('Error generating task link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate task link' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { expiration, accessCode } = body;
    
    const baseUrl = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const taskUrl = `${protocol}://${baseUrl}/task/${params.id}`;
    
    return NextResponse.json({ 
      success: true, 
      data: {
        url: taskUrl,
        taskId: params.id,
        expiration: expiration,
        accessCode: accessCode,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating secure task link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create secure task link' },
      { status: 500 }
    );
  }
}