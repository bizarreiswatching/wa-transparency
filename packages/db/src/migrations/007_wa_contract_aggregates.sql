-- Washington State Contract Aggregates
-- Materialized views for contract statistics by source and top contractors by level

-- Contract stats by source type and awarding agency type
CREATE MATERIALIZED VIEW IF NOT EXISTS contract_stats_by_source AS
SELECT
    source_type,
    awarding_agency_type,
    COUNT(*) AS contract_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(start_date) AS earliest_contract,
    MAX(start_date) AS latest_contract,
    COUNT(DISTINCT recipient_entity_id) AS unique_contractors,
    COUNT(DISTINCT awarding_agency) AS unique_agencies
FROM contracts
WHERE place_of_performance_state = 'WA'
   OR source_type IN ('state', 'county', 'city')
GROUP BY source_type, awarding_agency_type;

-- Indexes for contract_stats_by_source
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_stats_source_agency
    ON contract_stats_by_source(source_type, awarding_agency_type);
CREATE INDEX IF NOT EXISTS idx_contract_stats_total
    ON contract_stats_by_source(total_amount DESC);

-- Top contractors by government level (federal, state, county, city)
CREATE MATERIALIZED VIEW IF NOT EXISTS top_contractors_by_level AS
SELECT
    awarding_agency_type,
    recipient_entity_id,
    recipient_name,
    COUNT(*) AS contract_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(start_date) AS first_contract_date,
    MAX(start_date) AS last_contract_date,
    ARRAY_AGG(DISTINCT awarding_agency) AS agencies
FROM contracts
WHERE recipient_entity_id IS NOT NULL
  AND (place_of_performance_state = 'WA' OR source_type IN ('state', 'county', 'city'))
GROUP BY awarding_agency_type, recipient_entity_id, recipient_name
ORDER BY awarding_agency_type, total_amount DESC;

-- Indexes for top_contractors_by_level
CREATE UNIQUE INDEX IF NOT EXISTS idx_top_contractors_level_entity
    ON top_contractors_by_level(awarding_agency_type, recipient_entity_id);
CREATE INDEX IF NOT EXISTS idx_top_contractors_level_amount
    ON top_contractors_by_level(awarding_agency_type, total_amount DESC);
CREATE INDEX IF NOT EXISTS idx_top_contractors_entity
    ON top_contractors_by_level(recipient_entity_id);

-- Top contractors by fiscal year (for state/county contracts with fiscal_year data)
CREATE MATERIALIZED VIEW IF NOT EXISTS top_contractors_by_fiscal_year AS
SELECT
    fiscal_year,
    awarding_agency_type,
    recipient_entity_id,
    recipient_name,
    COUNT(*) AS contract_count,
    SUM(amount) AS total_amount
FROM contracts
WHERE fiscal_year IS NOT NULL
  AND recipient_entity_id IS NOT NULL
GROUP BY fiscal_year, awarding_agency_type, recipient_entity_id, recipient_name
ORDER BY fiscal_year DESC, total_amount DESC;

-- Indexes for top_contractors_by_fiscal_year
CREATE UNIQUE INDEX IF NOT EXISTS idx_top_contractors_fy_entity
    ON top_contractors_by_fiscal_year(fiscal_year, awarding_agency_type, recipient_entity_id);
CREATE INDEX IF NOT EXISTS idx_top_contractors_fy_amount
    ON top_contractors_by_fiscal_year(fiscal_year, total_amount DESC);

-- Agency spending summary (which agencies are awarding the most contracts)
CREATE MATERIALIZED VIEW IF NOT EXISTS agency_spending_summary AS
SELECT
    awarding_agency,
    awarding_agency_type,
    source_type,
    COUNT(*) AS contract_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    COUNT(DISTINCT recipient_entity_id) AS unique_contractors
FROM contracts
WHERE place_of_performance_state = 'WA'
   OR source_type IN ('state', 'county', 'city')
GROUP BY awarding_agency, awarding_agency_type, source_type
ORDER BY total_amount DESC;

-- Indexes for agency_spending_summary
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_spending_agency
    ON agency_spending_summary(awarding_agency, source_type);
CREATE INDEX IF NOT EXISTS idx_agency_spending_total
    ON agency_spending_summary(total_amount DESC);

-- Update the refresh_all_aggregates function to include new views
CREATE OR REPLACE FUNCTION refresh_all_aggregates()
RETURNS void AS $$
BEGIN
    -- Original aggregates
    REFRESH MATERIALIZED VIEW entity_aggregates;
    REFRESH MATERIALIZED VIEW top_donors_by_year;
    REFRESH MATERIALIZED VIEW top_recipients_by_year;
    REFRESH MATERIALIZED VIEW contribution_connections;
    REFRESH MATERIALIZED VIEW active_lobbyists;
    -- New contract aggregates
    REFRESH MATERIALIZED VIEW contract_stats_by_source;
    REFRESH MATERIALIZED VIEW top_contractors_by_level;
    REFRESH MATERIALIZED VIEW top_contractors_by_fiscal_year;
    REFRESH MATERIALIZED VIEW agency_spending_summary;
END;
$$ LANGUAGE plpgsql;

-- Also create a function to refresh only contract views (faster for contract-only updates)
CREATE OR REPLACE FUNCTION refresh_contract_aggregates()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW contract_stats_by_source;
    REFRESH MATERIALIZED VIEW top_contractors_by_level;
    REFRESH MATERIALIZED VIEW top_contractors_by_fiscal_year;
    REFRESH MATERIALIZED VIEW agency_spending_summary;
END;
$$ LANGUAGE plpgsql;
