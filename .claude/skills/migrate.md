# /migrate - Database Migration Management

Manage database schema migrations.

## Usage

```
/migrate [command]
```

## Commands

| Command | Description |
|---------|-------------|
| `run` | Apply pending migrations (default) |
| `status` | Show migration status |
| `create [name]` | Create new migration file |

## Implementation

### Run Migrations

```bash
pnpm db:migrate
```

This executes `packages/db/scripts/migrate.ts` which:
1. Creates `_migrations` table if not exists
2. Reads applied migrations from database
3. Applies any new `.sql` files from `packages/db/src/migrations/`

### Check Status

```sql
SELECT name, applied_at FROM _migrations ORDER BY id;
```

### Create New Migration

1. Create file: `packages/db/src/migrations/NNN_description.sql`
   - Number should be next in sequence (e.g., 004, 005)
2. Update TypeScript types in `packages/db/src/schema.ts`
3. Run migration

## Migration File Format

```sql
-- packages/db/src/migrations/004_add_feature.sql

-- Add new table
CREATE TABLE new_feature (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_new_feature_name ON new_feature(name);
```

## Rollback

Migrations don't auto-rollback. To rollback:
1. Write a new migration that undoes changes
2. Or restore from backup

## Examples

```
/migrate run
/migrate status
/migrate create add_user_preferences
```
