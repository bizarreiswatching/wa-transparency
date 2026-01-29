import { getPool, query, transaction, closePool } from '@wa-transparency/db';

export { getPool, query, transaction, closePool };

// Re-export types
export type { QueryResult, QueryResultRow } from 'pg';
