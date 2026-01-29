import axios from 'axios';
import { getDb, updateSyncState } from '../lib/db';

export async function triggerRebuild(): Promise<void> {
  const db = getDb();

  console.log('Triggering site rebuild...');

  await updateSyncState(db, 'trigger-rebuild', 'running');

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const revalidateSecret = process.env.REVALIDATE_SECRET;

    if (!revalidateSecret) {
      console.log('REVALIDATE_SECRET not set, skipping revalidation');
      await updateSyncState(db, 'trigger-rebuild', 'idle', 0);
      return;
    }

    // Trigger revalidation of all pages
    const response = await axios.post(
      `${siteUrl}/api/revalidate`,
      { type: 'all' },
      {
        headers: {
          Authorization: `Bearer ${revalidateSecret}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data.revalidated) {
      console.log('Site revalidation triggered successfully');
      await updateSyncState(db, 'trigger-rebuild', 'idle', 1);
    } else {
      throw new Error('Revalidation failed');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to trigger rebuild:', message);
    await updateSyncState(db, 'trigger-rebuild', 'failed', 0, message);
    // Don't throw - rebuild failure shouldn't fail the job
  }
}
