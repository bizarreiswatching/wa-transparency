# WA Transparency - Claude Code Context

## Project Overview

WA Transparency is a Washington State political transparency platform that connects campaign contributions, lobbying activities, and government contracts. It's a pnpm monorepo with three main components.

## Architecture

```
wa-transparency/
├── apps/
│   ├── web/          # Next.js 14 app (Docker container)
│   └── workers/      # Background jobs (cron-triggered)
├── packages/
│   └── db/           # Shared PostgreSQL client & schema
├── scripts/          # Deployment & maintenance
└── docs/             # Architecture documentation
```

### Production Infrastructure (VPS + Cloudflare)

```
Cloudflare (DNS + CDN + WAF)
        │
        ▼
    Caddy (SSL termination, reverse proxy)
        │
        ├── wa.haystacklabs.io → wa-transparency-web:3000
        └── discovery.haystacklabs.io → haystack-app:8000

VPS: haystack-001 (34.19.17.209)
├── /opt/wa-transparency/  # This project
│   ├── docker-compose.yml
│   ├── wa-transparency-web (Next.js)
│   └── wa-transparency-postgres (PostgreSQL 16 + PostGIS)
└── /opt/haystack/         # Existing discovery project
    └── (shared Caddy instance)
```

## Quick Reference

### Development Commands

```bash
# Start development
pnpm docker:dev              # Start Postgres (5432)
pnpm dev                     # Start Next.js dev server

# Database
pnpm db:migrate              # Run migrations
pnpm --filter workers seed   # Seed initial data

# Build & Validate
pnpm --filter web build      # Build web app
pnpm --filter web typecheck  # TypeScript check
pnpm --filter workers typecheck

# Run jobs locally
JOB_NAME=sync-pdc-contributions pnpm --filter workers start
JOB_NAME=compute-aggregates pnpm --filter workers start
```

### Deployment Commands

```bash
# SSH to VPS
gcloud compute ssh haystack-001 --zone=us-west1-b

# On VPS: Deploy updates
cd /opt/wa-transparency
./scripts/deploy.sh

# On VPS: Run a job manually
./scripts/run-job.sh sync-pdc-contributions
./scripts/run-job.sh entity-resolution

# On VPS: View logs
docker compose logs -f web
docker compose logs -f postgres
tail -f /opt/wa-transparency/logs/sync-pdc-contributions.log

# On VPS: Restart services
docker compose restart web
docker compose down && docker compose up -d
```

### Key Files by Task

| Task | Files |
|------|-------|
| Add new page | `apps/web/app/[route]/page.tsx` |
| Add UI component | `apps/web/components/ui/` |
| Add database query | `apps/web/lib/queries/` |
| Add sync job | `apps/workers/src/jobs/` |
| Modify schema | `packages/db/src/migrations/` + `packages/db/src/schema.ts` |
| Entity resolution | `apps/workers/src/entity-resolution/` |
| API clients | `apps/workers/src/lib/*-client.ts` |

### Database Schema (Key Tables)

- `entities` - Unified orgs/people (id, type, name, slug, metadata)
- `contributions` - Campaign contributions (contributor_entity_id, recipient_entity_id, amount)
- `contracts` - Federal contracts (recipient_entity_id, amount, awarding_agency)
- `lobbying_registrations` - Lobbyist-employer relationships
- `bills` - WA Legislature bills (session, bill_number, slug)
- `entity_aggregates` - Materialized view with totals per entity

### Entity Types

```typescript
type EntityType = 'organization' | 'person' | 'committee' | 'government';
```

### URL Patterns

- `/org/[slug]` - Organization pages (slug: `o-company-name`)
- `/person/[slug]` - Person pages (slug: `p-jane-smith`)
- `/bill/[session]/[number]` - Bill pages (e.g., `/bill/2024/HB1234`)
- `/contract/[id]` - Contract pages (UUID)

## Coding Conventions

### TypeScript

- Strict mode enabled
- Use `@wa-transparency/db` for database types
- Prefer explicit types over `any`

### React/Next.js

- Use Server Components by default
- Add `'use client'` only when needed (hooks, interactivity)
- Use `Suspense` with `Loading` component for async data

### Database

- Use parameterized queries (never string concatenation)
- All money amounts stored as DECIMAL(15,2)
- UUIDs for all primary keys
- Timestamps in UTC (TIMESTAMPTZ)

### Naming

- Files: kebab-case (`sync-pdc-contributions.ts`)
- Components: PascalCase (`MoneyAmount.tsx` exports `MoneyAmount`)
- Functions: camelCase (`getOrganization`)
- Database: snake_case (`contributor_entity_id`)

## Data Flow

```
External APIs (PDC, USASpending, Legislature)
        │
        ▼
   Workers (cron jobs on VPS)
        │
        ▼
   PostgreSQL (raw data)
        │
        ▼
   Entity Resolution
        │
        ▼
   Materialized Views (aggregates)
        │
        ▼
   Next.js (static pages + ISR)
```

## Common Patterns

### Adding a New Sync Job

1. Create job file: `apps/workers/src/jobs/sync-{source}.ts`
2. Export async function matching job name
3. Register in `apps/workers/src/job-runner.ts` jobHandlers
4. Add cron entry in `scripts/setup-vps.sh`

### Adding a New Entity Page Section

1. Add query in `apps/web/lib/queries/`
2. Create component in `apps/web/components/`
3. Import and use in page with Suspense wrapper

### Adding a Database Migration

1. Create numbered SQL file: `packages/db/src/migrations/004_*.sql`
2. Update TypeScript types in `packages/db/src/schema.ts`
3. Run `pnpm db:migrate`

## Environment Variables

### Local Development
- `DATABASE_URL` - PostgreSQL connection string

### Production (VPS .env file)
- `DB_PASSWORD` - PostgreSQL password
- `PDC_API_KEY` - WA Public Disclosure Commission
- `GEMINI_API_KEY` - For entity disambiguation (Google Gemini)
- `REVALIDATE_SECRET` - ISR webhook auth
- `GCS_BACKUP_BUCKET` - Backup storage (optional)

## Testing Data Sources

- PDC API: https://www.pdc.wa.gov/political-disclosure-reporting-data/open-data
- USASpending: https://api.usaspending.gov/
- WA Legislature: https://wslwebservices.leg.wa.gov/

## Unfinished/TODO Areas

See `docs/TODO.md` for tracked incomplete items. Key areas:
- API client implementations (currently return empty arrays)
- Chart components (placeholders)
- Full text search optimization
- Test coverage
- Authentication for admin features

## Debugging

### Check sync state
```sql
SELECT source, status, last_sync_at, records_synced, error_message
FROM sync_state ORDER BY last_sync_at DESC;
```

### Check entity resolution
```sql
SELECT status, COUNT(*) FROM entity_matches GROUP BY status;
```

### Check unmatched records
```sql
SELECT COUNT(*) FROM contributions WHERE contributor_entity_id IS NULL;
SELECT COUNT(*) FROM contracts WHERE recipient_entity_id IS NULL;
```

## Infrastructure

### VPS Details

- **Host**: haystack-001 (GCP Compute Engine)
- **IP**: 34.19.17.209
- **Zone**: us-west1-b
- **OS**: Debian
- **Shared with**: Haystack Discovery project

### Directory Structure on VPS

```
/opt/wa-transparency/
├── .env                    # Environment variables
├── docker-compose.yml      # Container orchestration
├── scripts/
│   ├── deploy.sh          # Deployment script
│   ├── backup.sh          # Database backup
│   └── run-job.sh         # Manual job runner
├── logs/                   # Job logs
└── backups/               # Local backup storage
```

### Job Schedule (Pacific Time, via cron)

| Job | Schedule | Description |
|-----|----------|-------------|
| sync-pdc-contributions | Daily 2 AM | PDC campaign contributions |
| sync-pdc-lobbying | Daily 2 AM | PDC lobbying data |
| sync-pdc-candidates | Daily 3 AM | PDC candidate data |
| sync-usaspending | Sunday 4 AM | Federal contracts |
| sync-wa-legislature | Sunday 5 AM | WA bills |
| compute-aggregates | Daily 6 AM | Refresh materialized views |
| trigger-rebuild | Daily 7 AM | ISR revalidation |
| backup | Daily 3 AM | Database backup to GCS |

### Cloudflare Configuration

DNS:
- `wa.haystacklabs.io` → A record → `34.19.17.209` (proxied)

SSL/TLS:
- Mode: Full (strict)
- Always HTTPS: On
- HSTS: Enabled

Caching:
- `/_next/static/*` - Cache 1 year
- `/api/*` - Bypass cache
- Default - 1 hour edge cache

### Docker Containers

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| wa-transparency-web | apps/web/Dockerfile | 3000 | Next.js app |
| wa-transparency-postgres | postgis/postgis:16-3.4-alpine | 5432 (internal) | Database |
| wa-transparency-workers | apps/workers/Dockerfile | - | Job runner (on-demand) |
