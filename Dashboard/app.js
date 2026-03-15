(function () {
  const data = window.DASHBOARD_DATA;

  const els = {
    heroTitle: document.getElementById("hero-title"),
    heroSubtitle: document.getElementById("hero-subtitle"),
    storyPanels: document.getElementById("story-panels"),
    kpiGrid: document.getElementById("kpi-grid"),
    phaseHorizon: document.getElementById("phase-horizon"),
    phaseDiscipline: document.getElementById("phase-discipline"),
    phasePhase: document.getElementById("phase-phase"),
    phasePlayerSearch: document.getElementById("phase-player-search"),
    phasePlayerCompare: document.getElementById("phase-player-compare"),
    phasePlayerOptions: document.getElementById("phase-player-options"),
    phaseMatchup: document.getElementById("phase-matchup"),
    phaseBars: document.getElementById("phase-bars"),
    phaseTable: document.getElementById("phase-table"),
    playerType: document.getElementById("player-type"),
    playerSearch: document.getElementById("player-search"),
    playerCompareSearch: document.getElementById("player-compare-search"),
    playerOptions: document.getElementById("player-options"),
    playerRadar: document.getElementById("player-radar"),
    playerSummary: document.getElementById("player-summary"),
    playerMethodology: document.getElementById("player-methodology"),
    wpaCards: document.getElementById("wpa-cards"),
    auctionTeamSelect: document.getElementById("auction-team-select"),
    rrBuysTable: document.getElementById("rr-buys-table"),
    mcTargetCards: document.getElementById("mc-target-cards"),
    eventRoleFilter: document.getElementById("event-role-filter"),
    eventTeamFilter: document.getElementById("event-team-filter"),
    eventsTable: document.getElementById("events-table"),
    spendBars: document.getElementById("spend-bars"),
    teamSelect: document.getElementById("team-select"),
    teamPowerBars: document.getElementById("team-power-bars"),
    teamSummary: document.getElementById("team-summary"),
    teamRoleNeeds: document.getElementById("team-role-needs"),
    retainedPlayerList: document.getElementById("retained-player-list"),
  };

  function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(value);
  }

  function formatDecimal(value, digits = 2) {
    return Number(value).toFixed(digits);
  }

  function setOptions(select, values, formatter) {
    select.innerHTML = "";
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = formatter ? formatter(value) : value;
      select.appendChild(option);
    });
  }

  function renderTable(table, columns, rows) {
    const head = columns
      .map((column) => `<th>${column.label}</th>`)
      .join("");
    const body = rows
      .map(
        (row) =>
          `<tr>${columns
            .map((column) => `<td>${column.render ? column.render(row[column.key], row) : row[column.key] ?? ""}</td>`)
            .join("")}</tr>`
      )
      .join("");
    table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
  }

  function renderBars(container, rows, valueKey, labelKey, options = {}) {
    const { compact = false, formatter = (value) => value, alt = false } = options;
    if (!rows.length) {
      container.innerHTML = `<p class="muted">No records available.</p>`;
      return;
    }
    const maxValue = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
    container.innerHTML = rows
      .map((row) => {
        const value = Number(row[valueKey] || 0);
        const width = (value / maxValue) * 100;
        return `
          <div class="bar-row ${compact ? "compact" : ""}">
            <div class="bar-label" title="${row[labelKey]}">${row[labelKey]}</div>
            <div class="bar-track"><div class="bar-fill ${alt ? "alt" : ""}" style="width:${width}%"></div></div>
            <div class="bar-value">${formatter(value, row)}</div>
          </div>
        `;
      })
      .join("");
  }

  function initHero() {
    els.heroTitle.textContent = data.story.hero_title;
    els.heroSubtitle.textContent = data.story.hero_subtitle;
    els.storyPanels.innerHTML = data.story.sections
      .map(
        (section) => `
          <div class="story-card">
            <h4>${section.title}</h4>
            <p>${section.text}</p>
          </div>
        `
      )
      .join("");
  }

  function initKpis() {
    const cards = [
      ["Matches", formatNumber(data.overview.matches)],
      ["Deliveries", formatNumber(data.overview.deliveries)],
      ["Batters", formatNumber(data.overview.batters)],
      ["Bowlers", formatNumber(data.overview.bowlers)],
      ["Teams Simulated", formatNumber(data.overview.teams_simulated)],
      ["League Avg Spend", `${formatDecimal(data.overview.league_avg_spend)} Cr`],
      ["Highest Avg Spend Team", data.overview.league_top_budget_team],
      ["Max Top-Target Share", `${formatDecimal(data.overview.league_max_target_share * 100, 1)}%`],
    ];
    els.kpiGrid.innerHTML = cards
      .map(
        ([label, value]) => `
          <div class="kpi-card">
            <h4>${label}</h4>
            <strong>${value}</strong>
          </div>
        `
      )
      .join("");
  }

  function initPhaseStudio() {
    setOptions(els.phaseHorizon, ["all_time", "active"], (value) =>
      value === "all_time" ? "All-Time" : "Active"
    );
    setOptions(els.phaseDiscipline, ["batting", "bowling"], (value) =>
      value.charAt(0).toUpperCase() + value.slice(1)
    );
    setOptions(els.phasePhase, ["powerplay", "middle", "death"], (value) =>
      value.charAt(0).toUpperCase() + value.slice(1)
    );
    [els.phaseHorizon, els.phaseDiscipline, els.phasePhase].forEach((el) =>
      el.addEventListener("change", renderPhaseStudio)
    );
    els.phasePlayerSearch.addEventListener("change", renderPhaseStudio);
    els.phasePlayerCompare.addEventListener("change", renderPhaseStudio);
    renderPhaseStudio();
  }

  function renderPhaseStudio() {
    const key = `${els.phaseDiscipline.value}_${els.phasePhase.value}`;
    const baseRows = data.phase_rankings[els.phaseHorizon.value][key] || [];
    els.phasePlayerOptions.innerHTML = baseRows
      .map((row) => `<option value="${row.player}"></option>`)
      .join("");

    let rows = baseRows.slice();
    const searchValue = (els.phasePlayerSearch.value || "").trim().toLowerCase();
    const compareValue = (els.phasePlayerCompare.value || "").trim().toLowerCase();
    if (searchValue || compareValue) {
      rows.sort((a, b) => {
        const aPrimary = a.player.toLowerCase() === searchValue ? 2 : a.player.toLowerCase() === compareValue ? 1 : 0;
        const bPrimary = b.player.toLowerCase() === searchValue ? 2 : b.player.toLowerCase() === compareValue ? 1 : 0;
        if (bPrimary !== aPrimary) return bPrimary - aPrimary;
        return a.rank - b.rank;
      });
    }

    const comparedRows = rows.filter((row) => {
      const name = row.player.toLowerCase();
      return name === searchValue || name === compareValue;
    });
    els.phaseMatchup.innerHTML = comparedRows
      .slice(0, 2)
      .map(
        (row) => `
          <div class="compare-card">
            <h5>${row.player}</h5>
            <div class="summary-line"><span>Impact</span><strong>${formatNumber(Math.round(row.impact_score))}</strong></div>
            <div class="summary-line"><span>Rank</span><strong>${row.rank}</strong></div>
            <div class="summary-line"><span>Balls</span><strong>${row.balls}</strong></div>
            <div class="summary-line"><span>${els.phaseDiscipline.value === "batting" ? "SR Bayes" : "Econ Bayes"}</span><strong>${formatDecimal(els.phaseDiscipline.value === "batting" ? row.sr_bayes : row.econ_bayes)}</strong></div>
          </div>
        `
      )
      .join("");

    renderBars(els.phaseBars, rows.slice(0, 10), "impact_score", "player", {
      formatter: (value) => formatNumber(Math.round(value)),
    });

    const columns =
      els.phaseDiscipline.value === "batting"
        ? [
            { key: "rank", label: "Rank" },
            { key: "player", label: "Player" },
            { key: "runs", label: "Runs" },
            { key: "balls", label: "Balls" },
            { key: "strike_rate", label: "SR", render: (value) => formatDecimal(value) },
            { key: "sr_bayes", label: "SR Bayes", render: (value) => formatDecimal(value) },
            { key: "impact_score", label: "Impact", render: (value) => formatNumber(Math.round(value)) },
          ]
        : [
            { key: "rank", label: "Rank" },
            { key: "player", label: "Player" },
            { key: "wickets", label: "Wkts" },
            { key: "runs", label: "Runs" },
            { key: "balls", label: "Balls" },
            { key: "economy", label: "Econ", render: (value) => formatDecimal(value) },
            { key: "econ_bayes", label: "Econ Bayes", render: (value) => formatDecimal(value) },
            { key: "impact_score", label: "Impact", render: (value) => formatNumber(Math.round(value)) },
          ];
    renderTable(els.phaseTable, columns, rows);
  }

  function radarPoint(cx, cy, radius, angle, value) {
    const scaled = (radius * value) / 100;
    return {
      x: cx + scaled * Math.cos(angle),
      y: cy + scaled * Math.sin(angle),
    };
  }

  function drawRadar(profile, compareProfile = null) {
    const svg = els.playerRadar;
    const width = 420;
    const height = 360;
    const cx = 200;
    const cy = 170;
    const radius = 118;
    const axes = profile.radar || [];
    const angleStep = (Math.PI * 2) / axes.length;

    const gridPolygons = [25, 50, 75, 100]
      .map((level) => {
        const points = axes
          .map((_, index) => {
            const angle = -Math.PI / 2 + index * angleStep;
            const point = radarPoint(cx, cy, radius, angle, level);
            return `${point.x},${point.y}`;
          })
          .join(" ");
        return `<polygon class="radar-grid-line" points="${points}"></polygon>`;
      })
      .join("");

    const axisLines = axes
      .map((axis, index) => {
        const angle = -Math.PI / 2 + index * angleStep;
        const outer = radarPoint(cx, cy, radius, angle, 100);
        const label = radarPoint(cx, cy, radius + 28, angle, 100);
        return `
          <line class="radar-axis-line" x1="${cx}" y1="${cy}" x2="${outer.x}" y2="${outer.y}"></line>
          <text class="radar-axis-label" x="${label.x}" y="${label.y}">${axis.axis}</text>
        `;
      })
      .join("");

    const playerPolygon = axes
      .map((axis, index) => {
        const angle = -Math.PI / 2 + index * angleStep;
        const point = radarPoint(cx, cy, radius, angle, axis.value);
        return `${point.x},${point.y}`;
      })
      .join(" ");

    const dots = axes
      .map((axis, index) => {
        const angle = -Math.PI / 2 + index * angleStep;
        const point = radarPoint(cx, cy, radius, angle, axis.value);
        return `<circle class="radar-dot" cx="${point.x}" cy="${point.y}" r="4"></circle>`;
      })
      .join("");

    let comparePolygon = "";
    let compareDots = "";
    if (compareProfile) {
      comparePolygon = compareProfile.radar
        .map((axis, index) => {
          const angle = -Math.PI / 2 + index * angleStep;
          const point = radarPoint(cx, cy, radius, angle, axis.value);
          return `${point.x},${point.y}`;
        })
        .join(" ");
      compareDots = compareProfile.radar
        .map((axis, index) => {
          const angle = -Math.PI / 2 + index * angleStep;
          const point = radarPoint(cx, cy, radius, angle, axis.value);
          return `<circle class="radar-dot compare" cx="${point.x}" cy="${point.y}" r="4"></circle>`;
        })
        .join("");
    }

    svg.innerHTML = `
      <rect width="${width}" height="${height}" fill="transparent"></rect>
      ${gridPolygons}
      ${axisLines}
      <polygon class="radar-shape" points="${playerPolygon}"></polygon>
      ${compareProfile ? `<polygon class="radar-shape compare" points="${comparePolygon}"></polygon>` : ""}
      ${dots}
      ${compareDots}
    `;
  }

  function currentPlayerProfiles() {
    return els.playerType.value === "batter" ? data.players.batter_profiles : data.players.bowler_profiles;
  }

  function refreshPlayerOptions() {
    const options = els.playerType.value === "batter" ? data.players.batter_options : data.players.bowler_options;
    els.playerOptions.innerHTML = options.map((player) => `<option value="${player}"></option>`).join("");
    if (!options.includes(els.playerSearch.value)) {
      els.playerSearch.value = options[0] || "";
    }
    if (els.playerCompareSearch.value && !options.includes(els.playerCompareSearch.value)) {
      els.playerCompareSearch.value = "";
    }
  }

  function initPlayerLab() {
    setOptions(els.playerType, ["batter", "bowler"], (value) =>
      value.charAt(0).toUpperCase() + value.slice(1)
    );

    els.playerType.addEventListener("change", () => {
      refreshPlayerOptions();
      renderPlayerLab();
    });
    els.playerSearch.addEventListener("change", renderPlayerLab);
    els.playerCompareSearch.addEventListener("change", renderPlayerLab);

    refreshPlayerOptions();
    renderPlayerLab();
    renderMethodology();
  }

  function renderPlayerLab() {
    const profiles = currentPlayerProfiles();
    const profile = profiles[els.playerSearch.value] || profiles[Object.keys(profiles)[0]];
    const compareProfile =
      els.playerCompareSearch.value && profiles[els.playerCompareSearch.value] && els.playerCompareSearch.value !== profile.player
        ? profiles[els.playerCompareSearch.value]
        : null;
    if (!profile) {
      return;
    }

    els.playerSearch.value = profile.player;
    drawRadar(profile, compareProfile);

    const cards = [profile, compareProfile].filter(Boolean).map((selectedProfile) => {
      const summaryRows = Object.entries(selectedProfile.summary).map(([key, value]) => {
        const label = key.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
        const formatted = typeof value === "number" ? formatDecimal(value) : value;
        return [label, formatted];
      });
      const phaseRows = Object.entries(selectedProfile.phase_details).map(([phase, detail]) => {
        const score = detail.impact_score ? formatNumber(Math.round(detail.impact_score)) : "0";
        return [`${phase[0].toUpperCase()}${phase.slice(1)} Impact`, score];
      });
      return `
        <div class="compare-card">
          <h5>${selectedProfile.player}</h5>
          ${[...summaryRows, ...phaseRows]
            .map(
              ([label, value]) => `
                <div class="summary-line">
                  <span>${label}</span>
                  <strong>${value}</strong>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    });
    els.playerSummary.innerHTML = cards.join("");

    const winsAdded = profile.summary.wins_added;
    els.wpaCards.innerHTML = `
      <div class="metric-card">
        <h5>${profile.player}</h5>
        <strong>${formatDecimal(winsAdded)}</strong>
        <p>Wins-added proxy from the current notebook logic, using ball-level run value aggregated to the player and scaled by 15 runs ≈ 1 win.</p>
      </div>
      <div class="metric-card">
        <h5>Run Value</h5>
        <strong>${formatDecimal(profile.summary.run_value)}</strong>
        <p>This is the player's aggregate run-value contribution in the current implementation, before converting to wins.</p>
      </div>
    `;
  }

  function renderMethodology() {
    els.playerMethodology.innerHTML = Object.values(data.players.methodology)
      .map(
        (item) => `
          <div class="method-card">
            <h5>${item.title}</h5>
            <p>${item.text}</p>
          </div>
        `
      )
      .join("");
  }

  function initAuctionLab() {
    const teamCodes = Object.keys(data.auction.teams);
    setOptions(els.auctionTeamSelect, teamCodes, (code) => code);
    els.auctionTeamSelect.addEventListener("change", renderAuctionTeam);

    [els.eventRoleFilter, els.eventTeamFilter].forEach((el) => el.addEventListener("change", renderEventsTable));
    renderAuctionTeam();
  }

  function currentAuctionTeamData() {
    return data.auction.teams[els.auctionTeamSelect.value] || data.auction.teams[Object.keys(data.auction.teams)[0]];
  }

  function renderAuctionTeam() {
    const teamData = currentAuctionTeamData();
    renderTable(
      els.rrBuysTable,
      [
        { key: "set_no", label: "Set" },
        { key: "player_name", label: "Player" },
        { key: "role_bucket", label: "Role", render: (value) => value.replaceAll("_", " ") },
        { key: "final_price", label: "Price (Cr)", render: (value) => formatDecimal(value) },
        { key: "runner_up", label: "Runner-Up" },
      ],
      teamData.single_run_buys
    );

    els.mcTargetCards.innerHTML = teamData.top_targets
      .map(
        (row) => `
          <div class="metric-card">
            <h5>${row.player_name}</h5>
            <strong>${formatDecimal(row.share_of_runs * 100, 1)}%</strong>
            <p>Bought in ${row.times_bought} of 500 randomized runs at an average winning price of Rs. ${formatDecimal(
              row.avg_price_when_bought
            )} Cr.</p>
          </div>
        `
      )
      .join("");

    const leagueEvents = data.auction.league_events || [];
    const roles = ["All", ...new Set(leagueEvents.map((row) => row.role_bucket))];
    const teams = ["All", ...new Set(leagueEvents.map((row) => row.winner).filter(Boolean))];
    setOptions(els.eventRoleFilter, roles);
    setOptions(els.eventTeamFilter, teams);
    els.eventTeamFilter.value = els.auctionTeamSelect.value;
    renderEventsTable();

    const spendRows = teamData.mc_spend_summary
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 20)
      .map((row) => ({ label: `Run ${row.run_id}`, total_spend: row.total_spend }));
    renderBars(els.spendBars, spendRows, "total_spend", "label", {
      compact: true,
      alt: true,
      formatter: (value) => `${formatDecimal(value)} Cr`,
    });
  }

  function renderEventsTable() {
    let rows = (data.auction.league_events || []).slice();
    if (els.eventRoleFilter.value !== "All") {
      rows = rows.filter((row) => row.role_bucket === els.eventRoleFilter.value);
    }
    if (els.eventTeamFilter.value !== "All") {
      rows = rows.filter((row) => row.winner === els.eventTeamFilter.value);
    }
    renderTable(
      els.eventsTable,
      [
        { key: "set_no", label: "Set" },
        { key: "player_name", label: "Player" },
        { key: "role_bucket", label: "Role", render: (value) => value.replaceAll("_", " ") },
        { key: "winner", label: "Winner" },
        { key: "runner_up", label: "Runner-Up" },
        { key: "final_price", label: "Final Price", render: (value) => (value ? `${formatDecimal(value)} Cr` : "--") },
        { key: "quality_score", label: "Quality", render: (value) => formatDecimal(value, 2) },
      ],
      rows
    );
  }

  function initTeamMap() {
    const teams = data.teams.teams_2026;
    setOptions(els.teamSelect, teams.map((team) => team.code), (code) => {
      const team = teams.find((entry) => entry.code === code);
      return `${code} · ${team.name}`;
    });
    els.teamSelect.addEventListener("change", renderTeamView);

    renderBars(els.teamPowerBars, teams, "auction_power", "code", {
      formatter: (value, row) => `${formatDecimal(value)} · ${formatDecimal(row.purse)} Cr`,
    });
    renderTeamView();
  }

  function renderTeamView() {
    const team = data.teams.teams_2026.find((entry) => entry.code === els.teamSelect.value) || data.teams.teams_2026[0];
    els.teamSummary.innerHTML = [
      ["Franchise", team.name],
      ["Purse left", `Rs. ${formatDecimal(team.purse)} Cr`],
      ["Total spent", `Rs. ${formatDecimal(team.spent)} Cr`],
      ["Retained players", team.retained],
      ["Overseas retained", team.overseas_retained],
      ["Open slots", team.open_slots],
      ["Auction power", formatDecimal(team.auction_power)],
      ["Aggression", formatDecimal(team.aggression)],
    ]
      .map(
        ([label, value]) => `
          <div class="summary-line">
            <span>${label}</span>
            <strong>${value}</strong>
          </div>
        `
      )
      .join("");

    const needs = Object.entries(team.role_needs || {})
      .map(([role, value]) => ({ role: role.replaceAll("_", " "), weight: value }))
      .sort((a, b) => b.weight - a.weight);
    renderBars(els.teamRoleNeeds, needs, "weight", "role", {
      compact: true,
      formatter: (value) => formatDecimal(value, 2),
      alt: true,
    });

    els.retainedPlayerList.innerHTML = team.retained_players
      .map((player) => `<span class="retained-chip">${player}</span>`)
      .join("");
  }

  initHero();
  initKpis();
  initPhaseStudio();
  initPlayerLab();
  initAuctionLab();
  initTeamMap();
})();
