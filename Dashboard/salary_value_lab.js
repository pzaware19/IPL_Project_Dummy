(function () {
  const data = window.DASHBOARD_DATA.salary_value;

  const els = {
    team: document.getElementById("value-team-filter"),
    band: document.getElementById("value-band-filter"),
    search: document.getElementById("value-player-search"),
    options: document.getElementById("value-player-options"),
    headline: document.getElementById("value-headline-cards"),
    playerCard: document.getElementById("value-player-card"),
    teamTable: document.getElementById("value-team-table"),
    undervaluedTable: document.getElementById("value-undervalued-table"),
    overvaluedTable: document.getElementById("value-overvalued-table"),
    playerTable: document.getElementById("value-player-table"),
    methodology: document.getElementById("value-methodology"),
  };

  function formatDecimal(value, digits = 2) {
    return Number(value || 0).toFixed(digits);
  }

  function formatCurrency(value) {
    return `Rs. ${formatDecimal(value, 2)} Cr`;
  }

  function renderTable(table, columns, rows) {
    const head = columns.map((column) => `<th>${column.label}</th>`).join("");
    const body = rows.length
      ? rows
          .map(
            (row) =>
              `<tr>${columns
                .map((column) => `<td>${column.render ? column.render(row[column.key], row) : row[column.key] ?? ""}</td>`)
                .join("")}</tr>`
          )
          .join("")
      : `<tr><td colspan="${columns.length}" class="replay-empty">No rows match the current filters.</td></tr>`;
    table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
  }

  function filteredPlayers() {
    return data.players.filter((row) => {
      const teamOk = els.team.value === "All Teams" || row.team_code === els.team.value;
      const bandOk = els.band.value === "All Bands" || row.valuation_band === els.band.value;
      return teamOk && bandOk;
    });
  }

  function syncPlayerOptions() {
    const rows = filteredPlayers();
    const names = rows.map((row) => row.player);
    els.options.innerHTML = names.map((name) => `<option value="${name}"></option>`).join("");
    if (!names.includes(els.search.value)) {
      els.search.value = names[0] || data.players[0]?.player || "";
    }
  }

  function selectedPlayer() {
    return filteredPlayers().find((row) => row.player === els.search.value) || filteredPlayers()[0] || data.players[0];
  }

  function renderHeadline(rows) {
    const topUnder = rows.filter((row) => row.valuation_band === "Undervalued").sort((a, b) => b.value_gap_cr - a.value_gap_cr)[0];
    const topOver = rows.filter((row) => row.valuation_band === "Overvalued").sort((a, b) => a.value_gap_cr - b.value_gap_cr)[0];
    const avgIndex = rows.length ? rows.reduce((sum, row) => sum + Number(row.salary_value_index || 0), 0) / rows.length : 100;
    const totalGap = rows.reduce((sum, row) => sum + Number(row.value_gap_cr || 0), 0);
    els.headline.innerHTML = `
      <div class="replay-card">
        <h4>Average Value Index</h4>
        <strong>${formatDecimal(avgIndex, 1)}</strong>
        <p>100 means current salary matches fair value.</p>
      </div>
      <div class="replay-card">
        <h4>Total Value Gap</h4>
        <strong>${formatCurrency(totalGap)}</strong>
        <p>Positive means this filtered pool looks cheaper than model value.</p>
      </div>
      <div class="replay-card">
        <h4>Top Undervalued</h4>
        <strong>${topUnder ? topUnder.player : "N/A"}</strong>
        <p>${topUnder ? `${formatCurrency(topUnder.value_gap_cr)} gap` : "No undervalued player in filter."}</p>
      </div>
      <div class="replay-card">
        <h4>Top Overvalued</h4>
        <strong>${topOver ? topOver.player : "N/A"}</strong>
        <p>${topOver ? `${formatCurrency(topOver.value_gap_cr)} gap` : "No overvalued player in filter."}</p>
      </div>
    `;
  }

  function renderPlayerCard(player) {
    if (!player) {
      els.playerCard.innerHTML = `<div class="insight-card"><p>No player selected.</p></div>`;
      return;
    }
    els.playerCard.innerHTML = `
      <div class="insight-card">
        <h5>${player.player}</h5>
        <p>${player.explanation}</p>
      </div>
      <div class="compare-grid">
        <div class="compare-card">
          <h5>Price vs Fair Value</h5>
          <div class="summary-line"><span>Current salary</span><strong>${formatCurrency(player.salary_cr)}</strong></div>
          <div class="summary-line"><span>Fair salary</span><strong>${formatCurrency(player.fair_value_cr)}</strong></div>
          <div class="summary-line"><span>Value gap</span><strong>${formatCurrency(player.value_gap_cr)}</strong></div>
          <div class="summary-line"><span>Band</span><strong>${player.valuation_band}</strong></div>
        </div>
        <div class="compare-card">
          <h5>Performance Context</h5>
          <div class="summary-line"><span>Performance score</span><strong>${formatDecimal(player.performance_score, 1)}</strong></div>
          <div class="summary-line"><span>Salary Value Index</span><strong>${formatDecimal(player.salary_value_index, 1)}</strong></div>
          <div class="summary-line"><span>Total impact</span><strong>${formatDecimal(player.total_impact, 2)}</strong></div>
          <div class="summary-line"><span>Wins added</span><strong>${formatDecimal(player.total_wins_added, 2)}</strong></div>
        </div>
      </div>
    `;
  }

  function renderTeamTable() {
    renderTable(
      els.teamTable,
      [
        { key: "team_code", label: "Team" },
        { key: "avg_value_index", label: "Avg Index", render: (value) => formatDecimal(value, 1) },
        { key: "total_gap_cr", label: "Total Gap", render: (value) => formatCurrency(value) },
        { key: "undervalued_count", label: "Under" },
        { key: "overvalued_count", label: "Over" },
      ],
      data.teams
    );
  }

  function renderValueTables(rows) {
    const undervalued = rows.filter((row) => row.valuation_band === "Undervalued").sort((a, b) => b.value_gap_cr - a.value_gap_cr).slice(0, 12);
    const overvalued = rows.filter((row) => row.valuation_band === "Overvalued").sort((a, b) => a.value_gap_cr - b.value_gap_cr).slice(0, 12);
    const cols = [
      { key: "player", label: "Player" },
      { key: "team_code", label: "Team" },
      { key: "salary_cr", label: "Current", render: (value) => formatCurrency(value) },
      { key: "fair_value_cr", label: "Fair", render: (value) => formatCurrency(value) },
      { key: "value_gap_cr", label: "Gap", render: (value) => formatCurrency(value) },
      { key: "salary_value_index", label: "SVI", render: (value) => formatDecimal(value, 1) },
    ];
    renderTable(els.undervaluedTable, cols, undervalued);
    renderTable(els.overvaluedTable, cols, overvalued);
  }

  function renderPlayerTable(rows) {
    renderTable(
      els.playerTable,
      [
        { key: "player", label: "Player" },
        { key: "team_code", label: "Team" },
        { key: "role_group", label: "Role" },
        { key: "salary_cr", label: "Current", render: (value) => formatCurrency(value) },
        { key: "fair_value_cr", label: "Fair", render: (value) => formatCurrency(value) },
        { key: "value_gap_cr", label: "Gap", render: (value) => formatCurrency(value) },
        { key: "salary_value_index", label: "SVI", render: (value) => formatDecimal(value, 1) },
        { key: "valuation_band", label: "Band" },
      ],
      rows.sort((a, b) => b.salary_value_index - a.salary_value_index)
    );
  }

  function renderMethodology() {
    els.methodology.innerHTML = `
      <div class="method-card">
        <h5>What The Model Uses</h5>
        <p>${data.methodology.summary}</p>
      </div>
      <div class="method-card">
        <h5>Salary Value Index</h5>
        <p>${data.methodology.index}</p>
      </div>
      <div class="method-card">
        <h5>Value Gap</h5>
        <p>${data.methodology.gap}</p>
      </div>
    `;
  }

  function render() {
    const rows = filteredPlayers();
    syncPlayerOptions();
    renderHeadline(rows);
    renderPlayerCard(selectedPlayer());
    renderTeamTable();
    renderValueTables(rows);
    renderPlayerTable(rows);
    renderMethodology();
  }

  function init() {
    const teams = ["All Teams"].concat([...new Set(data.players.map((row) => row.team_code))].sort());
    els.team.innerHTML = teams.map((team) => `<option value="${team}">${team}</option>`).join("");
    els.band.innerHTML = ["All Bands", "Undervalued", "Fair Value", "Overvalued"]
      .map((band) => `<option value="${band}">${band}</option>`)
      .join("");
    els.team.value = "All Teams";
    els.band.value = "All Bands";
    syncPlayerOptions();
    els.team.addEventListener("change", render);
    els.band.addEventListener("change", render);
    els.search.addEventListener("change", render);
    render();
  }

  init();
})();
