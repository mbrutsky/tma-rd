// app/api/feedback/stats/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { getUserCompanyInfo } from '@/src/lib/utils/multiTenant';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const userIds = searchParams.get('userIds')?.split(',') || [];
    
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    // Валидируем, что все пользователи из той же компании
    const userValidationResult = await query(
      'SELECT id FROM users WHERE id = ANY($1) AND company_id = $2',
      [userIds, userCompanyInfo.companyId]
    );
    
    if (userValidationResult.rows.length !== userIds.length) {
      return NextResponse.json(
        { success: false, error: "Some users are not from the same company" },
        { status: 400 }
      );
    }
    
    // Создаем плейсхолдеры для параметров
    const placeholders = userIds.map((_, index) => `${index + 2}`).join(',');
    
    const result = await query(`
      SELECT 
        u.id as user_id,
        u.name,
        u.avatar,
        COALESCE(gratitudes.count, 0) as gratitudes,
        COALESCE(remarks.count, 0) as remarks,
        (COALESCE(gratitudes.count, 0) - COALESCE(remarks.count, 0)) as score
      FROM users u
      LEFT JOIN (
        SELECT to_user_id, COUNT(*) as count
        FROM feedback 
        WHERE type = 'gratitude' 
          AND to_user_id = ANY(${userIds.length + 2})
          AND company_id = $1
        GROUP BY to_user_id
      ) gratitudes ON u.id = gratitudes.to_user_id
      LEFT JOIN (
        SELECT to_user_id, COUNT(*) as count
        FROM feedback 
        WHERE type = 'remark' 
          AND to_user_id = ANY(${userIds.length + 2})
          AND company_id = $1
        GROUP BY to_user_id
      ) remarks ON u.id = remarks.to_user_id
      WHERE u.id IN (${placeholders}) AND u.company_id = $1
      ORDER BY score DESC
    `, [userCompanyInfo.companyId, ...userIds, userIds]);
    
    const stats = result.rows.map(row => ({
      userId: row.user_id,
      name: row.name,
      avatar: row.avatar,
      gratitudes: parseInt(row.gratitudes),
      remarks: parseInt(row.remarks),
      score: parseInt(row.score)
    }));
    
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback stats' },
      { status: 500 }
    );
  }
}