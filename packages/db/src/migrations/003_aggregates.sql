-- Washington State Political Transparency - Materialized Views for Aggregates

-- Entity aggregate stats
CREATE MATERIALIZED VIEW entity_aggregates AS
SELECT
    e.id AS entity_id,
    COALESCE(contrib_given.total, 0) AS total_contributions_given,
    COALESCE(contrib_received.total, 0) AS total_contributions_received,
    COALESCE(contracts_received.total, 0) AS total_contracts_received,
    COALESCE(contrib_given.count, 0) AS contribution_count_given,
    COALESCE(contrib_received.count, 0) AS contribution_count_received,
    COALESCE(contracts_received.count, 0) AS contract_count,
    COALESCE(lobbying.count, 0) AS lobbying_registration_count,
    COALESCE(sponsorships.count, 0) AS bill_sponsorship_count,
    GREATEST(
        contrib_given.last_date,
        contrib_received.last_date,
        contracts_received.last_date,
        lobbying.last_date
    ) AS last_activity_date
FROM entities e
LEFT JOIN (
    SELECT
        contributor_entity_id AS entity_id,
        SUM(amount) AS total,
        COUNT(*) AS count,
        MAX(contribution_date) AS last_date
    FROM contributions
    WHERE contributor_entity_id IS NOT NULL
    GROUP BY contributor_entity_id
) contrib_given ON e.id = contrib_given.entity_id
LEFT JOIN (
    SELECT
        recipient_entity_id AS entity_id,
        SUM(amount) AS total,
        COUNT(*) AS count,
        MAX(contribution_date) AS last_date
    FROM contributions
    WHERE recipient_entity_id IS NOT NULL
    GROUP BY recipient_entity_id
) contrib_received ON e.id = contrib_received.entity_id
LEFT JOIN (
    SELECT
        recipient_entity_id AS entity_id,
        SUM(amount) AS total,
        COUNT(*) AS count,
        MAX(start_date) AS last_date
    FROM contracts
    WHERE recipient_entity_id IS NOT NULL
    GROUP BY recipient_entity_id
) contracts_received ON e.id = contracts_received.entity_id
LEFT JOIN (
    SELECT
        employer_entity_id AS entity_id,
        COUNT(*) AS count,
        MAX(registration_date) AS last_date
    FROM lobbying_registrations
    WHERE employer_entity_id IS NOT NULL
    GROUP BY employer_entity_id
) lobbying ON e.id = lobbying.entity_id
LEFT JOIN (
    SELECT
        entity_id,
        COUNT(*) AS count
    FROM bill_sponsors
    GROUP BY entity_id
) sponsorships ON e.id = sponsorships.entity_id;

-- Index on materialized view
CREATE UNIQUE INDEX idx_entity_aggregates_entity_id ON entity_aggregates(entity_id);
CREATE INDEX idx_entity_aggregates_contributions_given ON entity_aggregates(total_contributions_given DESC);
CREATE INDEX idx_entity_aggregates_contributions_received ON entity_aggregates(total_contributions_received DESC);
CREATE INDEX idx_entity_aggregates_contracts ON entity_aggregates(total_contracts_received DESC);

-- Top donors by year
CREATE MATERIALIZED VIEW top_donors_by_year AS
SELECT
    contributor_entity_id AS entity_id,
    election_year,
    SUM(amount) AS total_amount,
    COUNT(*) AS contribution_count,
    COUNT(DISTINCT recipient_entity_id) AS recipient_count
FROM contributions
WHERE contributor_entity_id IS NOT NULL
GROUP BY contributor_entity_id, election_year
ORDER BY election_year DESC, total_amount DESC;

CREATE INDEX idx_top_donors_year ON top_donors_by_year(election_year, total_amount DESC);
CREATE INDEX idx_top_donors_entity ON top_donors_by_year(entity_id);

-- Top recipients by year
CREATE MATERIALIZED VIEW top_recipients_by_year AS
SELECT
    recipient_entity_id AS entity_id,
    election_year,
    SUM(amount) AS total_amount,
    COUNT(*) AS contribution_count,
    COUNT(DISTINCT contributor_entity_id) AS donor_count
FROM contributions
WHERE recipient_entity_id IS NOT NULL
GROUP BY recipient_entity_id, election_year
ORDER BY election_year DESC, total_amount DESC;

CREATE INDEX idx_top_recipients_year ON top_recipients_by_year(election_year, total_amount DESC);
CREATE INDEX idx_top_recipients_entity ON top_recipients_by_year(entity_id);

-- Contribution connections (donor -> recipient pairs)
CREATE MATERIALIZED VIEW contribution_connections AS
SELECT
    contributor_entity_id AS donor_id,
    recipient_entity_id AS recipient_id,
    SUM(amount) AS total_amount,
    COUNT(*) AS contribution_count,
    MIN(contribution_date) AS first_contribution,
    MAX(contribution_date) AS last_contribution
FROM contributions
WHERE contributor_entity_id IS NOT NULL
  AND recipient_entity_id IS NOT NULL
GROUP BY contributor_entity_id, recipient_entity_id;

CREATE INDEX idx_contribution_connections_donor ON contribution_connections(donor_id);
CREATE INDEX idx_contribution_connections_recipient ON contribution_connections(recipient_id);
CREATE INDEX idx_contribution_connections_amount ON contribution_connections(total_amount DESC);

-- Active lobbyists with their clients
CREATE MATERIALIZED VIEW active_lobbyists AS
SELECT
    lr.lobbyist_entity_id,
    lr.lobbyist_name,
    COUNT(DISTINCT lr.employer_entity_id) AS client_count,
    SUM(COALESCE(la.compensation, 0)) AS total_compensation,
    ARRAY_AGG(DISTINCT lr.employer_name) AS clients
FROM lobbying_registrations lr
LEFT JOIN lobbying_activities la ON lr.id = la.registration_id
WHERE lr.status = 'active'
GROUP BY lr.lobbyist_entity_id, lr.lobbyist_name;

CREATE INDEX idx_active_lobbyists_entity ON active_lobbyists(lobbyist_entity_id);
CREATE INDEX idx_active_lobbyists_clients ON active_lobbyists(client_count DESC);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_aggregates()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY entity_aggregates;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_donors_by_year;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_recipients_by_year;
    REFRESH MATERIALIZED VIEW CONCURRENTLY contribution_connections;
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_lobbyists;
END;
$$ LANGUAGE plpgsql;
