(function () {
  const data = window.DASHBOARD_DATA;
  const auction = data.auction || {};
  const replayEvents = (auction.replay_events || []).map((event) => ({
    ...event,
    final_price: event.final_price == null ? null : Number(event.final_price),
    reserve_price: Number(event.reserve_price || 0),
    set_no: Number(event.set_no || 0),
    sequence_no: Number(event.sequence_no || 0),
  }));
  const teamContext = (data.teams && data.teams.teams_2026) || [];
  const teamMap = Object.fromEntries(teamContext.map((team) => [team.code, team]));

  const els = {
    teamFilter: document.getElementById("replay-team-filter"),
    setFilter: document.getElementById("replay-set-filter"),
    stepSlider: document.getElementById("replay-step-slider"),
    stepLabel: document.getElementById("replay-step-label"),
    setLabel: document.getElementById("replay-set-label"),
    player: document.getElementById("replay-player"),
    role: document.getElementById("replay-role"),
    winner: document.getElementById("replay-winner"),
    runnerUp: document.getElementById("replay-runner-up"),
    price: document.getElementById("replay-price"),
    reserve: document.getElementById("replay-reserve"),
    focusStatus: document.getElementById("replay-focus-status"),
    focusSummary: document.getElementById("replay-focus-summary"),
    highlightTitle: document.getElementById("replay-highlight-title"),
    highlightCopy: document.getElementById("replay-highlight-copy"),
    metaGrid: document.getElementById("replay-meta-grid"),
    timeline: document.getElementById("replay-timeline"),
    purseGrid: document.getElementById("replay-purse-grid"),
    focusTable: document.getElementById("replay-focus-table"),
    focusTeamPill: document.getElementById("replay-focus-team-pill"),
  };

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

  function roleLabel(role) {
    return String(role || "").replaceAll("_", " ");
  }

  function currentFocusTeam() {
    return els.teamFilter.value || "RR";
  }

  function filteredEvents() {
    const setValue = els.setFilter.value;
    if (setValue === "All") {
      return replayEvents;
    }
    return replayEvents.filter((event) => String(event.set_no) === setValue);
  }

  function currentEventIndex(events) {
    const maxIndex = Math.max(0, events.length - 1);
    const chosen = Number(els.stepSlider.value || 1) - 1;
    return Math.min(maxIndex, Math.max(0, chosen));
  }

  function init() {
    setOptions(
      els.teamFilter,
      teamContext.map((team) => team.code),
      (code) => `${code} · ${teamMap[code].name}`
    );
    setOptions(els.setFilter, ["All", ...new Set(replayEvents.map((event) => String(event.set_no)))]);

    els.teamFilter.value = "RR";
    els.setFilter.addEventListener("change", handleFilterChange);
    els.teamFilter.addEventListener("change", renderReplay);
    els.stepSlider.addEventListener("input", renderReplay);

    handleFilterChange();
  }

  function handleFilterChange() {
    const events = filteredEvents();
    els.stepSlider.min = 1;
    els.stepSlider.max = Math.max(1, events.length);
    els.stepSlider.value = 1;
    renderReplay();
  }

  function renderReplay() {
    const teamCode = currentFocusTeam();
    const team = teamMap[teamCode];
    const events = filteredEvents();
    if (!events.length) {
      renderEmpty(teamCode);
      return;
    }

    const eventIndex = currentEventIndex(events);
    const current = events[eventIndex];
    const seenEvents = events.slice(0, eventIndex + 1);
    const seenLeagueEvents = replayEvents.filter((event) => event.sequence_no <= current.sequence_no);
    const purseState = computePurseState(seenLeagueEvents);
    const teamBuys = seenLeagueEvents.filter((event) => event.winner === teamCode);
    const focusSpend = teamBuys.reduce((sum, event) => sum + (event.final_price || 0), 0);

    els.stepLabel.textContent = `Nomination ${eventIndex + 1} of ${events.length}`;
    els.setLabel.textContent = els.setFilter.value === "All" ? `Set ${current.set_no}` : `Filtered to Set ${els.setFilter.value}`;
    els.player.textContent = current.player_name;
    els.role.textContent = `${roleLabel(current.role_bucket)} · quality ${formatDecimal(current.quality_score || 0, 2)}`;
    els.winner.textContent = current.winner || "Unsold";
    els.runnerUp.textContent = current.runner_up ? `Runner-up: ${current.runner_up}` : "No active runner-up";
    els.price.textContent = current.final_price == null ? "Unsold" : `Rs. ${formatDecimal(current.final_price)} Cr`;
    els.reserve.textContent = `Reserve: Rs. ${formatDecimal(current.reserve_price)} Cr`;

    const focusWon = current.winner === teamCode;
    els.focusStatus.textContent = focusWon ? "Won This Bid" : current.winner ? "Stayed Out / Lost" : "Unsold Market";
    els.focusSummary.textContent = `Purse left after this step: Rs. ${formatDecimal(purseState[teamCode] ?? team.purse)} Cr`;

    els.highlightTitle.textContent = `${current.player_name} in Set ${current.set_no}`;
    els.highlightCopy.textContent = buildHighlightCopy(current, teamCode, purseState[teamCode] ?? team.purse, focusSpend);
    els.metaGrid.innerHTML = [
      ["Set", current.set_no],
      ["Sequence", current.sequence_no],
      ["Winner", current.winner || "Unsold"],
      ["Runner-up", current.runner_up || "None"],
      ["Role Bucket", roleLabel(current.role_bucket)],
      ["Final Price", current.final_price == null ? "Unsold" : `Rs. ${formatDecimal(current.final_price)} Cr`],
      ["Reserve Price", `Rs. ${formatDecimal(current.reserve_price)} Cr`],
      ["Focus Team", team.name],
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

    renderTimeline(seenEvents, current.sequence_no);
    renderPurseGrid(purseState, teamCode);
    renderFocusTable(teamBuys, teamCode);
  }

  function buildHighlightCopy(current, teamCode, purseLeft, focusSpend) {
    if (!current.winner) {
      return `No team crossed the reserve for ${current.player_name}. ${teamCode} has spent Rs. ${formatDecimal(
        focusSpend
      )} Cr so far and still holds Rs. ${formatDecimal(purseLeft)} Cr for later sets.`;
    }
    if (current.winner === teamCode) {
      return `${teamCode} lands ${current.player_name} at Rs. ${formatDecimal(
        current.final_price
      )} Cr. The bid clears above reserve and leaves the focus team with Rs. ${formatDecimal(
        purseLeft
      )} Cr for the remaining board.`;
    }
    return `${current.winner} wins ${current.player_name} at Rs. ${formatDecimal(
      current.final_price
    )} Cr, with ${current.runner_up || "no second bidder"} providing the final pressure point. ${teamCode} now has Rs. ${formatDecimal(
      purseLeft
    )} Cr left for its own targets.`;
  }

  function renderTimeline(seenEvents, currentSequenceNo) {
    const rows = seenEvents.slice(Math.max(0, seenEvents.length - 12)).reverse();
    els.timeline.innerHTML = rows
      .map((event) => {
        const activeClass = event.sequence_no === currentSequenceNo ? "active" : "";
        const result = event.winner
          ? `${event.winner} won at Rs. ${formatDecimal(event.final_price)} Cr`
          : "Unsold";
        return `
          <div class="timeline-row ${activeClass}">
            <strong>#${event.sequence_no} · ${event.player_name}</strong>
            <span>Set ${event.set_no} · ${roleLabel(event.role_bucket)} · ${result}</span>
          </div>
        `;
      })
      .join("");
  }

  function computePurseState(events) {
    const purseState = Object.fromEntries(teamContext.map((team) => [team.code, Number(team.purse)]));
    events.forEach((event) => {
      if (event.winner && event.final_price != null && purseState[event.winner] != null) {
        purseState[event.winner] = Number((purseState[event.winner] - Number(event.final_price)).toFixed(2));
      }
    });
    return purseState;
  }

  function renderPurseGrid(purseState, focusTeam) {
    const maxPurse = Math.max(...teamContext.map((team) => Number(team.purse)), 1);
    const rows = teamContext
      .map((team) => ({
        code: team.code,
        purse: purseState[team.code] ?? Number(team.purse),
      }))
      .sort((a, b) => b.purse - a.purse);

    els.purseGrid.innerHTML = rows
      .map((row) => {
        const width = (row.purse / maxPurse) * 100;
        return `
          <div class="purse-row">
            <div class="purse-code">${row.code === focusTeam ? `${row.code}*` : row.code}</div>
            <div class="purse-track"><div class="purse-fill" style="width:${width}%"></div></div>
            <div class="bar-value">Rs. ${formatDecimal(row.purse)} Cr</div>
          </div>
        `;
      })
      .join("");
  }

  function renderFocusTable(teamBuys, teamCode) {
    els.focusTeamPill.textContent = teamCode;
    if (!teamBuys.length) {
      els.focusTable.innerHTML = `<tbody><tr><td class="replay-empty">No purchases yet for ${teamCode} in this replay window.</td></tr></tbody>`;
      return;
    }
    renderTable(
      els.focusTable,
      [
        { key: "sequence_no", label: "Seq" },
        { key: "set_no", label: "Set" },
        { key: "player_name", label: "Player" },
        { key: "role_bucket", label: "Role", render: (value) => roleLabel(value) },
        { key: "final_price", label: "Price", render: (value) => `Rs. ${formatDecimal(value)} Cr` },
      ],
      teamBuys
    );
  }

  function renderEmpty(teamCode) {
    els.stepLabel.textContent = "No events";
    els.setLabel.textContent = "No set filter match";
    els.player.textContent = "--";
    els.role.textContent = "--";
    els.winner.textContent = "--";
    els.runnerUp.textContent = "--";
    els.price.textContent = "--";
    els.reserve.textContent = "--";
    els.focusStatus.textContent = "--";
    els.focusSummary.textContent = `No representative events available for ${teamCode}.`;
    els.highlightTitle.textContent = "No replay data";
    els.highlightCopy.textContent = "Adjust the set filter to load a representative auction path.";
    els.metaGrid.innerHTML = "";
    els.timeline.innerHTML = `<p class="replay-empty">No events available for the selected filter.</p>`;
    els.purseGrid.innerHTML = "";
    els.focusTable.innerHTML = "";
  }

  init();
})();
