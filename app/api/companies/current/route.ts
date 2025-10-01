// app/api/companies/current/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const userId = request.headers.get('x-user-id');
    
    const result = await query(`
      SELECT 
        c.*,
        u.name as director_name,
        u.avatar as director_avatar,
        u.email as director_email,
        u.position as director_position,
        (
          SELECT COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', emp.id,
                'name', emp.name,
                'avatar', emp.avatar,
                'role', emp.role,
                'position', emp.position,
                'email', emp.email,
                'is_active', emp.is_active
              )
            ), '[]'::json
          )
          FROM users emp 
          WHERE emp.company_id = c.id
        ) as employees
      FROM users cu
      JOIN companies c ON cu.company_id = c.id
      LEFT JOIN users u ON c.director_app_user_id = u.id
      WHERE cu.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Company not found for current user' },
        { status: 404 }
      );
    }
    
    const row = result.rows[0];
    const company = {
      id: row.id,
      director_telegram_user_id: row.director_telegram_user_id,
      director_telegram_username: row.director_telegram_username,
      director_app_user_id: row.director_app_user_id,
      plan: row.plan,
      employee_user_ids: row.employee_user_ids || [],
      connected_at: row.connected_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      director: row.director_name ? {
        id: row.director_app_user_id,
        name: row.director_name,
        avatar: row.director_avatar,
        email: row.director_email,
        position: row.director_position
      } : null,
      employees: row.employees || []
    };
    
    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    console.error('Error fetching current user company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}