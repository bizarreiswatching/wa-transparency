import 'dotenv/config';
import { addJob } from '../src/queue';

async function runJob() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: pnpm job <job-name> [options]');
    console.log('');
    console.log('Available jobs:');
    console.log('  sync-pdc-contributions [--full] [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD]');
    console.log('  sync-pdc-lobbying [--full]');
    console.log('  sync-pdc-candidates [--year YYYY]');
    console.log('  sync-usaspending [--full]');
    console.log('  sync-wa-legislature [--session YYYY]');
    console.log('  sync-wa-sos [--full]');
    console.log('  entity-resolution [--batch-size N] [--threshold N]');
    console.log('  compute-aggregates');
    console.log('  trigger-rebuild');
    process.exit(1);
  }

  const jobName = args[0];
  const options: Record<string, unknown> = {};

  // Parse command line options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--full') {
      options.fullSync = true;
    } else if (arg === '--start-date' && args[i + 1]) {
      options.startDate = args[++i];
    } else if (arg === '--end-date' && args[i + 1]) {
      options.endDate = args[++i];
    } else if (arg === '--year' && args[i + 1]) {
      options.electionYear = parseInt(args[++i]);
    } else if (arg === '--session' && args[i + 1]) {
      options.session = args[++i];
    } else if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[++i]);
    } else if (arg === '--threshold' && args[i + 1]) {
      options.matchThreshold = parseFloat(args[++i]);
    }
  }

  console.log(`Queueing job: ${jobName}`);
  console.log('Options:', options);

  try {
    await addJob(jobName, options);
    console.log('Job queued successfully.');
    console.log('Run the worker to process this job.');
  } catch (error) {
    console.error('Failed to queue job:', error);
    process.exit(1);
  }

  process.exit(0);
}

runJob();
