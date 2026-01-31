import { query } from '../db';
import type { ActivityLogEntry } from '@wa-transparency/db';

// Activity items from source tables (contributions, contracts) with unified shape
export interface ActivityItem {
  id: string;
  activity_type: 'contribution' | 'contract' | 'lobbying' | 'bill' | 'vote';
  entity_id?: string;
  related_entity_id?: string;
  title: string;
  description?: string;
  amount?: number;
  activity_date: Date;
  source_url?: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export async function getRecentActivity(limit = 50): Promise<ActivityItem[]> {
  // Query contributions and contracts directly, ordered by actual activity date
  // This ensures we show truly recent activity, not old data that was recently synced
  const result = await query<ActivityItem>(
    `(
      SELECT
        id,
        'contribution'::text as activity_type,
        contributor_entity_id as entity_id,
        recipient_entity_id as related_entity_id,
        contributor_name || ' contributed to ' || recipient_name as title,
        description,
        amount,
        contribution_date as activity_date,
        source_url,
        jsonb_build_object('contribution_id', id) as metadata,
        created_at
      FROM contributions
      WHERE contribution_date >= CURRENT_DATE - INTERVAL '1 year'
        AND contribution_date <= CURRENT_DATE
        AND amount >= 100
      ORDER BY contribution_date DESC
      LIMIT $1
    )
    UNION ALL
    (
      SELECT
        id,
        'contract'::text as activity_type,
        recipient_entity_id as entity_id,
        NULL as related_entity_id,
        awarding_agency || ' awarded contract to ' || recipient_name as title,
        description,
        amount,
        start_date as activity_date,
        source_url,
        jsonb_build_object('contract_id', id) as metadata,
        created_at
      FROM contracts
      WHERE start_date >= CURRENT_DATE - INTERVAL '1 year'
        AND start_date <= CURRENT_DATE
        AND place_of_performance_state = 'WA'
      ORDER BY start_date DESC
      LIMIT $1
    )
    ORDER BY activity_date DESC
    LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getActivityByEntity(
  entityId: string,
  limit = 50
): Promise<ActivityItem[]> {
  const result = await query<ActivityItem>(
    `(
      SELECT
        id,
        'contribution'::text as activity_type,
        contributor_entity_id as entity_id,
        recipient_entity_id as related_entity_id,
        contributor_name || ' contributed to ' || recipient_name as title,
        description,
        amount,
        contribution_date as activity_date,
        source_url,
        jsonb_build_object('contribution_id', id) as metadata,
        created_at
      FROM contributions
      WHERE contributor_entity_id = $1 OR recipient_entity_id = $1
      ORDER BY contribution_date DESC
      LIMIT $2
    )
    UNION ALL
    (
      SELECT
        id,
        'contract'::text as activity_type,
        recipient_entity_id as entity_id,
        NULL as related_entity_id,
        awarding_agency || ' awarded contract to ' || recipient_name as title,
        description,
        amount,
        start_date as activity_date,
        source_url,
        jsonb_build_object('contract_id', id) as metadata,
        created_at
      FROM contracts
      WHERE recipient_entity_id = $1
        AND place_of_performance_state = 'WA'
      ORDER BY start_date DESC
      LIMIT $2
    )
    ORDER BY activity_date DESC
    LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getActivityByType(
  activityType: string,
  limit = 50
): Promise<ActivityItem[]> {
  if (activityType === 'contribution') {
    const result = await query<ActivityItem>(
      `SELECT
        id,
        'contribution'::text as activity_type,
        contributor_entity_id as entity_id,
        recipient_entity_id as related_entity_id,
        contributor_name || ' contributed to ' || recipient_name as title,
        description,
        amount,
        contribution_date as activity_date,
        source_url,
        jsonb_build_object('contribution_id', id) as metadata,
        created_at
      FROM contributions
      WHERE contribution_date >= CURRENT_DATE - INTERVAL '1 year'
        AND contribution_date <= CURRENT_DATE
      ORDER BY contribution_date DESC
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  if (activityType === 'contract') {
    const result = await query<ActivityItem>(
      `SELECT
        id,
        'contract'::text as activity_type,
        recipient_entity_id as entity_id,
        NULL as related_entity_id,
        awarding_agency || ' awarded contract to ' || recipient_name as title,
        description,
        amount,
        start_date as activity_date,
        source_url,
        jsonb_build_object('contract_id', id) as metadata,
        created_at
      FROM contracts
      WHERE start_date >= CURRENT_DATE - INTERVAL '1 year'
        AND start_date <= CURRENT_DATE
        AND place_of_performance_state = 'WA'
      ORDER BY start_date DESC
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // For other types (lobbying, bill, vote), fall back to activity_log
  // These are not yet fully implemented in the source data
  const result = await query<ActivityItem>(
    `SELECT
      id,
      activity_type,
      entity_id,
      related_entity_id,
      title,
      description,
      amount,
      activity_date,
      source_url,
      metadata,
      created_at
    FROM activity_log
    WHERE activity_type = $1
    ORDER BY activity_date DESC
    LIMIT $2`,
    [activityType, limit]
  );
  return result.rows;
}

export async function logActivity(
  activity: Omit<ActivityLogEntry, 'id' | 'created_at'>
): Promise<ActivityLogEntry> {
  const result = await query<ActivityLogEntry>(
    `INSERT INTO activity_log
     (activity_type, entity_id, related_entity_id, title, description, amount, activity_date, source_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      activity.activity_type,
      activity.entity_id,
      activity.related_entity_id,
      activity.title,
      activity.description,
      activity.amount,
      activity.activity_date,
      activity.source_url,
      activity.metadata,
    ]
  );
  return result.rows[0];
}
