# WA Transparency Data Sources

## Washington Public Disclosure Commission (PDC)

### Overview
The PDC is the primary source for campaign finance and lobbying data in Washington State.

**Website**: https://www.pdc.wa.gov/

### Available Data

#### Campaign Contributions
- Individual and organizational contributions to candidates
- PAC contributions
- In-kind contributions
- Contribution limits and dates

**Update Frequency**: Daily during filing periods

#### Expenditures
- Campaign spending records
- Vendor payments
- Independent expenditures

**Update Frequency**: Daily during filing periods

#### Lobbying
- Lobbyist registrations
- Employer/client relationships
- Lobbying compensation reports
- Subject matter of lobbying

**Update Frequency**: Quarterly

#### Candidates
- Registered candidates
- Office sought
- Party affiliation
- Filing status

**Update Frequency**: As filed

### API Access
The PDC provides a public API for accessing disclosure data.

**Documentation**: https://www.pdc.wa.gov/political-disclosure-reporting-data/open-data

### Limitations
- Historical data completeness varies
- Some records may have data quality issues
- API rate limits apply

---

## USASpending.gov

### Overview
USASpending.gov is the official source for federal spending data.

**Website**: https://www.usaspending.gov/

### Available Data

#### Contracts
- Federal contract awards
- Recipient information
- Award amounts and dates
- NAICS codes and descriptions
- Place of performance

**Update Frequency**: Weekly

#### Grants
- Federal grant awards (future implementation)

### API Access
USASpending provides a comprehensive REST API.

**Documentation**: https://api.usaspending.gov/

### Filtering Strategy
We filter for:
- Place of performance in Washington State
- Contract awards (type A, B, C, D)

### Limitations
- Large dataset requires careful filtering
- Some recipient names require normalization
- Historical data back to FY 2008

---

## Washington State Legislature

### Overview
The WA Legislature provides data on bills, votes, and legislators.

**Website**: https://leg.wa.gov/

### Available Data

#### Bills
- Bill text and history
- Sponsors and co-sponsors
- Status and actions
- Subject classifications

**Update Frequency**: Real-time during sessions

#### Legislators
- Current members
- Committee assignments
- District information
- Contact information

**Update Frequency**: As changes occur

#### Votes
- Roll call votes
- Vote tallies
- Individual vote records

**Update Frequency**: Real-time during sessions

### API Access
The Legislature provides web services for accessing data.

**Documentation**: https://wslwebservices.leg.wa.gov/

### Limitations
- SOAP/XML API requires parsing
- Historical vote records vary in completeness
- Session boundaries affect data availability

---

## Washington Secretary of State

### Overview
The SOS provides business registration data for entity verification.

**Website**: https://www.sos.wa.gov/

### Available Data

#### Business Registrations
- Registered business names
- UBI numbers
- Registration dates
- Registered agents

### Use Case
Primarily used for:
- Verifying organization identities
- Cross-referencing with PDC filings
- Resolving entity aliases

### Limitations
- Bulk data access may require special arrangement
- Not all political entities are registered businesses

---

## Data Quality Notes

### Common Issues

1. **Name Variations**
   - Abbreviations (Inc., Corp., LLC)
   - Misspellings in filings
   - Different legal vs. DBA names

2. **Address Inconsistencies**
   - PO Box vs. street address
   - Suite/unit number variations
   - Zip code formatting

3. **Date Issues**
   - Different date formats
   - Missing dates on older records
   - Timezone considerations

### Mitigation Strategies

1. **Normalization**
   - Standardize business suffixes
   - Parse and normalize addresses
   - Consistent date formatting

2. **Entity Resolution**
   - Fuzzy matching algorithms
   - AI-assisted disambiguation
   - Manual review workflow

3. **Data Validation**
   - Schema validation on import
   - Range checks on amounts
   - Date validity checks

---

## Update Schedule

| Source | Sync Frequency | Time (PT) |
|--------|----------------|-----------|
| PDC Contributions | Daily | 2:00 AM |
| PDC Lobbying | Daily | 2:00 AM |
| PDC Candidates | Daily | 3:00 AM |
| USASpending | Weekly | Sunday 4:00 AM |
| WA Legislature | Weekly | Sunday 5:00 AM |
| Aggregates | Daily | 6:00 AM |
| Site Rebuild | Daily | 7:00 AM |
