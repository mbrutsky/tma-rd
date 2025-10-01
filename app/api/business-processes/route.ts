// app/api/business-processes/route.ts - Updated with multi-tenant support

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { DatabaseBusinessProcess, CreateBusinessProcessRequest } from '@/src/lib/models/types';
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
        bp.*,
        u.name as creator_name,
        u.avatar as creator_avatar
      FROM business_processes bp
      LEFT JOIN users u ON bp.creator_id = u.id
      WHERE bp.company_id = $1
    `;
    
    const params: any[] = [userCompanyInfo.companyId];
    let paramIndex = 2;
    
    if (active === 'true') {
      queryText += ` AND bp.is_active = $${paramIndex}`;
      params.push(true);
      paramIndex++;
    }
    
    queryText += ' ORDER BY bp.created_at DESC';
    
    const result = await query(queryText, params);
    
    const processes = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      creatorId: row.creator_id,
      isActive: row.is_active,
      companyId: row.company_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creator: row.creator_name ? {
        id: row.creator_id,
        name: row.creator_name,
        avatar: row.creator_avatar
      } : null,
      steps: []
    }));
    
    return NextResponse.json({ success: true, data: processes });
  } catch (error) {
    console.error('Error fetching business processes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business processes' },
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

    const body: CreateBusinessProcessRequest = await request.json();
    const { name, description } = body;
    
    const creatorId = userCompanyInfo.userId;
    
    const result = await query<DatabaseBusinessProcess>(
      `INSERT INTO business_processes (name, description, creator_id, company_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, creatorId, userCompanyInfo.companyId]
    );
    
    const process = result.rows[0];
    const formattedProcess = {
      id: process.id,
      name: process.name,
      description: process.description,
      creatorId: process.creator_id,
      isActive: process.is_active,
      companyId: process.company_id,
      createdAt: process.created_at,
      updatedAt: process.updated_at,
      steps: []
    };
    
    return NextResponse.json({ success: true, data: formattedProcess }, { status: 201 });
  } catch (error) {
    console.error('Error creating business process:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create business process' },
      { status: 500 }
    );
  }
}