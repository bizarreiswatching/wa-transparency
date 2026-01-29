import 'dotenv/config';
import { Worker } from 'bullmq';
import { getRedisConnection } from './queue';
import { syncPdcContributions } from './jobs/sync-pdc-contributions';
import { syncPdcLobbying } from './jobs/sync-pdc-lobbying';
import { syncPdcCandidates } from './jobs/sync-pdc-candidates';
import { syncUsaspending } from './jobs/sync-usaspending';
import { syncWaLegislature } from './jobs/sync-wa-legislature';
import { syncWaSos } from './jobs/sync-wa-sos';
import { runEntityResolution } from './jobs/entity-resolution';
import { computeAggregates } from './jobs/compute-aggregates';
import { triggerRebuild } from './jobs/trigger-rebuild';

const connection = getRedisConnection();

// Job handlers
const jobHandlers: Record<string, (data: unknown) => Promise<void>> = {
  'sync-pdc-contributions': syncPdcContributions,
  'sync-pdc-lobbying': syncPdcLobbying,
  'sync-pdc-candidates': syncPdcCandidates,
  'sync-usaspending': syncUsaspending,
  'sync-wa-legislature': syncWaLegislature,
  'sync-wa-sos': syncWaSos,
  'entity-resolution': runEntityResolution,
  'compute-aggregates': computeAggregates,
  'trigger-rebuild': triggerRebuild,
};

// Create worker
const worker = new Worker(
  'wa-transparency',
  async (job) => {
    console.log(`Processing job: ${job.name} (${job.id})`);

    const handler = jobHandlers[job.name];
    if (!handler) {
      throw new Error(`Unknown job type: ${job.name}`);
    }

    try {
      await handler(job.data);
      console.log(`Completed job: ${job.name} (${job.id})`);
    } catch (error) {
      console.error(`Failed job: ${job.name} (${job.id})`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('Worker started. Waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
