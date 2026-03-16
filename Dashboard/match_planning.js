(function () {
  const data = window.DASHBOARD_DATA.match_planning;
  const els = {
    match: document.getElementById("match-select"),
    lens: document.getElementById("match-team-lens"),
    headline: document.getElementById("match-headline-cards"),
    venueSummary: document.getElementById("venue-summary"),
    venueTopBatters: document.getElementById("venue-top-batters"),
    venueTopBowlers: document.getElementById("venue-top-bowlers"),
    homeTitle: document.getElementById("home-team-title"),
    awayTitle: document.getElementById("away-team-title"),
    homeAnalysis: document.getElementById("home-team-analysis"),
    awayAnalysis: document.getElementById("away-team-analysis"),
    swot: document.getElementById("match-swot"),
    tactics: document.getElementById("match-tactics"),
    aiButton: document.getElementById("ai-match-brief-button"),
    briefStatus: document.getElementById("match-brief-status"),
    brief: document.getElementById("match-brief"),
  };
  const briefCache = new Map();

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

  function briefCard(title, content, isList = false) {
    if (isList) {
      return `
        <div class="insight-card">
          <h5>${title}</h5>
          <ul>${(content || []).map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
      `;
    }
    return `
      <div class="insight-card">
        <h5>${title}</h5>
        <p>${content || ""}</p>
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
          <p>${row.matches} matches · ${row.balls} balls at this venue.</p>
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

  function currentBriefKey() {
    const match = currentMatch();
    if (!match) return "";
    return `${match.match_id}:${els.lens.value}`;
  }

  function renderBrief(payload) {
    if (!payload || !payload.brief) {
      els.brief.innerHTML = "";
      return;
    }
    const brief = payload.brief;
    els.brief.innerHTML = `
      ${briefCard("Headline", brief.headline)}
      ${briefCard("Opening Call", brief.opening_call)}
      ${briefCard("Why This Matchup Is Live", brief.why_this_matchup_is_live)}
      ${briefCard("Tactical Edges", brief.tactical_edges, true)}
      ${briefCard("Matchup Watch", brief.matchup_watch, true)}
      ${briefCard("Venue Read", brief.venue_read)}
      ${briefCard("Risk Flags", brief.risk_flags, true)}
      ${briefCard("Recommended Plan", brief.recommended_plan, true)}
    `;
  }

  async function generateBrief() {
    const match = currentMatch();
    if (!match) return;
    const key = currentBriefKey();
    if (briefCache.has(key)) {
      els.briefStatus.textContent = `Cached live brief for ${els.lens.value} using ${briefCache.get(key).model}.`;
      renderBrief(briefCache.get(key));
      return;
    }

    els.aiButton.disabled = true;
    els.briefStatus.textContent = "Generating live AI brief...";
    els.brief.innerHTML = "";
    try {
      const response = await fetch("/api/match-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match.match_id,
          team_lens: els.lens.value,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate live brief");
      }
      briefCache.set(key, payload);
      els.briefStatus.textContent = `Live brief generated with ${payload.model} for ${payload.team_lens}.`;
      renderBrief(payload);
    } catch (error) {
      els.briefStatus.textContent = `Live brief unavailable: ${error.message}`;
      els.brief.innerHTML = `
        <div class="insight-card">
          <h5>Setup Needed</h5>
          <p>Configure <code>OPENAI_API_KEY</code> on the dashboard server to enable the external LLM match brief.</p>
        </div>
      `;
    } finally {
      els.aiButton.disabled = false;
    }
  }

  function init() {
    setOptions(els.match, data.matches.map((row) => String(row.match_id)), (value) => {
      const match = data.matches.find((row) => String(row.match_id) === value);
      return match ? `${match.date} · ${match.label}` : value;
    });
    const initialMatch = currentMatch();
    if (initialMatch) {
      syncLensOptions(initialMatch, false);
    }
    els.match.addEventListener("change", () => {
      const match = currentMatch();
      if (!match) return;
      syncLensOptions(match, false);
      els.briefStatus.textContent = "";
      els.brief.innerHTML = "";
      render();
    });
    els.lens.addEventListener("change", () => {
      els.briefStatus.textContent = "";
      els.brief.innerHTML = "";
      render();
    });
    els.aiButton.addEventListener("click", generateBrief);
    render();
  }

  init();
})();
