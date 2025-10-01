import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import { getUserCompanyInfo } from '@/src/lib/utils/multiTenant';

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
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeCount = searchParams.get('includeCount') === 'true';

    let tagsQuery = `
      SELECT 
        t.name
        ${includeCount ? ', COUNT(tt.task_id) as count' : ''}
      FROM (
        SELECT DISTINCT unnest(tags) as name 
        FROM tasks 
        WHERE tags IS NOT NULL 
        AND array_length(tags, 1) > 0
        AND (is_deleted = false OR is_deleted IS NULL)
        AND company_id = $1
      ) t
      ${includeCount ? 'LEFT JOIN tasks tt ON t.name = ANY(tt.tags) AND (tt.is_deleted = false OR tt.is_deleted IS NULL) AND tt.company_id = $1' : ''}
    `;

    const params: any[] = [userCompanyInfo.companyId];
    let paramIndex = 2;

    if (search) {
      tagsQuery += ` WHERE t.name ILIKE ${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (includeCount) {
      tagsQuery += ` GROUP BY t.name`;
    }

    tagsQuery += ` ORDER BY ${includeCount ? 'count DESC, ' : ''}t.name ASC`;
    
    if (limit > 0) {
      tagsQuery += ` LIMIT ${paramIndex}`;
      params.push(limit);
    }

    const result = await query(tagsQuery, params);

    const tags = result.rows.map(row => ({
      name: row.name,
      ...(includeCount && { count: parseInt(row.count) || 0 })
    }));

    return NextResponse.json({
      success: true,
      data: tags,
      total: tags.length
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
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

    const body = await request.json();
    const { action, tags } = body;

    if (action === 'statistics' && Array.isArray(tags)) {
      // Получаем статистику по тегам (только для данной компании)
      const statsQuery = `
        SELECT 
          tag,
          COUNT(*) as total_tasks,
          JSON_AGG(
            JSON_BUILD_OBJECT('status', status, 'count', status_count)
          ) as status_distribution,
          JSON_AGG(
            JSON_BUILD_OBJECT('priority', priority, 'count', priority_count)
          ) as priority_distribution
        FROM (
          SELECT 
            unnest(tags) as tag,
            status,
            priority,
            COUNT(*) OVER (PARTITION BY unnest(tags), status) as status_count,
            COUNT(*) OVER (PARTITION BY unnest(tags), priority) as priority_count
          FROM tasks 
          WHERE tags && $1
          AND (is_deleted = false OR is_deleted IS NULL)
          AND company_id = $2
        ) t
        GROUP BY tag
      `;

      const result = await query(statsQuery, [tags, userCompanyInfo.companyId]);
      
      return NextResponse.json({
        success: true,
        data: result.rows
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing tags request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}