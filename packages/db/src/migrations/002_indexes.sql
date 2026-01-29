-- Washington State Political Transparency - Performance Indexes

-- Entities indexes
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_slug ON entities(slug);
CREATE INDEX idx_entities_name_trgm ON entities USING gin(name gin_trgm_ops);
CREATE INDEX idx_entities_ein ON entities(ein) WHERE ein IS NOT NULL;
CREATE INDEX idx_entities_city_state ON entities(state, city);

-- Entity aliases indexes
CREATE INDEX idx_entity_aliases_entity_id ON entity_aliases(entity_id);
CREATE INDEX idx_entity_aliases_alias_trgm ON entity_aliases USING gin(alias gin_trgm_ops);

-- Contributions indexes
CREATE INDEX idx_contributions_contributor_entity_id ON contributions(contributor_entity_id);
CREATE INDEX idx_contributions_recipient_entity_id ON contributions(recipient_entity_id);
CREATE INDEX idx_contributions_date ON contributions(contribution_date);
CREATE INDEX idx_contributions_election_year ON contributions(election_year);
CREATE INDEX idx_contributions_amount ON contributions(amount);
CREATE INDEX idx_contributions_contributor_name_trgm ON contributions USING gin(contributor_name gin_trgm_ops);
CREATE INDEX idx_contributions_recipient_name_trgm ON contributions USING gin(recipient_name gin_trgm_ops);

-- Contracts indexes
CREATE INDEX idx_contracts_recipient_entity_id ON contracts(recipient_entity_id);
CREATE INDEX idx_contracts_start_date ON contracts(start_date);
CREATE INDEX idx_contracts_amount ON contracts(amount);
CREATE INDEX idx_contracts_awarding_agency ON contracts(awarding_agency);
CREATE INDEX idx_contracts_naics_code ON contracts(naics_code);
CREATE INDEX idx_contracts_wa_performance ON contracts(place_of_performance_state)
    WHERE place_of_performance_state = 'WA';
CREATE INDEX idx_contracts_recipient_name_trgm ON contracts USING gin(recipient_name gin_trgm_ops);

-- Lobbying registrations indexes
CREATE INDEX idx_lobbying_registrations_lobbyist_entity_id ON lobbying_registrations(lobbyist_entity_id);
CREATE INDEX idx_lobbying_registrations_employer_entity_id ON lobbying_registrations(employer_entity_id);
CREATE INDEX idx_lobbying_registrations_status ON lobbying_registrations(status);
CREATE INDEX idx_lobbying_registrations_registration_date ON lobbying_registrations(registration_date);
CREATE INDEX idx_lobbying_registrations_subjects ON lobbying_registrations USING gin(subjects);

-- Lobbying activities indexes
CREATE INDEX idx_lobbying_activities_registration_id ON lobbying_activities(registration_id);
CREATE INDEX idx_lobbying_activities_bill_id ON lobbying_activities(bill_id);
CREATE INDEX idx_lobbying_activities_date ON lobbying_activities(activity_date);

-- Bills indexes
CREATE INDEX idx_bills_session ON bills(session);
CREATE INDEX idx_bills_slug ON bills(slug);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_primary_sponsor_id ON bills(primary_sponsor_id);
CREATE INDEX idx_bills_subjects ON bills USING gin(subjects);
CREATE INDEX idx_bills_title_trgm ON bills USING gin(title gin_trgm_ops);
CREATE INDEX idx_bills_introduced_date ON bills(introduced_date);

-- Bill sponsors indexes
CREATE INDEX idx_bill_sponsors_bill_id ON bill_sponsors(bill_id);
CREATE INDEX idx_bill_sponsors_entity_id ON bill_sponsors(entity_id);

-- Votes indexes
CREATE INDEX idx_votes_bill_id ON votes(bill_id);
CREATE INDEX idx_votes_entity_id ON votes(entity_id);
CREATE INDEX idx_votes_date ON votes(vote_date);
CREATE INDEX idx_votes_type ON votes(vote_type);
CREATE INDEX idx_votes_chamber ON votes(chamber);

-- Activity log indexes
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_entity_id ON activity_log(entity_id);
CREATE INDEX idx_activity_log_date ON activity_log(activity_date DESC);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Entity matches indexes
CREATE INDEX idx_entity_matches_source_entity_id ON entity_matches(source_entity_id);
CREATE INDEX idx_entity_matches_matched_entity_id ON entity_matches(matched_entity_id);
CREATE INDEX idx_entity_matches_status ON entity_matches(status);
CREATE INDEX idx_entity_matches_source_name_trgm ON entity_matches USING gin(source_name gin_trgm_ops);

-- Sync state indexes
CREATE INDEX idx_sync_state_source ON sync_state(source);
CREATE INDEX idx_sync_state_status ON sync_state(status);
