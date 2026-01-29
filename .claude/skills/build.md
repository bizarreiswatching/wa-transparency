# /build - Build and Validate Project

Build the project and run validation checks.

## Usage

```
/build [target] [options]
```

## Targets

| Target | Description |
|--------|-------------|
| `web` | Build Next.js web app (default) |
| `workers` | Build workers package |
| `all` | Build all packages |
| `check` | TypeScript check only (no build) |

## Implementation

### Build Web App

```bash
pnpm --filter web build
```

This creates a production build in `apps/web/.next/`

### TypeScript Check

```bash
pnpm --filter web typecheck
pnpm --filter workers typecheck
pnpm --filter @wa-transparency/db typecheck
```

### Full Validation

```bash
# TypeScript
pnpm -r typecheck

# Lint (if configured)
pnpm -r lint

# Build
pnpm --filter web build
```

## Build Output

- Static pages generated to `apps/web/.next/`
- Standalone output for Docker in `apps/web/.next/standalone/`

## Common Build Errors

| Error | Solution |
|-------|----------|
| Module not found | Run `pnpm install` |
| Type errors | Check `packages/db/src/schema.ts` matches migrations |
| Import errors | Verify `@/*` path alias in tsconfig |

## Examples

```
/build web
/build check
/build all
```
