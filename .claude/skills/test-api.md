# /test-api - Test External API Connections

Test connectivity and responses from external data source APIs.

## Usage

```
/test-api [source]
```

## Sources

| Source | Description |
|--------|-------------|
| `pdc` | Washington Public Disclosure Commission |
| `usaspending` | USASpending.gov federal contracts |
| `legislature` | WA State Legislature |
| `all` | Test all sources |

## Implementation

### PDC API Test

```bash
# Test contributions endpoint
curl -s "https://www.pdc.wa.gov/api/explorer" | head -20

# With API key (if required)
curl -s -H "X-API-Key: $PDC_API_KEY" \
  "https://www.pdc.wa.gov/api/v1/contributions?limit=1"
```

### USASpending API Test

```bash
# Test award search endpoint
curl -s -X POST "https://api.usaspending.gov/api/v2/search/spending_by_award/" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "place_of_performance_locations": [{"country": "USA", "state": "WA"}],
      "award_type_codes": ["A"]
    },
    "limit": 1
  }'
```

### WA Legislature API Test

```bash
# Test WSDL endpoint
curl -s "https://wslwebservices.leg.wa.gov/LegislativeService.asmx?WSDL" | head -30
```

## Expected Responses

- **PDC**: JSON array of contribution records
- **USASpending**: JSON with `results` array of awards
- **Legislature**: XML WSDL definition

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key in .env |
| 403 Forbidden | Check rate limits |
| Timeout | API may be down, retry later |
| Empty results | Adjust query parameters |

## Examples

```
/test-api pdc
/test-api usaspending
/test-api all
```
