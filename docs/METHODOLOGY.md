# WA Transparency Methodology

## Entity Resolution

### Overview

Entity resolution is the process of determining whether two records refer to the same real-world entity. This is critical for connecting campaign contributions, lobbying activities, and government contracts to the correct organizations and individuals.

### Resolution Pipeline

```
Raw Record
    │
    ▼
┌─────────────────┐
│ Normalization   │ ◄── Standardize names, addresses
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Exact Matching  │ ◄── Name, EIN, registration ID
└────────┬────────┘
         │ No Match
         ▼
┌─────────────────┐
│ Fuzzy Matching  │ ◄── Trigram similarity, token matching
└────────┬────────┘
         │ Uncertain
         ▼
┌─────────────────┐
│ AI Disambiguation│ ◄── Claude API for context analysis
└────────┬────────┘
         │ Still Uncertain
         ▼
┌─────────────────┐
│ Manual Review   │ ◄── Human verification queue
└─────────────────┘
```

### Normalization Rules

#### Organization Names
1. Convert to title case
2. Standardize suffixes (Inc, Corp, LLC, etc.)
3. Remove punctuation variations
4. Handle "The" prefix consistently

#### Person Names
1. Convert to title case
2. Remove honorific prefixes (Mr., Mrs., Dr.)
3. Standardize suffixes (Jr., Sr., III)
4. Handle middle initials consistently

#### Addresses
1. Standardize street types (Street → St, Avenue → Ave)
2. Standardize directions (North → N, Northeast → NE)
3. Normalize unit designations (Suite → Ste, Apartment → Apt)
4. Extract and normalize ZIP codes to 5 digits

### Matching Algorithms

#### Exact Matching
- Case-insensitive name comparison
- EIN matching (when available)
- PDC/USASpending ID matching

#### Fuzzy Matching
We use multiple similarity algorithms:

1. **Jaro-Winkler Similarity**
   - Good for short strings and typos
   - Weighted toward prefix matches

2. **Levenshtein Distance**
   - Character-level edit distance
   - Normalized to similarity score

3. **Token Sort Ratio**
   - Handles word order variations
   - Useful for "Smith, John" vs "John Smith"

The final score combines these with weights:
```
score = 0.4 * jaro_winkler + 0.3 * levenshtein + 0.3 * token_sort
```

#### Multi-Field Scoring
When additional fields are available:

| Field   | Weight |
|---------|--------|
| Name    | 0.50   |
| Address | 0.15   |
| City    | 0.10   |
| State   | 0.05   |
| ZIP     | 0.10   |
| Type    | 0.10   |

### Confidence Thresholds

| Score Range | Action |
|-------------|--------|
| ≥ 0.95 | Auto-match with high confidence |
| 0.85 - 0.94 | Auto-match with medium confidence |
| 0.70 - 0.84 | Use Claude AI for disambiguation |
| < 0.70 | No match (may create new entity) |

### AI Disambiguation

For uncertain matches (0.70-0.84 score), we use Claude AI to analyze:

1. Name similarity in context
2. Business type consistency
3. Geographic proximity
4. Historical patterns

The AI provides:
- Match/no-match decision
- Confidence score (0-1)
- Reasoning explanation

### Manual Review

Cases flagged for manual review:
- AI confidence below 0.8
- Conflicting signals (name match but location mismatch)
- Multiple potential matches with similar scores

## Data Quality

### Validation Rules

1. **Amount Validation**
   - Contributions must be positive
   - Contracts must be non-zero
   - Outliers flagged for review

2. **Date Validation**
   - Dates must be valid
   - Future dates flagged
   - Very old dates validated against source

3. **Reference Validation**
   - Foreign keys must exist
   - Entity types must be consistent

### Deduplication

Records may appear in multiple sources. We deduplicate by:
1. Matching on source IDs (pdc_id, usaspending_id)
2. Fuzzy matching on date + amount + parties
3. Keeping the most recent/complete record

## Aggregate Calculations

### Contribution Totals

```sql
total_given = SUM(amount) WHERE contributor_entity_id = X
total_received = SUM(amount) WHERE recipient_entity_id = X
```

### Contract Totals

```sql
total_contracts = SUM(amount) WHERE recipient_entity_id = X
```

### Connection Strength

The connection between two entities is scored by:
```
strength = log10(total_amount + 1) * log10(transaction_count + 1)
```

## Limitations and Caveats

### Known Limitations

1. **Historical Completeness**
   - Older records may be less complete
   - Some historical lobbying data unavailable

2. **Entity Resolution Accuracy**
   - Some false positives/negatives inevitable
   - Name variations may escape matching

3. **Timing Delays**
   - Data freshness depends on source updates
   - Typically 24-48 hour lag

### Interpretation Guidelines

1. **Amounts are as reported**
   - We do not adjust for inflation
   - We do not verify reported amounts

2. **Connections are associative, not causal**
   - A contribution doesn't imply influence
   - A lobbying registration doesn't imply success

3. **Entity matching is probabilistic**
   - High-confidence matches may still be wrong
   - Some connections may be missed

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01 | Initial methodology |
