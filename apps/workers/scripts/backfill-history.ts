import 'dotenv/config';
import { addJob } from '../src/queue';

async function backfillHistory() {
  console.log('Starting historical backfill...');

  const currentYear = new Date().getFullYear();
  const startYear = 2010; // Start from 2010

  try {
    // Queue PDC contribution syncs for each year
    for (let year = startYear; year <= currentYear; year++) {
      console.log(`Queueing contribution sync for ${year}...`);
      await addJob('sync-pdc-contributions', {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        fullSync: true,
      });
    }

    // Queue PDC candidate syncs for election years
    for (let year = startYear; year <= currentYear; year += 2) {
      console.log(`Queueing candidate sync for ${year}...`);
      await addJob('sync-pdc-candidates', {
        electionYear: year,
      });
    }

    // Queue USASpending sync
    console.log('Queueing USASpending sync...');
    await addJob('sync-usaspending', {
      fullSync: true,
    });

    // Queue legislature sync
    console.log('Queueing legislature sync...');
    await addJob('sync-wa-legislature', {});

    // Queue entity resolution
    console.log('Queueing entity resolution...');
    await addJob('entity-resolution', {
      batchSize: 1000,
    });

    // Queue aggregate computation
    console.log('Queueing aggregate computation...');
    await addJob('compute-aggregates', {});

    console.log('Historical backfill jobs queued.');
    console.log('Run the worker to process these jobs.');
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

backfillHistory();
