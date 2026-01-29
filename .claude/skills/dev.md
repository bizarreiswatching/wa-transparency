# /dev - Start Development Environment

Start the development environment with all required services.

## Usage

```
/dev [service]
```

## Services

| Service | Description |
|---------|-------------|
| `all` | Start everything (default) |
| `db` | Start only Postgres + Redis |
| `web` | Start Next.js dev server |
| `workers` | Start workers in watch mode |

## Implementation

### Start Database Services

```bash
pnpm docker:dev
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### Start Web Development Server

```bash
pnpm dev
```

Next.js runs on http://localhost:3000

### Start Workers

```bash
pnpm workers:dev
```

Workers connect to Redis and process queued jobs.

### Full Development Stack

```bash
# Terminal 1: Database
pnpm docker:dev

# Terminal 2: Web
pnpm dev

# Terminal 3: Workers (optional)
pnpm workers:dev
```

## Health Checks

```bash
# Check Postgres
docker exec wa-transparency-postgres-1 pg_isready

# Check Redis
docker exec wa-transparency-redis-1 redis-cli ping

# Check web
curl http://localhost:3000
```

## Stop Services

```bash
pnpm docker:dev:down
```

## Examples

```
/dev
/dev db
/dev web
```
