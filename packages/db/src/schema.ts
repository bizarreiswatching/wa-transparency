// Entity types
export type EntityType = 'organization' | 'person' | 'committee' | 'government';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  ein?: string;
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface EntityAlias {
  id: string;
  entity_id: string;
  alias: string;
  source: string;
  confidence: number;
  created_at: Date;
}

// Campaign contributions
export interface Contribution {
  id: string;
  pdc_id?: string;
  contributor_entity_id?: string;
  contributor_name: string;
  contributor_address?: string;
  contributor_city?: string;
  contributor_state?: string;
  contributor_zip?: string;
  contributor_employer?: string;
  contributor_occupation?: string;
  recipient_entity_id?: string;
  recipient_name: string;
  recipient_type: 'candidate' | 'committee' | 'party';
  amount: number;
  contribution_date: Date;
  election_year: number;
  contribution_type: string;
  description?: string;
  source_url?: string;
  raw_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// Federal contracts
export interface Contract {
  id: string;
  usaspending_id?: string;
  recipient_entity_id?: string;
  recipient_name: string;
  recipient_address?: string;
  recipient_city?: string;
  recipient_state?: string;
  recipient_zip?: string;
  awarding_agency: string;
  awarding_sub_agency?: string;
  award_type: string;
  amount: number;
  start_date: Date;
  end_date?: Date;
  description?: string;
  naics_code?: string;
  naics_description?: string;
  place_of_performance_state?: string;
  place_of_performance_city?: string;
  source_url?: string;
  raw_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// Lobbying
export interface LobbyingRegistration {
  id: string;
  pdc_id?: string;
  lobbyist_entity_id?: string;
  lobbyist_name: string;
  employer_entity_id?: string;
  employer_name: string;
  registration_date: Date;
  termination_date?: Date;
  status: 'active' | 'terminated';
  subjects: string[];
  source_url?: string;
  raw_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface LobbyingActivity {
  id: string;
  registration_id: string;
  bill_id?: string;
  activity_date: Date;
  description?: string;
  compensation?: number;
  expenses?: number;
  created_at: Date;
}

// Bills
export interface Bill {
  id: string;
  session: string;
  bill_number: string;
  slug: string;
  title: string;
  short_description?: string;
  long_description?: string;
  status: string;
  introduced_date?: Date;
  last_action_date?: Date;
  last_action?: string;
  primary_sponsor_id?: string;
  subjects: string[];
  source_url?: string;
  raw_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface BillSponsor {
  id: string;
  bill_id: string;
  entity_id: string;
  sponsor_type: 'primary' | 'co-sponsor' | 'alternate';
  created_at: Date;
}

export interface Vote {
  id: string;
  bill_id: string;
  entity_id: string;
  vote_date: Date;
  vote_type: 'yea' | 'nay' | 'abstain' | 'excused' | 'absent';
  chamber: 'house' | 'senate';
  roll_call_number?: string;
  created_at: Date;
}

// Sync tracking
export interface SyncState {
  id: string;
  source: string;
  last_sync_at: Date;
  last_successful_sync_at?: Date;
  cursor?: string;
  status: 'idle' | 'running' | 'failed';
  error_message?: string;
  records_synced: number;
  created_at: Date;
  updated_at: Date;
}

// Activity log
export interface ActivityLogEntry {
  id: string;
  activity_type: 'contribution' | 'contract' | 'lobbying' | 'bill' | 'vote';
  entity_id?: string;
  related_entity_id?: string;
  title: string;
  description?: string;
  amount?: number;
  activity_date: Date;
  source_url?: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// Aggregates (materialized views)
export interface EntityAggregate {
  entity_id: string;
  total_contributions_given: number;
  total_contributions_received: number;
  total_contracts_received: number;
  contribution_count_given: number;
  contribution_count_received: number;
  contract_count: number;
  lobbying_registration_count: number;
  bill_sponsorship_count: number;
  last_activity_date?: Date;
}

// Entity resolution
export interface EntityMatch {
  id: string;
  source_entity_id?: string;
  source_name: string;
  source_type: string;
  source_record_id: string;
  matched_entity_id?: string;
  match_score: number;
  match_method: 'exact' | 'fuzzy' | 'claude' | 'manual';
  status: 'pending' | 'matched' | 'rejected' | 'needs_review';
  reviewed_by?: string;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}
