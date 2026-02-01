/**
 * Cloud Run Job Runner
 *
 * Entry point for Cloud Run Jobs. Runs a single job based on JOB_NAME
 * environment variable, then exits. This replaces the BullMQ worker
 * for Cloud Run deployment.
 */
import 'dotenv/config';
import { closePool } from '@wa-transparency/db';

const jobName = process.env.JOB_NAME;

if (!jobName) {
  console.error('ERROR: JOB_NAME environment variable is required');
  process.exit(1);
}

// Job handlers map - dynamically imports job modules
const jobHandlers: Record<string, () => Promise<void>> = {
  'sync-pdc-contributions': () =>
    import('./jobs/sync-pdc-contributions').then((m) => m.syncPdcContributions()),
  'sync-pdc-lobbying': () =>
    import('./jobs/sync-pdc-lobbying').then((m) => m.syncPdcLobbying()),
  'sync-pdc-candidates': () =>
    import('./jobs/sync-pdc-candidates').then((m) => m.syncPdcCandidates()),
  'sync-usaspending': () =>
    import('./jobs/sync-usaspending').then((m) => m.syncUsaspending()),
  'sync-wa-legislature': () =>
    import('./jobs/sync-wa-legislature').then((m) => m.syncWaLegislature()),
  'sync-wa-sos': () =>
    import('./jobs/sync-wa-sos').then((m) => m.syncWaSos()),
  'compute-aggregates': () =>
    import('./jobs/compute-aggregates').then((m) => m.computeAggregates()),
  'trigger-rebuild': () =>
    import('./jobs/trigger-rebuild').then((m) => m.triggerRebuild()),
  'entity-resolution': () =>
    import('./jobs/entity-resolution').then((m) => m.runEntityResolution()),
  // WA State and local government contract sync jobs
  'sync-wa-agency-contracts': () =>
    import('./jobs/sync-wa-agency-contracts').then((m) => m.syncWaAgencyContracts()),
  'sync-wa-statewide-sales': () =>
    import('./jobs/sync-wa-statewide-sales').then((m) => m.syncWaStatewideSales()),
  'sync-king-county-contracts': () =>
    import('./jobs/sync-king-county-contracts').then((m) => m.syncKingCountyContracts()),
};

async function run(): Promise<void> {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting job: ${jobName}`);

  const handler = jobHandlers[jobName];
  if (!handler) {
    console.error(`ERROR: Unknown job type: ${jobName}`);
    console.error(`Available jobs: ${Object.keys(jobHandlers).join(', ')}`);
    process.exit(1);
  }

  try {
    await handler();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${new Date().toISOString()}] Completed job: ${jobName} (${duration}s)`);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[${new Date().toISOString()}] Failed job: ${jobName} (${duration}s)`);
    console.error(error);
    throw error;
  } finally {
    // Clean up database connections
    await closePool();
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Job runner failed:', error);
    process.exit(1);
  });
