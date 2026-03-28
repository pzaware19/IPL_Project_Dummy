(function () {
  const data = window.DASHBOARD_DATA.match_planning;
  const els = {
    match: document.getElementById("match-select"),
    lens: document.getElementById("match-team-lens"),
    headline: document.getElementById("match-headline-cards"),
    venueSummary: document.getElementById("venue-summary"),
    venueTopBatters: document.getElementById("venue-top-batters"),
    venueTopBowlers: document.getElementById("venue-top-bowlers"),
    venuePressureBatters: document.getElementById("venue-pressure-batters"),
    venuePressureBowlers: document.getElementById("venue-pressure-bowlers"),
    homeTitle: document.getElementById("home-team-title"),
    awayTitle: document.getElementById("away-team-title"),
    homeAnalysis: document.getElementById("home-team-analysis"),
    awayAnalysis: document.getElementById("away-team-analysis"),
    swot: document.getElementById("match-swot"),
    tactics: document.getElementById("match-tactics"),
  };

  function formatDecimal(value, digits = 2) {
    return Number(value || 0).toFixed(digits);
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

  function renderList(container, rows, formatter) {
    container.innerHTML = rows.map(formatter).join("");
  }

  function swotCard(title, items) {
    return `
      <div class="insight-card">
        <h5>${title}</h5>
        <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
    `;
  }

  function playerCards(rows, kind) {
    return rows
      .map(
        (row) => `
          <div class="metric-card">
            <h5>${row.player}</h5>
            <strong>${formatDecimal(row.impact_score)}</strong>
            <p>${row.role} · wins added ${formatDecimal(row.wins_added)} · ${row.phase_identity || kind}</p>
          </div>
        `
      )
      .join("");
  }

  function currentMatch() {
    return data.matches.find((row) => String(row.match_id) === els.match.value) || data.matches[0];
  }

  function syncLensOptions(match, preserveSelection = true) {
    const previousLens = els.lens.value;
    setOptions(els.lens, [match.home, match.away], (value) => `${value} Lens`);
    if (preserveSelection && [match.home, match.away].includes(previousLens)) {
      els.lens.value = previousLens;
    } else {
      els.lens.value = match.home;
    }
  }

  function render() {
    const match = currentMatch();
    if (!match) return;

    const focus = els.lens.value === match.home ? match.home_analysis : match.away_analysis;
    const opposition = els.lens.value === match.home ? match.away_analysis : match.home_analysis;
    const focusCode = els.lens.value;
    const oppositionCode = focusCode === match.home ? match.away : match.home;

    els.headline.innerHTML = `
      <div class="replay-card">
        <h4>Fixture</h4>
        <strong>${match.label}</strong>
        <p>${match.date} · ${match.start}</p>
      </div>
      <div class="replay-card">
        <h4>Venue</h4>
        <strong>${match.venue}</strong>
        <p>${match.venue_profile.innings_count || 0} innings in the historical sample.</p>
      </div>
      <div class="replay-card">
        <h4>Team Lens</h4>
        <strong>${focusCode}</strong>
        <p>${focus.active_count} active players with usable evidence in the squad view.</p>
      </div>
      <div class="replay-card">
        <h4>Average Total</h4>
        <strong>${match.venue_profile.avg_total ? formatDecimal(match.venue_profile.avg_total, 1) : "N/A"}</strong>
        <p>Venue-wide historical innings total from the ball-by-ball archive.</p>
      </div>
    `;

    renderList(
      els.venueSummary,
      (match.venue_profile.phase_conditions || []).map((row) => ({
        title: row.phase.charAt(0).toUpperCase() + row.phase.slice(1),
        runRate: row.run_rate,
        wicketRate: row.wicket_rate,
      })),
      (row) => `
        <div class="metric-card">
          <h5>${row.title}</h5>
          <strong>${formatDecimal(row.runRate, 2)}</strong>
          <p>Run rate ${formatDecimal(row.runRate, 2)} · wicket rate ${formatDecimal(row.wicketRate, 3)}</p>
        </div>
      `
    );

    renderList(
      els.venueTopBatters,
      match.venue_profile.top_batters || [],
      (row) => `
        <div class="metric-card">
          <h5>${row.player}</h5>
          <strong>${formatDecimal(row.strike_rate, 1)}</strong>
          <p>${row.runs} runs · ${row.matches} matches at this venue.</p>
        </div>
      `
    );
    renderList(
      els.venueTopBowlers,
      match.venue_profile.top_bowlers || [],
      (row) => `
        <div class="metric-card">
          <h5>${row.player}</h5>
          <strong>${formatDecimal(row.economy, 2)}</strong>
          <p>${row.wickets} wickets · ${row.matches} matches at this venue.</p>
        </div>
      `
    );
    renderList(
      els.venuePressureBatters,
      match.venue_profile.pressure_batters || [],
      (row) => `
        <div class="metric-card">
          <h5>${row.player}</h5>
          <strong>${formatDecimal(row.strike_rate, 1)}</strong>
          <p>${row.runs} runs · ${row.matches} matches in high-pressure overs here.</p>
        </div>
      `
    );
    renderList(
      els.venuePressureBowlers,
      match.venue_profile.pressure_bowlers || [],
      (row) => `
        <div class="metric-card">
          <h5>${row.player}</h5>
          <strong>${formatDecimal(row.economy, 2)}</strong>
          <p>${row.wickets} wickets · ${row.matches} matches in high-pressure overs here.</p>
        </div>
      `
    );

    els.homeTitle.textContent = `${focusCode} Focused Active Core`;
    els.awayTitle.textContent = `${oppositionCode} Opposition Active Core`;
    els.homeAnalysis.innerHTML = `
      <div class="insight-card">
        <h5>Top Batters</h5>
        <div class="metric-stack">${playerCards(focus.top_batters || [], "batting")}</div>
      </div>
      <div class="insight-card">
        <h5>Top Bowlers</h5>
        <div class="metric-stack">${playerCards(focus.top_bowlers || [], "bowling")}</div>
      </div>
    `;
    els.awayAnalysis.innerHTML = `
      <div class="insight-card">
        <h5>Top Batters</h5>
        <div class="metric-stack">${playerCards(opposition.top_batters || [], "batting")}</div>
      </div>
      <div class="insight-card">
        <h5>Top Bowlers</h5>
        <div class="metric-stack">${playerCards(opposition.top_bowlers || [], "bowling")}</div>
      </div>
    `;

    els.swot.innerHTML = `
      <div class="insight-stack">
        ${swotCard(`${els.lens.value} Strengths`, focus.swot.strengths || [])}
        ${swotCard(`${els.lens.value} Weaknesses`, focus.swot.weaknesses || [])}
      </div>
      <div class="insight-stack">
        ${swotCard(`${els.lens.value} Opportunities`, focus.swot.opportunities || [])}
        ${swotCard(`${els.lens.value} Threats`, focus.swot.threats || [])}
      </div>
    `;

    els.tactics.innerHTML = `
      <div class="insight-card">
        <h5>${els.lens.value} Tactical Plan</h5>
        <ul>${(focus.tactics || []).map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="insight-card">
        <h5>Opposition Watch</h5>
        <ul>${(opposition.swot.strengths || []).slice(0, 2).map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="insight-card">
        <h5>Method Note</h5>
        <p>${data.methodology.summary}</p>
      </div>
    `;
  }

  // ── URL param: ?team=RR filters to that franchise ──────────────
  const urlParams = new URLSearchParams(window.location.search);
  const focusTeam = (urlParams.get("team") || "").toUpperCase();

  function applyTeamBranding() {
    if (!focusTeam) return;

    // Show sticky topbar
    const topbar = document.getElementById("rr-topbar");
    if (topbar) topbar.style.display = "flex";

    // Inject RR color overrides
    const styleTag = document.getElementById("rr-mode-styles");
    if (styleTag) {
      styleTag.textContent = `
        :root {
          --accent: #E8175D;
          --accent-soft: #FF4B82;
          --good: #E8175D;
        }
        .eyebrow { color: #E8175D !important; }
        .action-button {
          background: linear-gradient(135deg, #E8175D, #B5144A) !important;
          box-shadow: 0 4px 18px rgba(232,23,93,0.35) !important;
        }
        .replay-badge {
          background: linear-gradient(145deg, #14336B, #0C1230) !important;
          border-color: rgba(232,23,93,0.3) !important;
        }
        .replay-card { border-top: 3px solid #E8175D !important; }
        .metric-card strong { color: #E8175D !important; }
        .nav-links a:hover { background: rgba(232,23,93,0.15) !important; }
      `;
    }

    // Update page text
    const backLink = document.getElementById("back-link");
    const eyebrow = document.getElementById("page-eyebrow");
    const title = document.getElementById("page-title");
    const desc = document.getElementById("page-desc");
    const badge = document.getElementById("badge-top");
    if (backLink) { backLink.href = "./rr_hub.html"; backLink.textContent = "← Back to RR Hub"; }
    if (eyebrow) eyebrow.textContent = "Rajasthan Royals · Match Intelligence";
    if (title) title.textContent = "RR 2026 — Match-by-Match Tactical Brief";
    if (desc) desc.textContent =
      "Opponent-aware SWOT, phase-by-phase tactical plan, venue specialists, and pressure ratings for every RR fixture this season.";
    if (badge) badge.textContent = "RR Fixtures";

    // Show next match label in topbar
    const nextLabel = document.getElementById("rr-next-match-label");
    if (nextLabel) {
      const today = new Date().toISOString().slice(0, 10);
      const next = getTeamMatches().find((m) => m.date >= today);
      if (next) {
        const daysUntil = Math.round(
          (new Date(next.date) - new Date(today)) / 86400000
        );
        const label = daysUntil === 0 ? "MATCH DAY"
          : daysUntil === 1 ? "Tomorrow"
          : `In ${daysUntil} days`;
        nextLabel.textContent = `Next: ${next.label} · ${label}`;
      }
    }
  }

  function getTeamMatches() {
    if (!focusTeam) return data.matches;
    return data.matches.filter(
      (m) => m.home === focusTeam || m.away === focusTeam
    );
  }

  function getNextMatchId(matches) {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = matches.filter((m) => m.date >= today);
    if (upcoming.length > 0) return String(upcoming[0].match_id);
    return String(matches[matches.length - 1].match_id);
  }

  function init() {
    applyTeamBranding();

    const visibleMatches = getTeamMatches();

    setOptions(els.match, visibleMatches.map((row) => String(row.match_id)), (value) => {
      const match = data.matches.find((row) => String(row.match_id) === value);
      return match ? `${match.date} · ${match.label}` : value;
    });

    // Auto-select next upcoming match
    const nextId = getNextMatchId(visibleMatches);
    els.match.value = nextId;

    const initialMatch = currentMatch();
    if (initialMatch) {
      syncLensOptions(initialMatch, false);
      // Auto-select focus team lens if ?team= is set
      if (focusTeam && [initialMatch.home, initialMatch.away].includes(focusTeam)) {
        els.lens.value = focusTeam;
      }
    }

    els.match.addEventListener("change", () => {
      const match = currentMatch();
      if (!match) return;
      syncLensOptions(match, false);
      if (focusTeam && [match.home, match.away].includes(focusTeam)) {
        els.lens.value = focusTeam;
      }
      render();
    });
    els.lens.addEventListener("change", () => {
      render();
    });
    render();
  }

  init();
})();
