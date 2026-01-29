# /sync - Run Data Sync Job

Run a data synchronization job to fetch data from external sources.

## Usage

```
/sync [job-name] [options]
```

## Available Jobs

| Job Name | Description |
|----------|-------------|
| `pdc-contributions` | Sync campaign contributions from WA PDC |
| `pdc-lobbying` | Sync lobbying registrations from WA PDC |
| `pdc-candidates` | Sync candidate information from WA PDC |
| `usaspending` | Sync federal contracts from USASpending.gov |
| `wa-legislature` | Sync bills and legislators from WA Legislature |
| `entity-resolution` | Run entity matching on unlinked records |
| `compute-aggregates` | Refresh materialized views |
| `all` | Run all sync jobs in sequence |

## Options

- `--full` - Force full sync instead of incremental
- `--year YYYY` - Limit to specific year (for contributions/candidates)
- `--batch-size N` - Records per batch (for entity resolution)

## Implementation

When this skill is invoked:

1. Ensure Docker containers are running (`pnpm docker:dev`)
2. Queue the job using the workers CLI:
   ```bash
   cd apps/workers
   pnpm job [job-name] [options]
   ```
3. Optionally start the worker to process:
   ```bash
   pnpm workers:dev
   ```

## Examples

```
/sync pdc-contributions --year 2024
/sync entity-resolution --batch-size 500
/sync compute-aggregates
```
