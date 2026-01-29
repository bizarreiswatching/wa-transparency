import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ActivityLogEntry } from '@wa-transparency/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Build query based on type filter
    let whereClause = '';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (type !== 'all') {
      whereClause = `WHERE activity_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM activity_log ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get paginated results
    const result = await query<ActivityLogEntry>(
      `SELECT * FROM activity_log
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
