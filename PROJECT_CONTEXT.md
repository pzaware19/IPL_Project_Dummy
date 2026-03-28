# Project Context

This document is a deeper handoff companion to `CLAUDE.md`.

It is meant for a new Claude Code session to quickly understand:
- how the project evolved
- which product decisions were deliberate
- where not to break assumptions

## 1. Repository map

### `Code/`
- simulation and modeling logic
- especially `rr_auction_simulator.py`

### `Dashboard/`
- all front-end pages
- `build_dashboard_data.py` is the hub
- `server.py` serves local/hosted pages and backend scenario functionality

### `Data/`
- cleaned IPL ball-by-ball CSV
- phase ranking CSVs
- Monte Carlo outputs
- salary CSV derived from the PDF

### `Paper/`
- economics-style writeup / PDF

## 2. Evolution of the project

The project started closer to an RR-specific auction analysis.

It was later widened into a league-facing product because:
- the user wanted all-team auction logic
- team-specific independent auction outputs created unrealistic duplication
- the dashboard became more compelling as a league-wide intelligence platform

That is why the branding, dashboard framing, and simulation language shifted toward:
- shared league auction
- league intelligence
- team-by-team planning inside one common market

## 3. Important reasoning behind key modules

### Phase Studio
Why it exists:
- phase specialization is the core cricket lens in the project

Why Bayesian shrinkage / impact style framing was preferred:
- raw strike rate or economy is too noisy in small samples
- phase context matters more than one aggregate number

### Player Lab
Why it exists:
- the user wanted player evaluation to feel more like scouting and less like a spreadsheet

Why radar + comps + trajectory were added:
- to give context on shape, replacement logic, and direction of travel

### Matchup Intelligence
Why it became more complex:
- descriptive split tables were not enough
- the user wanted matchup interpretation, not just raw rows

Why direct head-to-head evidence is weighted carefully:
- broad phase percentiles can mislead when a bowler has repeatedly dismissed a batter in a small but meaningful sample

### Scenario Builder
Why backend support was needed:
- user wanted something closer to a true shared-auction counterfactual
- pure browser-side approximation felt too partial-equilibrium and unrealistic

### Match Planning
Why opponent-aware logic matters:
- static SWOT by team was not acceptable
- user explicitly wanted tactics to change by opponent, venue, and likely matchup structure

### Batter Diagnostics
Why this module was framed carefully:
- user wanted scoring strengths/weaknesses from the raw ball-by-ball source
- but current data cannot support true tracking-based claims

So the module intentionally delivers:
- phase
- pressure
- venue
- bowling family
- specific bowler
- dismissal mode

and intentionally does not pretend to know:
- line
- length
- swing type
- scoring zones on the field

### Salary Value Lab
Why this exists:
- user provided a salary PDF and wanted a tangible undervalued / overvalued metric

Why the chosen metric is practical rather than “perfect”:
- the goal was an operational dashboard measure
- not a full structural salary-market paper

That is why the lab uses:
- fair salary
- value gap in crores
- Salary Value Index

## 4. Current main dashboard philosophy

The main dashboard should behave like:
- a concise summary page
- a launcher into specialized tools

It should not try to do everything itself.

That is why many later features were implemented as standalone windows.

## 5. Standalone modules currently present

The project now includes standalone windows for:
- Scenario Builder
- Matchup Intelligence
- Market Inefficiency
- Similarity Search
- Auction War Room
- Draft Board
- IPL 2026 Match-by-Match Planning
- Batter Diagnostics
- Salary Value Lab

These are not accidental additions.
They reflect the idea that separate analyst workflows deserve separate focused surfaces.

## 6. Naming and player-identity handling

This project has already spent meaningful effort on name consistency.

Reason:
- ball-by-ball feeds
- auction files
- retained squad lists
- public cricket naming conventions
do not line up cleanly

Future work should always respect the existing canonical-name pathway.

Do not create a separate local name fix unless absolutely necessary.

## 7. What future Claude Code sessions should be careful about

### Do not over-claim data precision
Examples to avoid unless a new data source is added:
- pitch-map claims
- swing-specific claims
- exact shot-location claims

### Be careful with `index.html`
It has historically been easy to accidentally strip or regress launcher links.

### Do not revert unrelated notebook changes casually
Especially `Code/A1_code.ipynb`.

### Rebuild the generated payload after data-side changes
Most front-end bugs after edits are actually stale bundle issues.

## 8. What would be natural next steps

If a new Claude Code agent continues the repo, strong next directions would be:
- improve salary value model robustness
- add more trustworthy confidence layers across modules
- integrate richer live or tracked data if available
- extend scouting views to bowlers or all-rounders symmetrically
- keep improving match-planning realism

## 9. Short version

This is a sports analytics product with economics and BI instincts.

The central rule for future work should be:

**make the dashboard more useful for real decision-making, but do not fake precision that the data cannot support.**
