// app/api/users/route.ts - Updated with multi-tenant support

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { DatabaseUser, CreateUserRequest } from '@/src/lib/models/types';
import { getUserCompanyInfo } from '@/src/lib/utils/multiTenant';

export async function GET(request: NextRequest) {
  try {
    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    
    let queryText = `
      SELECT 
        id,
        name,
        username,
        avatar,
        role,
        position,
        email,
        phone,
        is_active,
        simplified_control,
        notification_settings,
        company_id,
        created_at,
        updated_at
      FROM users
      WHERE company_id = $1
    `;
    
    const params: any[] = [userCompanyInfo.companyId];
    let paramIndex = 2;
    
    if (active === 'true') {
      queryText += ` AND is_active = $${paramIndex}`;
      params.push(true);
      paramIndex++;
    }
    
    queryText += ' ORDER BY name';
    
    const result = await query<DatabaseUser>(queryText, params);
    
    const users = result.rows.map(user => ({
      ...user,
      isActive: user.is_active,
      simplifiedControl: user.simplified_control,
      notificationSettings: user.notification_settings,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
    
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Проверяем права - только директор может создавать пользователей
    if (userCompanyInfo.userRole !== 'director') {
      return NextResponse.json(
        { success: false, error: "Only directors can create users" },
        { status: 403 }
      );
    }

    const body: CreateUserRequest = await request.json();
    const { name, username, avatar, role, position, email, phone } = body;
    
    const result = await query<DatabaseUser>(
      `INSERT INTO users (name, username, avatar, role, position, email, phone, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, username, avatar, role, position, email, phone, userCompanyInfo.companyId]
    );
    
    const user = result.rows[0];
    const formattedUser = {
      ...user,
      isActive: user.is_active,
      simplifiedControl: user.simplified_control,
      notificationSettings: user.notification_settings,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
    
    return NextResponse.json({ success: true, data: formattedUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}