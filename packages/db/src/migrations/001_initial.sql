-- Washington State Political Transparency - Initial Schema
-- This migration creates the core tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Entity types enum
CREATE TYPE entity_type AS ENUM ('organization', 'person', 'committee', 'government');

-- Entities - unified table for all organizations and people
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type entity_type NOT NULL,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    ein VARCHAR(20),
    description TEXT,
    website VARCHAR(500),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity aliases for matching
CREATE TABLE entity_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    alias VARCHAR(500) NOT NULL,
    source VARCHAR(100) NOT NULL,
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign contributions
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pdc_id VARCHAR(100) UNIQUE,
    contributor_entity_id UUID REFERENCES entities(id),
    contributor_name VARCHAR(500) NOT NULL,
    contributor_address VARCHAR(500),
    contributor_city VARCHAR(100),
    contributor_state VARCHAR(50),
    contributor_zip VARCHAR(20),
    contributor_employer VARCHAR(500),
    contributor_occupation VARCHAR(200),
    recipient_entity_id UUID REFERENCES entities(id),
    recipient_name VARCHAR(500) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    contribution_date DATE NOT NULL,
    election_year INTEGER NOT NULL,
    contribution_type VARCHAR(100),
    description TEXT,
    source_url VARCHAR(1000),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Federal contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usaspending_id VARCHAR(100) UNIQUE,
    recipient_entity_id UUID REFERENCES entities(id),
    recipient_name VARCHAR(500) NOT NULL,
    recipient_address VARCHAR(500),
    recipient_city VARCHAR(100),
    recipient_state VARCHAR(50),
    recipient_zip VARCHAR(20),
    awarding_agency VARCHAR(500) NOT NULL,
    awarding_sub_agency VARCHAR(500),
    award_type VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    naics_code VARCHAR(10),
    naics_description VARCHAR(500),
    place_of_performance_state VARCHAR(50),
    place_of_performance_city VARCHAR(100),
    source_url VARCHAR(1000),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lobbying registrations
CREATE TABLE lobbying_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pdc_id VARCHAR(100) UNIQUE,
    lobbyist_entity_id UUID REFERENCES entities(id),
    lobbyist_name VARCHAR(500) NOT NULL,
    employer_entity_id UUID REFERENCES entities(id),
    employer_name VARCHAR(500) NOT NULL,
    registration_date DATE NOT NULL,
    termination_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    subjects TEXT[] DEFAULT '{}',
    source_url VARCHAR(1000),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lobbying activities
CREATE TABLE lobbying_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES lobbying_registrations(id) ON DELETE CASCADE,
    bill_id UUID,
    activity_date DATE NOT NULL,
    description TEXT,
    compensation DECIMAL(15, 2),
    expenses DECIMAL(15, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session VARCHAR(20) NOT NULL,
    bill_number VARCHAR(20) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(1000) NOT NULL,
    short_description TEXT,
    long_description TEXT,
    status VARCHAR(100),
    introduced_date DATE,
    last_action_date DATE,
    last_action TEXT,
    primary_sponsor_id UUID REFERENCES entities(id),
    subjects TEXT[] DEFAULT '{}',
    source_url VARCHAR(1000),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session, bill_number)
);

-- Bill sponsors
CREATE TABLE bill_sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id),
    sponsor_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bill_id, entity_id)
);

-- Votes
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id),
    vote_date DATE NOT NULL,
    vote_type VARCHAR(20) NOT NULL,
    chamber VARCHAR(20) NOT NULL,
    roll_call_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bill_id, entity_id, roll_call_number)
);

-- Add foreign key for lobbying activities to bills
ALTER TABLE lobbying_activities
    ADD CONSTRAINT lobbying_activities_bill_id_fkey
    FOREIGN KEY (bill_id) REFERENCES bills(id);

-- Sync state tracking
CREATE TABLE sync_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL UNIQUE,
    last_sync_at TIMESTAMPTZ,
    last_successful_sync_at TIMESTAMPTZ,
    cursor TEXT,
    status VARCHAR(20) DEFAULT 'idle',
    error_message TEXT,
    records_synced INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log for recent activity feed
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type VARCHAR(50) NOT NULL,
    entity_id UUID REFERENCES entities(id),
    related_entity_id UUID REFERENCES entities(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2),
    activity_date DATE NOT NULL,
    source_url VARCHAR(1000),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity matching for entity resolution
CREATE TABLE entity_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_entity_id UUID REFERENCES entities(id),
    source_name VARCHAR(500) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    source_record_id VARCHAR(200) NOT NULL,
    matched_entity_id UUID REFERENCES entities(id),
    match_score DECIMAL(3, 2),
    match_method VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_type, source_record_id)
);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lobbying_registrations_updated_at BEFORE UPDATE ON lobbying_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_state_updated_at BEFORE UPDATE ON sync_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_matches_updated_at BEFORE UPDATE ON entity_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
