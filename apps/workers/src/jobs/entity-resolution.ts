import { getDb, updateSyncState } from '../lib/db';
import { EntityResolver } from '../entity-resolution/resolver';

interface ResolutionOptions {
  batchSize?: number;
  matchThreshold?: number;
}

export async function runEntityResolution(options: ResolutionOptions = {}): Promise<void> {
  const db = getDb();
  const resolver = new EntityResolver(db, {
    batchSize: options.batchSize || 100,
    matchThreshold: options.matchThreshold || 0.85,
  });

  console.log('Starting entity resolution...');

  await updateSyncState(db, 'entity-resolution', 'running');

  try {
    let totalMatched = 0;

    // Resolve contribution contributors
    console.log('Resolving contribution contributors...');
    const contributionMatches = await resolver.resolveContributionContributors();
    totalMatched += contributionMatches;

    // Resolve contribution recipients
    console.log('Resolving contribution recipients...');
    const recipientMatches = await resolver.resolveContributionRecipients();
    totalMatched += recipientMatches;

    // Resolve contract recipients (federal contracts)
    console.log('Resolving federal contract recipients...');
    const contractMatches = await resolver.resolveContractRecipients();
    totalMatched += contractMatches;

    // Resolve WA state/local contract recipients
    console.log('Resolving WA state/local contract recipients...');
    const waContractMatches = await resolver.resolveWaContractRecipients();
    totalMatched += waContractMatches;

    // Resolve lobbying employers
    console.log('Resolving lobbying employers...');
    const lobbyingMatches = await resolver.resolveLobbyingEmployers();
    totalMatched += lobbyingMatches;

    await updateSyncState(db, 'entity-resolution', 'idle', totalMatched);
    console.log(`Entity resolution complete. Matched ${totalMatched} records.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncState(db, 'entity-resolution', 'failed', 0, message);
    throw error;
  }
}
