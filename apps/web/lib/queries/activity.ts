import { query } from '../db';
import type { ActivityLogEntry } from '@wa-transparency/db';

export async function getRecentActivity(limit = 50): Promise<ActivityLogEntry[]> {
  const result = await query<ActivityLogEntry>(
    `SELECT * FROM activity_log
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getActivityByEntity(
  entityId: string,
  limit = 50
): Promise<ActivityLogEntry[]> {
  const result = await query<ActivityLogEntry>(
    `SELECT * FROM activity_log
     WHERE entity_id = $1 OR related_entity_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getActivityByType(
  activityType: string,
  limit = 50
): Promise<ActivityLogEntry[]> {
  const result = await query<ActivityLogEntry>(
    `SELECT * FROM activity_log
     WHERE activity_type = $1
     ORDER BY created_at DESC
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
