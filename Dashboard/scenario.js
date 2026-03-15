(function () {
  const payload = window.DASHBOARD_DATA.scenario;
  const teams = payload.teams || {};
  const playerOptions = (payload.players || []).map((player) => player.player_name).sort();
  const roleUniverse = [
    "indian_spin",
    "overseas_pace",
    "domestic_pace",
    "middle_bat",
    "top_order_bat",
    "domestic_bat_depth",
    "wicketkeeper",
    "spin_bowler",
    "seam_all_rounder",
    "spin_all_rounder",
  ];
  const baselineTeams = JSON.parse(JSON.stringify(teams));
  const teamEdits = {};

  const els = {
    team: document.getElementById("scenario-team"),
    purse: document.getElementById("scenario-purse"),
    retained: document.getElementById("scenario-retained"),
    overseas: document.getElementById("scenario-overseas"),
    retainedList: document.getElementById("scenario-retained-list"),
    debugPlayer: document.getElementById("scenario-debug-player"),
    debugOptions: document.getElementById("scenario-debug-options"),
    roleSliders: document.getElementById("scenario-role-sliders"),
    results: document.getElementById("scenario-results"),
    summary: document.getElementById("scenario-summary"),
    explainability: document.getElementById("scenario-explainability"),
    methodPill: document.getElementById("scenario-method-pill"),
    summaryPill: document.getElementById("scenario-summary-pill"),
    teamPill: document.getElementById("scenario-team-pill"),
    runButton: document.getElementById("scenario-run-button"),
    status: document.getElementById("scenario-status"),
    debugPill: document.getElementById("scenario-debug-pill"),
    debug: document.getElementById("scenario-debug"),
    resetTeam: document.getElementById("scenario-reset-team"),
    resetAll: document.getElementById("scenario-reset-all"),
    editedTeams: document.getElementById("scenario-edited-teams"),
  };

  function setOptions(select, values, formatter) {
    select.innerHTML = "";
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = formatter ? formatter(value) : value;
      select.appendChild(option);
    });
  }

  function formatDecimal(value, digits = 2) {
    return Number(value || 0).toFixed(digits);
  }

  function roleLabel(role) {
    return String(role || "").replaceAll("_", " ");
  }

  function teamSnapshot(code) {
    return teamEdits[code] || baselineTeams[code];
  }

  function currentTeam() {
    const code = els.team.value || Object.keys(teams)[0];
    return { code, ...teamSnapshot(code) };
  }

  function init() {
    setOptions(els.team, Object.keys(teams), (code) => `${code} · ${teams[code].name}`);
    els.debugOptions.innerHTML = playerOptions.map((name) => `<option value="${name}"></option>`).join("");
    els.methodPill.textContent = "Backend GE Auction";
    els.team.addEventListener("change", handleTeamChange);
    els.runButton.addEventListener("click", runScenario);
    els.resetTeam.addEventListener("click", resetCurrentTeam);
    els.resetAll.addEventListener("click", resetAllTeams);
    [els.purse, els.retained, els.overseas, els.retainedList].forEach((el) => el.addEventListener("input", persistCurrentTeamEdit));
    handleTeamChange();
  }

  function handleTeamChange() {
    const team = currentTeam();
    els.purse.value = team.purse;
    els.retained.value = team.retained;
    els.overseas.value = team.overseas_retained;
    els.retainedList.value = (team.retained_players || []).join(", ");
    renderRoleSliders(team.role_needs || {});
    updateEditedTeamsPills();
    resetScenarioView(team);
  }

  function renderRoleSliders(roleNeeds) {
    const weights = { ...roleNeeds };
    roleUniverse.forEach((role) => {
      if (weights[role] == null) weights[role] = 0.0;
    });
    els.roleSliders.innerHTML = roleUniverse
      .map(
        (role) => `
          <label class="weight-row">
            <span>${roleLabel(role)}</span>
            <input type="range" min="0" max="2" step="0.05" value="${weights[role]}" data-role="${role}" />
            <strong>${formatDecimal(weights[role])}</strong>
          </label>
        `
      )
      .join("");
    els.roleSliders.querySelectorAll("input[type='range']").forEach((slider) => {
      slider.addEventListener("input", () => {
        slider.parentElement.querySelector("strong").textContent = formatDecimal(slider.value);
        persistCurrentTeamEdit();
      });
    });
  }

  function collectRoleWeights() {
    const weights = {};
    els.roleSliders.querySelectorAll("input[type='range']").forEach((slider) => {
      weights[slider.dataset.role] = Number(slider.value);
    });
    return weights;
  }

  function persistCurrentTeamEdit() {
    const code = els.team.value;
    const base = baselineTeams[code];
    teamEdits[code] = {
      ...teamSnapshot(code),
      purse: Number(els.purse.value || 0),
      retained: Number(els.retained.value || 0),
      overseas_retained: Number(els.overseas.value || 0),
      retained_players: els.retainedList.value.split(",").map((part) => part.trim()).filter(Boolean),
      role_needs: collectRoleWeights(),
    };
    if (JSON.stringify(teamEdits[code]) === JSON.stringify(base)) {
      delete teamEdits[code];
    }
    updateEditedTeamsPills();
  }

  function updateEditedTeamsPills() {
    const codes = Object.keys(teamEdits).sort();
    if (!codes.length) {
      els.editedTeams.innerHTML = `<span class="pill">No team edits saved yet</span>`;
      return;
    }
    els.editedTeams.innerHTML = codes
      .map((code) => `<span class="pill accent">${code} edited</span>`)
      .join("");
  }

  function resetCurrentTeam() {
    const code = els.team.value;
    delete teamEdits[code];
    handleTeamChange();
  }

  function resetAllTeams() {
    Object.keys(teamEdits).forEach((code) => delete teamEdits[code]);
    handleTeamChange();
  }

  function scenarioPayload() {
    const focusCode = els.team.value;
    persistCurrentTeamEdit();
    const teamOverrides = {};
    Object.entries(teamEdits).forEach(([code, team]) => {
      teamOverrides[code] = {
        purse: team.purse,
        retained: team.retained,
        overseas_retained: team.overseas_retained,
        retained_players: team.retained_players,
        role_needs: team.role_needs,
      };
    });
    return {
      team: focusCode,
      season: "2026",
      team_overrides: teamOverrides,
      debug_player: (els.debugPlayer.value || "").trim(),
      seed: 0,
    };
  }

  async function runScenario() {
    const team = currentTeam();
    els.status.textContent = `Running shared-auction counterfactual in Python with ${Object.keys(teamEdits).length || 1} edited team context(s)...`;
    els.runButton.disabled = true;
    try {
      const response = await fetch("/api/run-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenarioPayload()),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Scenario API request failed");
      renderScenarioResult(result, team);
      els.status.textContent = `Shared-auction scenario completed for ${result.team} with ${Object.keys(teamEdits).length || 1} edited team context(s).`;
    } catch (error) {
      els.status.textContent = "Backend scenario run failed. Start the dashboard with `python Dashboard/server.py` and retry.";
      els.summary.innerHTML = `
        <div class="insight-card">
          <h5>Scenario API Unavailable</h5>
          <p>${error.message}</p>
          <p>This page expects the real Python-backed equilibrium runner and can now send edits for multiple teams at once.</p>
        </div>
      `;
      els.results.innerHTML = "";
      els.explainability.innerHTML = "";
    } finally {
      els.runButton.disabled = false;
    }
  }

  function renderScenarioResult(result, baseTeam) {
    els.summaryPill.textContent = `Shared-auction purse left: Rs. ${formatDecimal(result.summary.purse_left)} Cr`;
    els.teamPill.textContent = `${result.team} · Python GE`;
    renderTable(
      els.results,
      [
        { key: "set_no", label: "Set" },
        { key: "player_name", label: "Player" },
        { key: "role_bucket", label: "Role", render: (value) => roleLabel(value) },
        { key: "final_price", label: "Clearing Price", render: (value) => `Rs. ${formatDecimal(value)} Cr` },
        { key: "runner_up", label: "Runner-Up" },
        { key: "quality_score", label: "Quality", render: (value) => formatDecimal(value, 2) },
      ],
      result.focus_buys
    );

    const editedCodes = Object.keys(teamEdits).sort();
    els.summary.innerHTML = `
      <div class="insight-card">
        <h5>General-Equilibrium Snapshot</h5>
        <p>${payload.methodology.text}</p>
      </div>
      <div class="insight-card">
        <h5>Focus Team Outcome</h5>
        <ul>
          <li>Players won in the shared auction: ${result.summary.players_won}</li>
          <li>Purse left after the shared run: Rs. ${formatDecimal(result.summary.purse_left)} Cr</li>
          <li>Overseas slots left: ${result.summary.overseas_slots_left}</li>
          <li>High-need roles under edits: ${result.summary.high_need_roles.map(roleLabel).join(", ") || "None"}</li>
        </ul>
      </div>
      <div class="insight-card">
        <h5>Edited League Context</h5>
        <ul>
          <li>Focus franchise: ${baseTeam.name}</li>
          <li>Teams edited before run: ${editedCodes.length ? editedCodes.join(", ") : "None"}</li>
          <li>Current team retained notes entered: ${els.retainedList.value.split(",").filter(Boolean).length}</li>
          <li>Multi-team edits are all fed into the same shared auction run</li>
        </ul>
      </div>
      <div class="insight-card">
        <h5>Rival Pressure</h5>
        <ul>
          ${result.rival_pressure.map((row) => `<li>${row.team_code} · Rs. ${formatDecimal(row.purse_left)} Cr left · ${row.purchases} wins</li>`).join("")}
        </ul>
      </div>
    `;

    els.explainability.innerHTML = buildExplainability(result);
    renderDebug(result.debug);
  }

  function buildExplainability(result) {
    const wonCards = result.focus_buys.slice(0, 3).map((pick) => {
      const risks = [];
      const currentPurse = Number(els.purse.value || 0) || 1;
      if (pick.final_price >= 0.28 * currentPurse) risks.push("Large share of edited purse");
      if (pick.runner_up) risks.push(`Price pressure came from ${pick.runner_up}`);
      if (!risks.length) risks.push("Main residual risk is later-set opportunity cost");
      return `
        <div class="insight-card">
          <h5>${pick.player_name}</h5>
          <p><strong>Why the model wins him in GE:</strong> ${roleLabel(pick.role_bucket)} still clears for the focus team after all edited rival team contexts are simulated in the same auction path.</p>
          <ul>
            <li>Clearing price: Rs. ${formatDecimal(pick.final_price)} Cr</li>
            <li>Runner-up team: ${pick.runner_up || "None"}</li>
            <li>Public quality score: ${formatDecimal(pick.quality_score, 2)}</li>
          </ul>
          <p><strong>Key risks:</strong> ${risks.join("; ")}.</p>
        </div>
      `;
    });

    const missCards = result.missed_targets.slice(0, 3).map((miss) => `
      <div class="insight-card">
        <h5>Missed: ${miss.player_name}</h5>
        <p><strong>Why the model lets him go:</strong> ${miss.winner} clears the shared market at Rs. ${formatDecimal(
          miss.final_price
        )} Cr, above what the edited team can rationally sustain once all edited league constraints are respected.</p>
        <ul>
          <li>Role bucket: ${roleLabel(miss.role_bucket)}</li>
          <li>Winning team: ${miss.winner}</li>
          <li>Runner-up: ${miss.runner_up || "None"}</li>
        </ul>
      </div>
    `);

    return wonCards.concat(missCards).join("");
  }

  function resetScenarioView(team) {
    els.summaryPill.textContent = "Awaiting backend run";
    els.teamPill.textContent = team ? team.name : "";
    els.status.textContent = "Edit one or more teams, then click Run Shared Scenario.";
    els.results.innerHTML = "";
    els.summary.innerHTML = `
      <div class="insight-card">
        <h5>Backend Runner Ready</h5>
        <p>This page now supports multi-team edits. Change RR, switch to CSK, change them too, then click <strong>Run Shared Scenario</strong> to simulate a true shared auction with all edited teams in the same market.</p>
      </div>
    `;
    els.explainability.innerHTML = "";
    els.debugPill.textContent = "Optional audit trace";
    els.debug.innerHTML = `
      <div class="insight-card">
        <h5>Bid Ladder Debug Ready</h5>
        <p>Select an optional player in the input panel, then run the shared scenario to inspect team valuations, active bidders, clearing price, and why the focus team wins or loses that nomination.</p>
      </div>
    `;
  }

  function renderDebug(debug) {
    if (!debug) {
      els.debugPill.textContent = "Optional audit trace";
      return;
    }
    if (debug.not_found) {
      els.debugPill.textContent = "Debug player not found";
      els.debug.innerHTML = `
        <div class="insight-card">
          <h5>No Matching Nomination</h5>
          <p>The selected debug player did not appear in the current shared auction run.</p>
        </div>
      `;
      return;
    }
    els.debugPill.textContent = `${debug.player_name} · Set ${debug.set_no}`;
    const activeRows = (debug.active_bidders || [])
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${row.team_code}</td>
            <td>Rs. ${formatDecimal(row.valuation)} Cr</td>
            <td>Rs. ${formatDecimal(row.purse_before)} Cr</td>
          </tr>
        `
      )
      .join("");
    els.debug.innerHTML = `
      <div class="insight-card">
        <h5>Nomination Snapshot</h5>
        <p>${debug.player_name} enters in set ${debug.set_no} as a ${roleLabel(debug.role_bucket)} with reserve Rs. ${formatDecimal(
          debug.reserve_price
        )} Cr and quality ${formatDecimal(debug.quality_score, 2)}.</p>
      </div>
      <div class="compare-grid">
        <div class="compare-card">
          <h5>Market Outcome</h5>
          <div class="summary-line"><span>Winner</span><strong>${debug.winner || "Unsold"}</strong></div>
          <div class="summary-line"><span>Runner-up</span><strong>${debug.runner_up || "None"}</strong></div>
          <div class="summary-line"><span>Clearing price</span><strong>${debug.clearing_price ? `Rs. ${formatDecimal(debug.clearing_price)} Cr` : "Unsold"}</strong></div>
          <div class="summary-line"><span>Focus team value</span><strong>${debug.focus_team_value ? `Rs. ${formatDecimal(debug.focus_team_value)} Cr` : "Out"}</strong></div>
        </div>
        <div class="compare-card">
          <h5>Interpretation</h5>
          <p>${buildDebugNarrative(debug)}</p>
        </div>
      </div>
      <div class="table-wrap compact">
        <table>
          <thead>
            <tr><th>Rank</th><th>Team</th><th>Valuation</th><th>Purse Before</th></tr>
          </thead>
          <tbody>${activeRows || '<tr><td colspan="4">No active bidders</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  function buildDebugNarrative(debug) {
    if (!debug.active_bidders || !debug.active_bidders.length) {
      return "No team cleared the reserve price, so the player went unsold in the shared scenario.";
    }
    if (debug.winner === debug.focus_team) {
      return `${debug.focus_team} wins because its valuation stays above the market-clearing price. The gap between the top two active bidders determines the implied hammer price.`;
    }
    return `${debug.focus_team} loses because its valuation falls below the clearing price set by ${debug.winner}${debug.runner_up ? ` and ${debug.runner_up}` : ""}. This is the cleanest way to audit whether the result is driven by rival demand, budget pressure, or a weak focus-team value.`;
  }

  function renderTable(table, columns, rows) {
    const head = columns.map((column) => `<th>${column.label}</th>`).join("");
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

  init();
})();
