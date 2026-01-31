// Site configuration
export const SITE_NAME = 'WA Transparency';
export const SITE_DESCRIPTION = 'Washington State Political Transparency Project';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cache configuration (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

// Election years for filtering
export const ELECTION_YEARS = [2024, 2022, 2020, 2018, 2016, 2014, 2012, 2010];

// Entity types
export const ENTITY_TYPES = {
  ORGANIZATION: 'organization',
  PERSON: 'person',
  COMMITTEE: 'committee',
  GOVERNMENT: 'government',
} as const;

// Data sources
export const DATA_SOURCES = {
  PDC: 'pdc',
  USASPENDING: 'usaspending',
  WA_LEGISLATURE: 'wa_legislature',
  WA_SOS: 'wa_sos',
} as const;

// PDC contribution types
export const CONTRIBUTION_TYPES = [
  'Cash',
  'In-Kind',
  'Loan',
  'Loan Forgiveness',
  'Other',
] as const;

// Vote types
export const VOTE_TYPES = {
  YEA: 'yea',
  NAY: 'nay',
  ABSTAIN: 'abstain',
  EXCUSED: 'excused',
  ABSENT: 'absent',
} as const;

// Chambers
export const CHAMBERS = {
  HOUSE: 'house',
  SENATE: 'senate',
} as const;

// Party codes
export const PARTIES = {
  DEMOCRAT: 'D',
  REPUBLICAN: 'R',
  INDEPENDENT: 'I',
  OTHER: 'O',
} as const;

// Aggregate bucket entity names that should be excluded from rankings
// These represent aggregated small contributions in PDC data, not real donors
export const AGGREGATE_BUCKET_NAMES = [
  'Small Contributions',
  'Miscellaneous Receipts',
  'Anonymous',
  'Anonymous Contributions',
  'Unitemized Contributions',
  'Unitemized Member Dues',
  'Aggregate Contributions',
] as const;
