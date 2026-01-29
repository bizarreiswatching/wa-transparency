# WA Transparency - Subagent Definitions

This document defines specialized subagents for common tasks in the WA Transparency project.

## Available Subagents

### 1. API Client Implementer

**When to use:** Implementing actual API integrations for PDC, USASpending, or WA Legislature.

**Prompt template:**
```
Implement the [SOURCE] API client in apps/workers/src/lib/[source]-client.ts.

Requirements:
- Use axios for HTTP requests
- Handle pagination
- Implement rate limiting
- Parse responses into TypeScript types
- Handle errors gracefully

API Documentation: [URL]
```

**Tools needed:** Read, Edit, WebFetch, Bash (for testing)

---

### 2. Database Schema Extender

**When to use:** Adding new tables, columns, or indexes to the database.

**Prompt template:**
```
Add [FEATURE] to the database schema.

Tasks:
1. Create migration file in packages/db/src/migrations/
2. Update TypeScript types in packages/db/src/schema.ts
3. Add any needed indexes
4. Update relevant queries in apps/web/lib/queries/

Follow existing patterns for UUIDs, timestamps, and foreign keys.
```

**Tools needed:** Read, Write, Edit

---

### 3. Page Builder

**When to use:** Creating new pages or page sections in the web app.

**Prompt template:**
```
Create a new page/section for [FEATURE].

Requirements:
- Server Component by default
- Use Suspense for async data
- Follow existing component patterns
- Add to navigation if needed
- Handle empty states

Location: apps/web/app/[route]/page.tsx
```

**Tools needed:** Read, Write, Edit, Glob

---

### 4. Entity Resolution Tuner

**When to use:** Improving entity matching accuracy or adding new matching rules.

**Prompt template:**
```
Improve entity resolution for [SCENARIO].

Files to examine:
- apps/workers/src/entity-resolution/matchers.ts
- apps/workers/src/entity-resolution/scorers.ts
- apps/workers/src/entity-resolution/resolver.ts

Consider:
- Name normalization rules
- Matching thresholds
- Field weights
- Claude disambiguation prompts
```

**Tools needed:** Read, Edit, Grep

---

### 5. Sync Job Developer

**When to use:** Creating or modifying data sync jobs.

**Prompt template:**
```
Create/modify sync job for [SOURCE].

Requirements:
- Implement in apps/workers/src/jobs/sync-[source].ts
- Use incremental sync with cursor when possible
- Update sync_state table
- Handle errors and retries
- Log progress

Register in apps/workers/src/index.ts and queue.ts
```

**Tools needed:** Read, Write, Edit

---

### 6. Component Library Extender

**When to use:** Adding new reusable UI components.

**Prompt template:**
```
Create a new [COMPONENT] component.

Requirements:
- TypeScript with proper types
- Tailwind CSS styling
- Follow existing patterns in apps/web/components/
- Support common variants
- Handle edge cases (loading, empty, error)

Categories:
- ui/ - Base components (buttons, cards, inputs)
- layout/ - Page structure components
- entities/ - Entity display components
- data-display/ - Data formatting components
- charts/ - Visualization components
```

**Tools needed:** Read, Write, Glob

---

### 7. Test Writer

**When to use:** Adding test coverage for existing code.

**Prompt template:**
```
Write tests for [MODULE/COMPONENT].

Test types needed:
- Unit tests for utility functions
- Integration tests for database queries
- Component tests for React components

Use existing test patterns if available.
```

**Tools needed:** Read, Write, Glob, Bash

---

### 8. Documentation Writer

**When to use:** Creating or updating documentation.

**Prompt template:**
```
Document [FEATURE/SYSTEM].

Include:
- Overview and purpose
- Usage examples
- API reference (if applicable)
- Configuration options
- Troubleshooting

Location: docs/ or inline JSDoc
```

**Tools needed:** Read, Write, Glob

---

## Using Subagents

To spawn a subagent, use the Task tool with appropriate prompt:

```
Task(
  subagent_type="general-purpose",
  prompt="[Subagent prompt from above]",
  description="[Brief description]"
)
```

For exploration tasks, use `subagent_type="Explore"`.
For implementation tasks, use `subagent_type="general-purpose"`.
