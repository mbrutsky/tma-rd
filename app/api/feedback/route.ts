import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { DatabaseFeedback, FeedbackType } from '@/src/lib/models/types';
import { getUserCompanyInfo, validateUserAccess, validateTaskAccess } from '@/src/lib/utils/multiTenant';

interface CreateFeedbackRequest {
  type: FeedbackType;
  to_user_id: string;
  task_id?: string;
  message: string;
}

export async function GET(request: NextRequest) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as FeedbackType | null;
    const userId = searchParams.get('userId');
    const period = searchParams.get('period');
    
    let queryText = `
      SELECT 
        f.id,
        f.type,
        f.from_user_id,
        f.to_user_id,
        f.task_id,
        f.message,
        f.is_automatic,
        f.created_at,
        from_user.name as from_user_name,
        from_user.avatar as from_user_avatar,
        to_user.name as to_user_name,
        to_user.avatar as to_user_avatar,
        t.title as task_title
      FROM feedback f
      LEFT JOIN users from_user ON f.from_user_id = from_user.id AND from_user.company_id = f.company_id
      LEFT JOIN users to_user ON f.to_user_id = to_user.id AND to_user.company_id = f.company_id
      LEFT JOIN tasks t ON f.task_id = t.id AND t.company_id = f.company_id
      WHERE f.company_id = $1
    `;
    
    const params: any[] = [userCompanyInfo.companyId];
    let paramIndex = 2;
    
    if (type) {
      queryText += ` AND f.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (userId) {
      // Валидируем доступ к пользователю
      const hasAccess = await validateUserAccess(userId, userCompanyInfo.companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "Access denied to user feedback" },
          { status: 403 }
        );
      }
      
      queryText += ` AND (f.from_user_id = $${paramIndex} OR f.to_user_id = $${paramIndex})`;
      params.push(userId);
      paramIndex++;
    }
    
    if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(0);
      }
      
      queryText += ` AND f.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    queryText += ' ORDER BY f.created_at DESC';
    
    const result = await query(queryText, params);
    
    const feedbackItems = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      from_user_id: row.from_user_id,
      to_user_id: row.to_user_id,
      task_id: row.task_id,
      message: row.message,
      is_automatic: row.is_automatic,
      created_at: row.created_at,
      from_user: row.from_user_name ? {
        id: row.from_user_id,
        name: row.from_user_name,
        avatar: row.from_user_avatar
      } : null,
      to_user: row.to_user_name ? {
        id: row.to_user_id,
        name: row.to_user_name,
        avatar: row.to_user_avatar
      } : null,
      task: row.task_title ? {
        id: row.task_id,
        title: row.task_title
      } : null
    }));
    
    return NextResponse.json({ success: true, data: feedbackItems });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const body: CreateFeedbackRequest = await request.json();
    const { type, to_user_id, task_id, message } = body;
    
    // Валидируем получателя
    const hasAccessToUser = await validateUserAccess(to_user_id, userCompanyInfo.companyId);
    if (!hasAccessToUser) {
      return NextResponse.json(
        { success: false, error: "Recipient user not found or not accessible" },
        { status: 400 }
      );
    }
    
    // Валидируем задачу если указана
    if (task_id) {
      const hasAccessToTask = await validateTaskAccess(task_id, userCompanyInfo.companyId);
      if (!hasAccessToTask) {
        return NextResponse.json(
          { success: false, error: "Task not found or not accessible" },
          { status: 400 }
        );
      }
    }
    
    const from_user_id = userCompanyInfo.userId;
    
    const result = await query<DatabaseFeedback>(
      `INSERT INTO feedback (type, from_user_id, to_user_id, task_id, message, is_automatic, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [type, from_user_id, to_user_id, task_id, message, false, userCompanyInfo.companyId]
    );
    
    // Get user information for the response
    const userResult = await query(
      `SELECT 
        from_user.name as from_user_name,
        from_user.avatar as from_user_avatar,
        to_user.name as to_user_name,
        to_user.avatar as to_user_avatar
      FROM users from_user, users to_user
      WHERE from_user.id = $1 AND to_user.id = $2 AND from_user.company_id = $3 AND to_user.company_id = $3`,
      [from_user_id, to_user_id, userCompanyInfo.companyId]
    );
    
    const feedback = result.rows[0];
    const userInfo = userResult.rows[0];
    
    const formattedFeedback = {
      id: feedback.id,
      type: feedback.type,
      from_user_id: feedback.from_user_id,
      to_user_id: feedback.to_user_id,
      task_id: feedback.task_id,
      message: feedback.message,
      is_automatic: feedback.is_automatic,
      created_at: feedback.created_at,
      from_user: userInfo ? {
        id: feedback.from_user_id,
        name: userInfo.from_user_name,
        avatar: userInfo.from_user_avatar
      } : null,
      to_user: userInfo ? {
        id: feedback.to_user_id,
        name: userInfo.to_user_name,
        avatar: userInfo.to_user_avatar
      } : null,
      task: null
    };
    
    return NextResponse.json({ success: true, data: formattedFeedback }, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}