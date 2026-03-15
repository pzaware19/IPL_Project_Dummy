from __future__ import annotations

import os
from pathlib import Path
import sys

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "Data"
sys.path.insert(0, str(ROOT))

from Code.rr_auction_simulator import (
    BASE_TEAM_CONFIGS,
    extract_team_buys,
    run_auction_simulation,
    summarize_focus_simulations,
)


SEASON = "2026"
DEFAULT_SEED = 0
DEFAULT_ITERATIONS = int(os.environ.get("LEAGUE_MC_ITERATIONS", "500"))
REPRESENTATIVE_TEAM = "RR"


def main() -> None:
    team_codes = sorted(BASE_TEAM_CONFIGS.keys())

    print("Running shared representative league path...")
    representative_events, _, representative_teams = run_auction_simulation(
        focus_team=REPRESENTATIVE_TEAM,
        season=SEASON,
        randomize_within_set=True,
        seed=DEFAULT_SEED,
    )
    representative_events.to_csv(DATA_DIR / f"league_auction_simulation_{SEASON}_events.csv", index=False)

    print(f"Running shared league Monte Carlo with {DEFAULT_ITERATIONS} randomized paths...")
    all_events = []
    team_runs: dict[str, list[pd.DataFrame]] = {team_code: [] for team_code in team_codes}
    for iteration in range(DEFAULT_ITERATIONS):
        iteration_seed = DEFAULT_SEED + iteration
        iter_events_df, _, _ = run_auction_simulation(
            focus_team=REPRESENTATIVE_TEAM,
            season=SEASON,
            randomize_within_set=True,
            seed=iteration_seed,
        )
        events_copy = iter_events_df.copy()
        events_copy["run_id"] = iteration + 1
        all_events.append(events_copy)
        for team_code in team_codes:
            team_df = extract_team_buys(events_copy, team_code)
            team_runs[team_code].append(team_df)

    league_events_mc_df = pd.concat(all_events, ignore_index=True)
    league_events_mc_df.to_csv(DATA_DIR / f"league_auction_simulation_{SEASON}_events_mc.csv", index=False)

    league_rows = []
    for team_code in team_codes:
        slug = team_code.lower()
        representative_buys = extract_team_buys(representative_events, team_code)
        purchase_summary_df, spend_summary_df = summarize_focus_simulations(team_runs[team_code], team_code)

        representative_buys.to_csv(DATA_DIR / f"{slug}_auction_simulated_buys_{SEASON}.csv", index=False)
        purchase_summary_df.to_csv(DATA_DIR / f"{slug}_auction_purchase_summary_{SEASON}_mc.csv", index=False)
        spend_summary_df.to_csv(DATA_DIR / f"{slug}_auction_spend_summary_{SEASON}_mc.csv", index=False)

        representative_spend = round(float(representative_buys["final_price"].sum()), 2) if not representative_buys.empty else 0.0
        purse_left = round(float(representative_teams[team_code].purse), 2)
        mc_avg_spend = round(float(spend_summary_df["total_spend"].mean()), 2) if not spend_summary_df.empty else 0.0
        mc_top_target = purchase_summary_df.iloc[0]["player_name"] if not purchase_summary_df.empty else None
        mc_top_share = float(purchase_summary_df.iloc[0]["share_of_runs"]) if not purchase_summary_df.empty else 0.0
        league_rows.append(
            {
                "team_code": team_code,
                "representative_spend": representative_spend,
                "representative_purse_left": purse_left,
                "mc_average_spend": mc_avg_spend,
                "mc_top_target": mc_top_target,
                "mc_top_target_share": round(mc_top_share, 3),
                "mc_unique_targets": int(purchase_summary_df["player_name"].nunique()) if not purchase_summary_df.empty else 0,
            }
        )

    league_df = pd.DataFrame(league_rows).sort_values("mc_average_spend", ascending=False)
    league_df.to_csv(DATA_DIR / f"league_auction_mc_summary_{SEASON}.csv", index=False)
    print("Saved shared representative league events to", DATA_DIR / f"league_auction_simulation_{SEASON}_events.csv")
    print("Saved shared league Monte Carlo events to", DATA_DIR / f"league_auction_simulation_{SEASON}_events_mc.csv")
    print("Saved league summary to", DATA_DIR / f"league_auction_mc_summary_{SEASON}.csv")


if __name__ == "__main__":
    main()
