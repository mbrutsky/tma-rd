// app/api/telegram-groups/route.ts - Updated with multi-tenant support

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { UserRole } from '@/src/lib/models/types';
import { getUserCompanyInfo, validateUserAccess } from '@/src/lib/utils/multiTenant';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Проверяем права доступа - только директор
    if (userCompanyInfo.userRole !== UserRole.DIRECTOR && userCompanyInfo.userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only directors can manage Telegram groups' },
        { status: 403 }
      );
    }

    // Получаем все Telegram группы для данной компании с фильтрацией по provider_type = 'dc'
    const groupsResult = await query(`
      SELECT 
        tg.id,
        tg.company_id,
        tg.chat_id,
        tg.provider_type,
        tg.provider_config_id,
        tg.default_assignee_option,
        tg.is_active,
        tg.created_at,
        tg.updated_at,
        u.name as default_assignee_name,
        u.position as default_assignee_position
      FROM tg_chat_bindings tg
      LEFT JOIN users u ON tg.default_assignee_option::uuid = u.id AND u.company_id = tg.company_id
      WHERE tg.company_id = $1 AND tg.provider_type = $2
      ORDER BY tg.created_at DESC
    `, [userCompanyInfo.companyId, 'dc']);

    const groups = groupsResult.rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      chatId: row.chat_id,
      providerType: row.provider_type,
      providerConfigId: row.provider_config_id,
      defaultAssigneeOption: row.default_assignee_option,
      defaultAssigneeName: row.default_assignee_name,
      defaultAssigneePosition: row.default_assignee_position,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: groups
    });

  } catch (error) {
    console.error('Error fetching Telegram groups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Telegram groups' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Получаем информацию о пользователе и компании
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Проверяем права доступа - только директор
    if (userCompanyInfo.userRole !== UserRole.DIRECTOR && userCompanyInfo.userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only directors can manage Telegram groups' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, isActive, defaultAssigneeOption } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Проверяем, что группа принадлежит компании пользователя
    const existingGroup = await query(
      'SELECT id, company_id FROM tg_chat_bindings WHERE id = $1 AND company_id = $2 AND provider_type = $3',
      [id, userCompanyInfo.companyId, 'dc']
    );

    if (existingGroup.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Telegram group not found or access denied' },
        { status: 404 }
      );
    }

    // Если указан defaultAssigneeOption, проверяем, что пользователь существует и из той же компании
    if (defaultAssigneeOption) {
      const hasAccess = await validateUserAccess(defaultAssigneeOption, userCompanyInfo.companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Default assignee user not found or not from the same company' },
          { status: 400 }
        );
      }
    }

    // Строим динамический запрос обновления
    const updates = [];
    const values = [id, userCompanyInfo.companyId];
    let paramIndex = 3;

    if (typeof isActive === 'boolean') {
      updates.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (defaultAssigneeOption !== undefined) {
      updates.push(`default_assignee_option = $${paramIndex}`);
      values.push(defaultAssigneeOption);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Всегда обновляем updated_at
    updates.push('updated_at = NOW()');

    const updateQuery = `
      UPDATE tg_chat_bindings 
      SET ${updates.join(', ')}
      WHERE id = $1 AND company_id = $2 AND provider_type = 'dc'
      RETURNING *
    `;

    const result = await query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Group not found or update failed' },
        { status: 404 }
      );
    }

    const updatedGroup = result.rows[0];

    // Получаем обновленную информацию с данными пользователя
    const groupWithUserInfo = await query(`
      SELECT 
        tg.id,
        tg.company_id,
        tg.chat_id,
        tg.provider_type,
        tg.provider_config_id,
        tg.default_assignee_option,
        tg.is_active,
        tg.created_at,
        tg.updated_at,
        u.name as default_assignee_name,
        u.position as default_assignee_position
      FROM tg_chat_bindings tg
      LEFT JOIN users u ON tg.default_assignee_option::uuid = u.id AND u.company_id = tg.company_id
      WHERE tg.id = $1 AND tg.company_id = $2 AND tg.provider_type = $3
    `, [id, userCompanyInfo.companyId, 'dc']);

    const group = groupWithUserInfo.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        id: group.id,
        companyId: group.company_id,
        chatId: group.chat_id,
        providerType: group.provider_type,
        providerConfigId: group.provider_config_id,
        defaultAssigneeOption: group.default_assignee_option,
        defaultAssigneeName: group.default_assignee_name,
        defaultAssigneePosition: group.default_assignee_position,
        isActive: group.is_active,
        createdAt: group.created_at,
        updatedAt: group.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating Telegram group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Telegram group' },
      { status: 500 }
    );
  }
}