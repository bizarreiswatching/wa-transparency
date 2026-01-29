# WA Transparency - TODO / Unfinished Items

Last updated: Scaffold analysis

## Priority Levels
- **P0 (Critical)**: Blocks core functionality
- **P1 (High)**: Required for production launch
- **P2 (Medium)**: Important but not blocking
- **P3 (Low)**: Nice to have

---

## P0 - Critical (Blocks Core Functionality)

### API Client Implementations

All external API clients are stubs returning empty arrays:

| Client | File | Methods to Implement |
|--------|------|---------------------|
| PDC | `apps/workers/src/lib/pdc-client.ts` | `getContributions()`, `getLobbyingRegistrations()`, `getLobbyingActivities()`, `getCandidates()` |
| USASpending | `apps/workers/src/lib/usaspending-client.ts` | `getWashingtonContracts()` |
| WA Legislature | `apps/workers/src/lib/legislature-client.ts` | `getLegislators()`, `getBills()`, `getBillDetails()`, `getVotes()` |

**Impact**: No data can be synced until these are implemented.

### Missing Dependency

- [ ] Add `@anthropic-ai/sdk` to `apps/workers/package.json`
  - Required by `apps/workers/src/lib/claude.ts` for entity disambiguation
  - Currently causes TypeScript compilation failure

### Entity Link Routing Bug

**File**: `apps/web/components/data-display/contribution-table.tsx`

**Issue**: Links assume fixed entity types:
- Contributors always link to `/org/` (wrong for person contributors)
- Recipients always link to `/person/` (wrong for committee recipients)

**Fix**: Lookup entity type and use correct route prefix.

---

## P1 - High Priority (Required for Production)

### Chart Components

Placeholder implementations need actual charts:

- [ ] `apps/web/components/charts/spending-summary.tsx` - Implement with Recharts/Chart.js
- [ ] `apps/web/components/charts/timeline-chart.tsx` - Implement with Recharts/Chart.js

### Static Generation

All dynamic pages have empty `generateStaticParams()`:

- [ ] `apps/web/app/org/[slug]/page.tsx` - Implement using `getAllOrganizationSlugs()`
- [ ] `apps/web/app/person/[slug]/page.tsx` - Implement using `getAllPersonSlugs()`
- [ ] `apps/web/app/bill/[session]/[number]/page.tsx` - Implement using `getAllBillSlugs()`
- [ ] `apps/web/app/contract/[id]/page.tsx` - Implement using `getAllContractIds()`

### Error Handling

- [ ] Add `app/error.tsx` - Global error boundary
- [ ] Add `app/not-found.tsx` - Custom 404 page
- [ ] Add `app/global-error.tsx` - Root error boundary

### Accessibility

- [ ] Add `aria-label` to icon buttons (search button, etc.)
- [ ] Add skip-to-content link
- [ ] Add proper table headers with `scope`
- [ ] Ensure all interactive elements are keyboard accessible

### Tests

- [ ] Set up Vitest or Jest
- [ ] Unit tests for utility functions (`lib/utils/`)
- [ ] Unit tests for normalizers (`apps/workers/src/lib/normalizers/`)
- [ ] Integration tests for database queries
- [ ] E2E tests for critical user flows

---

## P2 - Medium Priority (Important Improvements)

### SEO Improvements

- [ ] Add Open Graph meta tags to all pages
- [ ] Add Twitter card meta tags
- [ ] Create `app/sitemap.ts` for dynamic sitemap
- [ ] Create `app/robots.ts` for robots.txt
- [ ] Add JSON-LD structured data for entities

### UI Enhancements

- [ ] Add skeleton loaders for tables and cards
- [ ] Implement pagination for list pages
- [ ] Connect activity page filter buttons to actual filtering
- [ ] Add export buttons to entity pages (link to existing API)
- [ ] Add "load more" pattern for long lists

### Dynamic Stats

Replace hardcoded zeros with actual data:

- [ ] Homepage stats (total contributions, orgs, lobbyists, bills)
- [ ] Entity page stats (from entity_aggregates view)
- [ ] Person page sections (top donors, sponsored bills)

### WA Secretary of State Integration

- [ ] `apps/workers/src/jobs/sync-wa-sos.ts` - Implement actual API integration
  - Business registration data for entity verification
  - EIN lookup and validation

---

## P3 - Low Priority (Nice to Have)

### Admin Features

- [ ] Simple authentication for admin routes
- [ ] Manual entity matching UI
- [ ] Data quality dashboard
- [ ] Sync status monitoring UI

### Performance

- [ ] Add database query caching layer
- [ ] Implement search autocomplete
- [ ] Add Redis caching for expensive queries

### Analytics

- [ ] Add basic analytics tracking
- [ ] Add error logging/monitoring (Sentry, etc.)

### Documentation

- [ ] API documentation for public endpoints
- [ ] Contributor guide
- [ ] Development setup video/guide

---

## Files Summary

### Files with TODOs

| File | TODOs |
|------|-------|
| `apps/workers/src/lib/pdc-client.ts` | 4 unimplemented methods |
| `apps/workers/src/lib/usaspending-client.ts` | 1 unimplemented method |
| `apps/workers/src/lib/legislature-client.ts` | 4 unimplemented methods |
| `apps/workers/src/jobs/sync-wa-sos.ts` | Full implementation needed |
| `apps/web/components/charts/*.tsx` | 2 placeholder components |
| `apps/web/app/*/page.tsx` | 4 empty generateStaticParams |

### Files with Bugs

| File | Issue |
|------|-------|
| `apps/web/components/data-display/contribution-table.tsx` | Entity link routing incorrect |

### Missing Files

| Expected File | Purpose |
|---------------|---------|
| `apps/web/app/error.tsx` | Error boundary |
| `apps/web/app/not-found.tsx` | 404 page |
| `apps/web/app/sitemap.ts` | Sitemap generation |
| `apps/web/app/robots.ts` | Robots.txt |
| `vitest.config.ts` or `jest.config.js` | Test configuration |
| `apps/web/__tests__/` | Test files |
