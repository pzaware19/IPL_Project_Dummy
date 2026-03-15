# Future IPL Auction Scenarios

This simulator can now be used for future IPL auction seasons as long as the broad auction mechanism remains the same:

- teams bid sequentially
- reserve prices exist
- the auction is open ascending
- team purse and retained-player constraints matter

## Core idea

The model has two layers:

1. `Base team model`
   - generic team identities
   - role-demand logic
   - auction-power calibration
   - bidding and price formation

2. `Season scenario inputs`
   - retained players
   - retained counts
   - overseas retained
   - purse left / amount spent
   - auction-format rules such as squad size and overseas cap
   - optional role caps
   - optional focus-team strategy

That means you should not need to rewrite the model for `2027`, `2028`, or later. You only need to supply a new season context and, when available, a new auction list file.

## Files

- Base simulator: `Code/rr_auction_simulator.py`
- Scenario template: `Code/season_contexts_template.json`
- Full future-season template: `Code/future_auction_scenarios_template.json`

## CLI usage

### Current-season style run

```bash
python Code/rr_auction_simulator.py --team RR --season 2026
```

### Future-season scenario run

```bash
python Code/rr_auction_simulator.py \
  --team RR \
  --season 2027 \
  --context-file Code/season_contexts_template.json
```

### Generate a full all-team template for a new season

```bash
python Code/rr_auction_simulator.py \
  --season 2027 \
  --write-scenario-template Code/future_auction_scenarios_template.json
```

### Future-season run with a new auction workbook

```bash
python Code/rr_auction_simulator.py \
  --team CSK \
  --season 2028 \
  --context-file Code/season_contexts_template.json \
  --auction-file /path/to/ipl_auction_2028_full.xlsx \
  --sold-file /path/to/IPL_Auction_2028_Sold_Player.csv
```

## Scenario JSON schema

The preferred JSON format is keyed by `seasons`, then by season label. Each season can contain:

- `auction_format`
- `auction_file`
- `sold_file`
- `teams`

Example:

```json
{
  "seasons": {
    "2027": {
      "auction_format": {
        "squad_size": 25,
        "overseas_limit": 8
      },
      "auction_file": "/path/to/ipl_auction_2027_full.xlsx",
      "sold_file": "/path/to/IPL_Auction_2027_Sold_Player.csv",
      "teams": {
        "RR": {
          "purse": 18.5,
          "spent": 101.5,
          "retained": 15,
          "overseas_retained": 6,
          "retained_players": [
            "Dhruv Jurel",
            "Jofra Archer",
            "Riyan Parag",
            "Sandeep Sharma",
            "Yashaswi Jaiswal"
          ],
          "max_buys": 6,
          "min_buys": 3,
          "role_caps": {
            "indian_spin": 7.0,
            "overseas_pace": 4.0
          },
          "role_needs": {
            "indian_spin": 1.2,
            "overseas_pace": 1.0,
            "domestic_pace": 0.8
          },
          "focus_strategy": {
            "singleton_roles": ["indian_spin", "overseas_pace"],
            "core_roles": ["indian_spin", "overseas_pace"],
            "non_core_hold_until_set": 14
          }
        }
      }
    }
  }
}
```

The simulator still accepts the legacy compact format:

```json
{
  "2027": {
    "RR": {
      "purse": 18.5
    }
  }
}
```

but the `seasons` format is better because it lets you change league rules as well as team states.

## Recommended workflow for a new season

1. Generate a fresh all-team template with `--write-scenario-template`.
2. Create the new season block in `Code/future_auction_scenarios_template.json` or a new JSON file.
3. Update the season-level `auction_format` if the league changes squad size, overseas cap, or other roster rules.
4. Update each team's:
   - `purse`
   - `spent`
   - `retained`
   - `overseas_retained`
   - `retained_players`
5. Adjust `role_needs` only if the retained core implies a clear change in team demand.
6. Adjust `focus_strategy` only for the team you are actively studying in depth.
7. If you have a new auction workbook, pass it with `--auction-file`, or store it in the season block.
8. If you have the new sold-player list, pass it with `--sold-file`, or store it in the season block.

## Important limitation

The model is portable across seasons, but predictive quality depends on:

- the quality of the retained-player scenario you provide
- whether the new auction list is available
- whether the public performance data still reflects likely market perception

So the architecture is reusable, but every new year still needs updated inputs.
