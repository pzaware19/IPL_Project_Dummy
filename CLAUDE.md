# CLAUDE.md

This repository is an IPL analytics and decision-support project built around a Python data pipeline and a vanilla HTML/CSS/JavaScript dashboard surface.

This file is intended as a handoff for a new Claude Code project so work can resume with the right context, priorities, and design assumptions.

## Project intent

The project is not meant to be a generic cricket stats site.

The guiding idea is to build something closer to a:
- front-office decision platform
- cricket strategy workbench
- sports analytics + BI product

That is why the project combines:
- ball-by-ball performance modeling
- phase-based impact rankings
- matchup intelligence
- auction simulation
- salary value diagnostics
- match-planning workflows

The emphasis throughout has been on **decision usefulness**, not only descriptive visualization.

## Core design philosophy

1. Use the ball-by-ball data as the quantitative backbone.
2. Build interpretable, phase-based metrics rather than opaque black-box scores.
3. Keep the front end interactive but lightweight: plain HTML + CSS + vanilla JS instead of React.
4. Prefer modular standalone dashboard windows for major workflows instead of crowding everything into one page.
5. Be explicit about data limitations.
6. When data cannot support a claim, do not fake precision.

## Current architecture

### Data / modeling
- `Code/rr_auction_simulator.py`
  - main auction simulation logic
  - canonical player naming / alias normalization is critical here
  - contains auction-side quality and ceiling logic used elsewhere

- `Dashboard/build_dashboard_data.py`
  - the central build script for the dashboard payload
  - generates `Dashboard/data/dashboard_data.js`
  - this is the most important file for dashboard feature work
  - many later additions were implemented by enriching this payload rather than adding ad hoc client logic

- `Data/`
  - cleaned CSVs
  - phase ranking files
  - Monte Carlo auction outputs
  - newly added: `ipl_salaries_2026.csv`

### Front end
- Main dashboard:
  - `Dashboard/index.html`
  - `Dashboard/app.js`
  - `Dashboard/styles.css`

- Standalone modules:
  - `Dashboard/scenario_builder.html`
  - `Dashboard/matchup_intelligence.html`
  - `Dashboard/match_planning.html`
  - `Dashboard/auction_war_room.html`
  - `Dashboard/draft_board.html`
  - `Dashboard/market_inefficiency.html`
  - `Dashboard/similarity_search.html`
  - `Dashboard/batter_diagnostics.html`
  - `Dashboard/salary_value_lab.html`

### Backend / serving
- `Dashboard/server.py`
  - local / hosted server
  - serves dashboard pages
  - supports scenario-running backend functionality
  - a live LLM match-brief endpoint exists in backend history, but the UI was removed from the dashboard

## Why vanilla JS instead of React

This was a deliberate choice.

Reasons:
- lower deployment complexity
- easier static hosting / Render setup
- no framework build overhead
- easier to move fast on multiple standalone pages
- good fit for a payload-driven dashboard where most complexity lives in Python data generation

This project is therefore intentionally **payload-first, framework-light**.

## Current product surface

### Main dashboard
The main screen is a launcher + summary hub. It currently links out to the major specialized workflows.

Important note:
- `index.html` was accidentally stripped down in a later commit
- it has since been restored to the fuller launcher-style version and extended with newer modules
- if future work touches `index.html`, do so carefully because it has historically been a merge hotspot

### Phase Studio
Purpose:
- identify batting and bowling leaders by phase

Why it exists:
- phase specialization is one of the project’s core analytical ideas
- the project treats powerplay, middle overs, and death overs as materially different skill environments

### Player Lab
Purpose:
- summarize player shape through radar, wins-added proxy, comps, and trajectory

Why it exists:
- user wanted player evaluation to feel like scouting / roster construction, not only ranking tables

### Matchup Intelligence
Purpose:
- live-style batter vs bowler interaction view using ball-by-ball evidence

Why it exists:
- cricket decisions are often matchup-specific rather than purely player-level

Key design decision:
- this is intentionally an “AI-style” interpretation layer built from structured data
- direct head-to-head evidence is now weighted more heavily when repeated dismissals exist
- this was changed because earlier logic gave too much weight to broad player percentiles in cases where direct matchup evidence clearly pointed the other way

### Scenario Builder
Purpose:
- user-adjustable shared auction counterfactual

Why it exists:
- user wanted something closer to a general-equilibrium auction tool rather than a static ranking board

Important design decision:
- the browser-only approximation was replaced by a backend-backed shared-auction counterfactual runner
- this was done because isolated team re-ranking was not economically coherent

### Match Planning
Purpose:
- game-by-game SWOT and tactical planning for IPL 2026

Why it exists:
- connects player and team metrics to actual fixtures and opposition context

Important design evolution:
- started too generic
- later made opponent-aware and venue-aware
- then player-weighting was refined because raw impact totals over-promoted some players in matchup plans

### Batter Diagnostics
Purpose:
- maximum batter scouting view possible from current Cricsheet-style ball-by-ball data

Why it exists:
- user wanted to know where a batter is strong/weak using the current JSON/CSV without pretending access to Hawkeye-style tracking

Important design decision:
- this module is explicit about limits
- it uses:
  - phase
  - pressure
  - venue
  - bowling family
  - named bowlers
  - dismissal modes
- it does **not** claim to know true pitch-map length / line / swing because the current source data does not support that

Recent fix:
- when the horizon is `Active`, the “Named Bowlers to Target / Respect” tables now only show active bowlers

### Salary Value Lab
Purpose:
- compare active players’ current 2026 salary with a model-implied fair salary

Why it exists:
- user wanted a tangible undervalued / overvalued measure based on current price and total IPL performance

Important design decisions:
- salary sheet PDF was normalized into `Data/ipl_salaries_2026.csv`
- the dashboard reads the CSV, not the PDF, during normal operation
- this avoids making runtime/dashboard generation depend on PDF parsing availability

Key metric:
- `Salary Value Index = 100 * Fair Salary / Current Salary`

Interpretation:
- `> 100`: undervalued
- `< 100`: overvalued

Supporting measure:
- `Value Gap (Cr) = Fair Salary - Current Salary`

Important caveat:
- the model initially got distorted by tiny batting samples from bowlers / tailenders
- this was corrected by requiring minimum batting/bowling signal thresholds before those sides contribute to the valuation model

## Data assumptions and important conventions

### Active player rule
- `ACTIVE_CUTOFF_YEAR = 2025`

Meaning:
- “active” currently means the player has IPL evidence through 2025 in the project’s data

This assumption affects:
- active player lists
- active phase views
- batter diagnostics active horizon
- match planning active-core logic
- salary value lab active-player coverage

### Name normalization
Canonical naming is a major project dependency.

Why it matters:
- Cricsheet names
- retained-core names
- auction pool names
- dashboard display names
often differ

Much effort went into:
- alias maps
- canonical display names
- mapping abbreviated scorecard names back to preferred player names

Any future feature that joins multiple data layers should use the existing canonicalization path instead of inventing a new one.

### Cricsheet limitations
Current ball-by-ball data supports:
- outcomes
- wickets
- phase
- venue/city
- pressure state
- named batter/bowler interactions

It does **not** support:
- ball line
- ball length
- swing/seam movement
- wagon-wheel shot coordinates

This is why some diagnostics are condition-based rather than true tracking-based.

## Auction model context

The auction side moved through several iterations.

The important final framing is:
- shared league simulation
- one common auction universe
- player should not appear as a purchase for multiple teams in the same representative output

Why:
- independent team-by-team worlds caused unrealistic duplication across teams

The Scenario Builder later moved toward a more genuine shared-auction counterfactual to reflect this logic.

## Match-planning design decisions

The match-planning module was repeatedly refined because the original version was too generic.

Current intended behavior:
- SWOT and tactics should depend on:
  - opponent
  - venue
  - likely core players
  - matchup-specific edges

The module should not collapse to “same team, same talking points every match.”

Recent stadium enhancement:
- Stadium Specialists batters now show **runs** at venue instead of balls faced
- venue-specific high-pressure batter/bowler cards were added

Why:
- runs are more interpretable than balls in the stadium summary
- pressure response is useful in venue-specific tactical planning

## Styling / UX direction

The dashboard styling was pushed toward:
- IPL / cricket / sports broadcast feel
- darker stadium-style backgrounds
- green-and-gold sports palette
- stronger contrast cards and hero actions

Design goal:
- feel closer to a sports analytics product than a generic BI dashboard

Also:
- multiple standalone windows are intentional
- each module should feel like a focused tool, not just a tab

## Deployment

Current hosted URL:
- `https://ipl-auction-dashboard-1.onrender.com`

Render deployment setup exists via:
- `render.yaml`
- `requirements.txt`

Important deployment note:
- generated dashboard payload `Dashboard/data/dashboard_data.js` is built from source
- it is not meant to be manually maintained

## Key recent commits

Recent history worth knowing:
- `24e602a` Filter active bowler matchups in batter diagnostics
- `c3c0a02` Restore dashboard launchers and add salary value lab
- `e9e3935` Add batter diagnostics dashboard
- `c7b4d60` Enhance match planning stadium specialists
- `486b6ad` Remove live LLM match brief UI
- `0d9411a` Refine match planning player weighting
- `69ead6b` Make match planning opponent aware
- `6bc02a2` Add IPL 2026 match planning dashboard

## Known caveats / open ends

1. The live LLM match-brief UI was removed.
- backend traces may still exist
- frontend no longer exposes it

2. Salary value model is useful but still heuristic.
- it is not a formal labor-market econometric model
- it is a practical fair-salary approximation built on project metrics

3. Batter diagnostics intentionally stop at the limit of current data.
- no fake line/length/swing claims

4. `index.html` has a history of accidental regression.
- treat changes there carefully

5. `Code/A1_code.ipynb` may contain unrelated local changes from prior work.
- don’t blindly revert it

## Recommended way for Claude Code to continue

If continuing development, start by reading:
1. `CLAUDE.md`
2. `docs/PROJECT_CONTEXT.md`
3. `Dashboard/build_dashboard_data.py`
4. `Dashboard/index.html`
5. the specific standalone module being changed

Preferred workflow:
1. change the Python payload first
2. then change the module-specific HTML / JS
3. rebuild `Dashboard/data/dashboard_data.js`
4. run quick JS syntax checks

Useful commands:
```bash
python Dashboard/build_dashboard_data.py
node --check Dashboard/app.js
node --check Dashboard/match_planning.js
node --check Dashboard/batter_diagnostics.js
node --check Dashboard/salary_value_lab.js
python Dashboard/server.py
```

## Handoff summary

This repo should be understood as:
- an IPL decision-support platform
- built on a strong ball-by-ball analytical spine
- expanded into auction, matchup, salary, and match-planning products

The “why” behind most features is:
- move from descriptive cricket stats to decision-grade cricket intelligence.
