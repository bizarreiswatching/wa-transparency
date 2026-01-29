# WA Transparency Architecture

## Overview

WA Transparency is a monorepo containing three main components:

1. **Web App** (`apps/web`): A Next.js 14 static site for the public-facing interface
2. **Workers** (`apps/workers`): BullMQ background jobs for data syncing and processing
3. **Database Package** (`packages/db`): Shared database client and schema definitions

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Internet                                    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │        Caddy          │
                    │   (Reverse Proxy)     │
                    │   - SSL termination   │
                    │   - Auto HTTPS        │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │      Next.js Web      │
                    │   - Static pages      │
                    │   - ISR revalidation  │
                    │   - API routes        │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐     ┌────────▼────────┐    ┌────────▼────────┐
│   PostgreSQL   │     │      Redis       │    │    Workers      │
│   - Entities   │◄────│   - Job queue    │◄───│  - Data sync    │
│   - Contrib.   │     │   - Caching      │    │  - Resolution   │
│   - Contracts  │     │                  │    │  - Aggregates   │
└────────────────┘     └─────────────────┘    └─────────────────┘
```

## Data Flow

### Data Ingestion

1. **Scheduled Jobs**: Workers run on a schedule (via BullMQ) to sync data from external sources
2. **API Calls**: Workers fetch data from PDC, USASpending, and WA Legislature APIs
3. **Normalization**: Raw data is normalized (names, addresses, amounts)
4. **Storage**: Normalized data is stored in PostgreSQL

### Entity Resolution

1. **Exact Matching**: Records are matched by exact name, EIN, or address
2. **Fuzzy Matching**: Trigram similarity matching for close matches
3. **Claude Disambiguation**: AI-assisted matching for uncertain cases
4. **Manual Review**: Edge cases flagged for human review

### Aggregation

1. **Materialized Views**: Pre-computed aggregates for fast queries
2. **Activity Log**: Recent activity feed generated from changes
3. **Nightly Refresh**: All aggregates refreshed after daily sync

### Serving

1. **Static Generation**: Pages pre-rendered at build time
2. **ISR**: Incremental Static Regeneration for updates
3. **Revalidation**: Workers trigger page revalidation after syncs

## Database Schema

### Core Tables

- `entities`: Unified table for all organizations and people
- `entity_aliases`: Alternative names for entity matching
- `contributions`: Campaign contributions from PDC
- `contracts`: Federal contracts from USASpending
- `lobbying_registrations`: Lobbyist registrations
- `lobbying_activities`: Lobbying activities linked to bills
- `bills`: WA Legislature bills
- `bill_sponsors`: Bill sponsorship relationships
- `votes`: Legislator votes on bills

### Support Tables

- `sync_state`: Track data sync progress
- `activity_log`: Recent activity for feed
- `entity_matches`: Entity resolution tracking

### Materialized Views

- `entity_aggregates`: Total contributions, contracts, etc. per entity
- `top_donors_by_year`: Top donors ranked by year
- `top_recipients_by_year`: Top recipients ranked by year
- `contribution_connections`: Donor-recipient relationships
- `active_lobbyists`: Active lobbyists with client counts

## Security Considerations

### Data Protection

- All connections use TLS
- Database credentials in environment variables
- No PII exposed in public API

### Access Control

- Caddy handles SSL termination
- Internal services on Docker network
- Revalidation endpoint requires secret

### Rate Limiting

- Worker jobs rate-limited to respect APIs
- External API keys stored securely

## Deployment

### Infrastructure

- Single GCP VM (e2-medium recommended)
- Docker Compose for orchestration
- Caddy for reverse proxy and SSL

### Backup Strategy

- Daily PostgreSQL backups to GCS
- 30-day retention in cloud
- 7-day local retention

### Monitoring

- Docker healthchecks
- Sync state tracking in database
- Error logging to files

## Performance Optimizations

### Database

- Trigram indexes for fuzzy text search
- Composite indexes for common queries
- Materialized views for aggregates

### Web

- Static page generation
- Incremental Static Regeneration
- Response compression via Caddy

### Workers

- Batch processing for large datasets
- Concurrent jobs (limited to 2)
- Backoff retry strategy
