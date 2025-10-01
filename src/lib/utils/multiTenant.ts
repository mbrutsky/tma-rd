// src/lib/utils/multiTenant.ts

import { NextRequest } from 'next/server';
import { query } from '@/src/lib/db';

export interface UserCompanyInfo {
  userId: string;
  companyId: string | null;
  userRole: string;
}

/**
 * Получает информацию о пользователе и его компании
 * @throws {Error} Если userId не указан или пользователь не найден
 */
export async function getUserCompanyInfo(request: NextRequest): Promise<UserCompanyInfo> {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    throw new Error('User ID not provided in request headers');
  }
  
  const result = await query(
    'SELECT company_id, role FROM users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  
  return {
    userId,
    companyId: user.company_id,
    userRole: user.role
  };
}

/**
 * Безопасная версия getUserCompanyInfo, которая возвращает null при ошибке
 */
export async function tryGetUserCompanyInfo(request: NextRequest): Promise<UserCompanyInfo | null> {
  try {
    return await getUserCompanyInfo(request);
  } catch (error) {
    console.error('Failed to get user company info:', error);
    return null;
  }
}

/**
 * Проверяет права доступа к ресурсу
 */
export function checkAccess(userRole: string, requiredRoles: string[] = []): boolean {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
}

/**
 * Добавляет условие фильтрации по company_id к WHERE клаузуле
 */
export function addCompanyFilter(
  whereConditions: string[],
  params: any[],
  companyId: string | null,
  tableAlias: string = ''
): { whereConditions: string[], params: any[], paramIndex: number } {
  const paramIndex = params.length + 1;
  
  if (companyId) {
    const field = tableAlias ? `${tableAlias}.company_id` : 'company_id';
    whereConditions.push(`${field} = $${paramIndex}`);
    params.push(companyId);
  }
  
  return { whereConditions, params, paramIndex: paramIndex + 1 };
}

/**
 * Добавляет фильтр по provider_type для Telegram связанных таблиц
 */
export function addProviderTypeFilter(
  whereConditions: string[],
  params: any[],
  tableAlias: string = ''
): { whereConditions: string[], params: any[], paramIndex: number } {
  const paramIndex = params.length + 1;
  const field = tableAlias ? `${tableAlias}.provider_type` : 'provider_type';
  
  whereConditions.push(`${field} = $${paramIndex}`);
  params.push('dc');
  
  return { whereConditions, params, paramIndex: paramIndex + 1 };
}

/**
 * Валидирует доступ к задаче через company_id
 */
export async function validateTaskAccess(taskId: string, companyId: string | null): Promise<boolean> {
  if (!companyId) return false;
  
  const result = await query(
    'SELECT id FROM tasks WHERE id = $1 AND company_id = $2',
    [taskId, companyId]
  );
  
  return result.rows.length > 0;
}

/**
 * Валидирует доступ к пользователю через company_id
 */
export async function validateUserAccess(targetUserId: string, companyId: string | null): Promise<boolean> {
  if (!companyId) return false;
  
  const result = await query(
    'SELECT id FROM users WHERE id = $1 AND company_id = $2',
    [targetUserId, companyId]
  );
  
  return result.rows.length > 0;
}

/**
 * Валидирует доступ к бизнес-процессу через company_id
 */
export async function validateBusinessProcessAccess(processId: string, companyId: string | null): Promise<boolean> {
  if (!companyId) return false;
  
  const result = await query(
    'SELECT id FROM business_processes WHERE id = $1 AND company_id = $2',
    [processId, companyId]
  );
  
  return result.rows.length > 0;
}

/**
 * Валидирует доступ к группе Telegram через company_id
 */
export async function validateTelegramGroupAccess(groupId: string, companyId: string | null): Promise<boolean> {
  if (!companyId) return false;
  
  const result = await query(
    'SELECT id FROM tg_chat_bindings WHERE id = $1 AND company_id = $2 AND provider_type = $3',
    [groupId, companyId, 'dc']
  );
  
  return result.rows.length > 0;
}