-- Washington State Contract Data Integration
-- Adds support for state/county contract sources beyond federal (USASpending)

-- Add new columns to contracts table for multi-source support
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'federal';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_number VARCHAR(200);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS procurement_method VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS fiscal_year INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS awarding_agency_type VARCHAR(50); -- federal|state|county|city
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vendor_certifications JSONB DEFAULT '[]';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS wa_data_id VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS king_county_id VARCHAR(100);

-- Set default awarding_agency_type for existing federal contracts
UPDATE contracts SET awarding_agency_type = 'federal' WHERE awarding_agency_type IS NULL AND source_type = 'federal';

-- Partial unique indexes for each source (only enforce uniqueness where ID exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_wa_data_id
    ON contracts(wa_data_id) WHERE wa_data_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_king_county_id
    ON contracts(king_county_id) WHERE king_county_id IS NOT NULL;

-- Index on source_type for filtering
CREATE INDEX IF NOT EXISTS idx_contracts_source_type ON contracts(source_type);

-- Index on awarding_agency_type for filtering
CREATE INDEX IF NOT EXISTS idx_contracts_awarding_agency_type ON contracts(awarding_agency_type);

-- Index on fiscal_year for time-based queries
CREATE INDEX IF NOT EXISTS idx_contracts_fiscal_year ON contracts(fiscal_year);

-- Contract sources table for provenance tracking
-- Tracks which sources a contract came from (for deduplication and data enrichment)
CREATE TABLE IF NOT EXISTS contract_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    source_record_id VARCHAR(200) NOT NULL,
    source_url VARCHAR(1000),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_name, source_record_id)
);

-- Index for looking up sources by contract
CREATE INDEX IF NOT EXISTS idx_contract_sources_contract_id ON contract_sources(contract_id);

-- Index for looking up by source name
CREATE INDEX IF NOT EXISTS idx_contract_sources_source_name ON contract_sources(source_name);
