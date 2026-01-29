# /query - Run Database Queries

Execute SQL queries against the development database.

## Usage

```
/query [sql or preset]
```

## Preset Queries

| Preset | Description |
|--------|-------------|
| `stats` | Show table row counts |
| `sync-status` | Show sync job status |
| `unmatched` | Count unmatched records |
| `top-donors` | Show top 10 donors |
| `top-recipients` | Show top 10 recipients |
| `recent-activity` | Show recent activity log |

## Implementation

### Connect to Database

```bash
docker exec -it wa-transparency-postgres-1 psql -U wa_user -d wa_transparency
```

### Preset Query Implementations

**stats:**
```sql
SELECT
  'entities' as table_name, COUNT(*) as rows FROM entities
UNION ALL SELECT 'contributions', COUNT(*) FROM contributions
UNION ALL SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL SELECT 'lobbying_registrations', COUNT(*) FROM lobbying_registrations
UNION ALL SELECT 'bills', COUNT(*) FROM bills;
```

**sync-status:**
```sql
SELECT source, status, last_sync_at, last_successful_sync_at,
       records_synced, error_message
FROM sync_state ORDER BY last_sync_at DESC;
```

**unmatched:**
```sql
SELECT 'contributions_no_contributor' as type,
       COUNT(*) FROM contributions WHERE contributor_entity_id IS NULL
UNION ALL SELECT 'contributions_no_recipient',
       COUNT(*) FROM contributions WHERE recipient_entity_id IS NULL
UNION ALL SELECT 'contracts_no_recipient',
       COUNT(*) FROM contracts WHERE recipient_entity_id IS NULL;
```

**top-donors:**
```sql
SELECT e.name, SUM(c.amount) as total
FROM contributions c
JOIN entities e ON c.contributor_entity_id = e.id
GROUP BY e.id, e.name
ORDER BY total DESC LIMIT 10;
```

**top-recipients:**
```sql
SELECT e.name, SUM(c.amount) as total
FROM contributions c
JOIN entities e ON c.recipient_entity_id = e.id
GROUP BY e.id, e.name
ORDER BY total DESC LIMIT 10;
```

## Custom Queries

For custom SQL, wrap in the psql command:

```bash
docker exec -it wa-transparency-postgres-1 psql -U wa_user -d wa_transparency -c "YOUR SQL HERE"
```

## Examples

```
/query stats
/query sync-status
/query SELECT COUNT(*) FROM entities WHERE type = 'person'
```
