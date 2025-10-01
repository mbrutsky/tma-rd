import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { DatabaseUser } from '@/src/lib/models/types';
import { getUserCompanyInfo, validateUserAccess } from '@/src/lib/utils/multiTenant';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Проверяем доступ к пользователю
    const hasAccess = await validateUserAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "User not found or access denied" },
        { status: 404 }
      );
    }

    const result = await query<DatabaseUser>(
      `SELECT 
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
      FROM users WHERE id = $1 AND company_id = $2`,
      [params.id, userCompanyInfo.companyId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = result.rows[0];
    const formattedUser = {
      ...user,
      isActive: user.is_active,
      simplifiedControl: user.simplified_control,
      notificationSettings: user.notification_settings,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
    
    return NextResponse.json({ success: true, data: formattedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Проверяем доступ к пользователю
    const hasAccess = await validateUserAccess(params.id, userCompanyInfo.companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "User not found or access denied" },
        { status: 404 }
      );
    }

    // Дополнительная проверка прав - только директор или сам пользователь может редактировать
    if (userCompanyInfo.userRole !== 'director' && userCompanyInfo.userId !== params.id) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to edit user" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, username, avatar, role, position, email, phone, isActive, simplifiedControl, notificationSettings } = body;
    
    const result = await query<DatabaseUser>(
      `UPDATE users SET 
        name = COALESCE($2, name),
        username = COALESCE($3, username),
        avatar = COALESCE($4, avatar),
        role = COALESCE($5, role),
        position = COALESCE($6, position),
        email = COALESCE($7, email),
        phone = COALESCE($8, phone),
        is_active = COALESCE($9, is_active),
        simplified_control = COALESCE($10, simplified_control),
        notification_settings = COALESCE($11, notification_settings),
        updated_at = NOW()
      WHERE id = $1 AND company_id = $12
      RETURNING *`,
      [params.id, name, username, avatar, role, position, email, phone, isActive, simplifiedControl, notificationSettings, userCompanyInfo.companyId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = result.rows[0];
    const formattedUser = {
      ...user,
      isActive: user.is_active,
      simplifiedControl: user.simplified_control,
      notificationSettings: user.notification_settings,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
    
    return NextResponse.json({ success: true, data: formattedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}