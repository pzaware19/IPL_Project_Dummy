# Layer 3 Availability Intelligence Pipeline

## Purpose

Layer 3 is the pre-match availability and selection-intelligence layer for CreaseIQ.

It sits above:
- `Layer 1`: historical IPL intelligence
- `Layer 2`: live toss / playing XI / match context

Layer 3 is meant to capture:
- injury reports
- workload management
- doubtful selections
- overseas availability issues
- likely replacement paths

## Files

- `Data/layer3_watchlist.json`
  - curated source registry
- `Data/layer3_seed_urls_2026.json`
  - direct high-value article URLs that bypass weak homepage discovery
- `Data/layer3_source_inbox_2026.json`
  - raw fetched items
- `Data/layer3_extracted_claims_2026.json`
  - Groq-extracted structured claims
- `Data/team_availability_2026.json`
  - final resolved truth table used by the product
- `Code/update_layer3_intel.py`
  - ingestion / extraction / resolution workflow

## Basic usage

### 1. Ingest source items

```bash
python Code/update_layer3_intel.py --ingest-only
```

### 2. Run Groq extraction on inbox items

Requires:
- `GROQ_API_KEY`

```bash
python Code/update_layer3_intel.py --extract-only
```

### 3. Resolve claims into canonical availability registry

```bash
python Code/update_layer3_intel.py --resolve-only
```

### 4. Run the full flow

```bash
python Code/update_layer3_intel.py
```

## Current design notes

- Manual sources can still be added by appending rows into the inbox file.
- High-confidence direct reports can be added to `layer3_seed_urls_2026.json` so the pipeline ingests them every run.
- Watchlist entries with blank URLs are placeholders to fill with real source URLs.
- The resolver currently picks the strongest and newest claim per player/team using a simple confidence hierarchy.
- This is intentionally a first-pass operational scaffold, not the final conflict-resolution system.

## Next integration step

Once the registry is populated, wire `team_availability_2026.json` into:
- `Dashboard/build_dashboard_data.py`
- `Dashboard/rr_hub.html`
- `Dashboard/match_planning.js`

The match engine should then adjust likely XI assumptions before tactical summaries are generated.
