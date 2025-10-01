// app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { CreateCompanyRequest } from '@/src/lib/models/types';

export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT 
        c.*,
        u.name as director_name,
        u.avatar as director_avatar,
        u.email as director_email
      FROM companies c
      LEFT JOIN users u ON c.director_app_user_id = u.id
      ORDER BY c.created_at DESC
    `);
    
    const companies = result.rows.map(row => ({
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
        email: row.director_email
      } : null
    }));
    
    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCompanyRequest = await request.json();
    const { 
      director_telegram_user_id,
      director_telegram_username,
      director_app_user_id,
      plan = 'free',
      employee_user_ids = []
    } = body;
    
    const result = await query(
      `INSERT INTO companies (
        director_telegram_user_id, 
        director_telegram_username, 
        director_app_user_id, 
        plan, 
        employee_user_ids
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        director_telegram_user_id,
        director_telegram_username,
        director_app_user_id,
        plan,
        employee_user_ids
      ]
    );
    
    const company = result.rows[0];
    
    // Обновляем company_id у пользователей
    if (employee_user_ids.length > 0) {
      await query(
        `UPDATE users SET company_id = $1 WHERE id = ANY($2)`,
        [company.id, employee_user_ids]
      );
    }
    
    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    );
  }
}