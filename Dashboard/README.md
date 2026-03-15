# IPL Auction Intelligence League Dashboard

This dashboard packages the outputs from:

- `Code/A1_code.ipynb`
- `Code/rr_auction_simulator.py`

into a local interactive interface for:

- phase-based batting and bowling leaderboards
- team-level auction outcomes across the IPL
- league-wide Monte Carlo auction stability
- team retention, purse, and auction-power context
- a separate auction path replay view
- an interactive scenario builder for future auction planning
- a matchup-intelligence lab using ball-by-ball outcomes

## Refresh the dashboard data

Run:

```bash
python Dashboard/build_dashboard_data.py
```

This rebuilds:

- `Dashboard/data/dashboard_data.js`

## Open the dashboard

Option 1:

- open `Dashboard/index.html` directly in your browser
- use the launch buttons inside the dashboard to open:
  - `Dashboard/auction_replay.html`
  - `Dashboard/scenario_builder.html`
  - `Dashboard/matchup_intelligence.html`

Option 2:

```bash
python Dashboard/server.py
```

Then visit:

- `http://127.0.0.1:8000`

Use this server mode when you want the Scenario Builder to run real Python-backed general-equilibrium counterfactuals. The older static file server is not enough for the new scenario API.

## Deploy live

The app is now set up for a simple Python web deployment.

### Render

1. Push this repo to GitHub.
2. Create a new Render Web Service from the repo.
3. Render will detect [render.yaml](/Users/piyushzaware/Documents/IPL_Data_Analysis/render.yaml).
4. It will:
   - install [requirements.txt](/Users/piyushzaware/Documents/IPL_Data_Analysis/requirements.txt)
   - build [dashboard_data.js](/Users/piyushzaware/Documents/IPL_Data_Analysis/Dashboard/data/dashboard_data.js)
   - start [server.py](/Users/piyushzaware/Documents/IPL_Data_Analysis/Dashboard/server.py)

The server now uses environment-based `HOST` and `PORT`, so it is compatible with hosted platforms.

## Current assumptions reflected in the dashboard

- phase rankings come from the notebook-generated CSV outputs
- the auction panel uses league-wide 2026 simulation outputs
- within-set player order is randomized by default in the auction simulator
- Monte Carlo summaries are based on the latest `*_auction_purchase_summary_2026_mc.csv` files
- matchup style splits use auction-workbook player metadata where names can be matched to the ball-by-ball sample
