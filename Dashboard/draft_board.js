(function () {
  const data = window.DASHBOARD_DATA;
  const players = data.scenario.players;
  const teams = data.scenario.teams;
  const roleMarket = data.auction.role_market;
  const els = {
    team: document.getElementById("draft-team"),
    role: document.getElementById("draft-role"),
    market: document.getElementById("draft-market"),
    sort: document.getElementById("draft-sort"),
    cards: document.getElementById("draft-headline-cards"),
    table: document.getElementById("draft-table"),
    bars: document.getElementById("draft-bars"),
    note: document.getElementById("draft-note"),
  };

  function formatDecimal(value, digits = 2) {
    return Number(value || 0).toFixed(digits);
  }

  function titleize(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
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

  function renderBars(container, rows) {
    if (!rows.length) {
      container.innerHTML = `<p class="muted">No records available.</p>`;
      return;
    }
    const maxValue = Math.max(...rows.map((row) => Math.abs(Number(row.value || 0))), 1);
    container.innerHTML = rows
      .map(
        (row) => `
          <div class="bar-row">
            <div class="bar-label">${row.label}</div>
            <div class="bar-track"><div class="bar-fill ${row.alt ? "alt" : ""}" style="width:${(Math.abs(row.value) / maxValue) * 100}%"></div></div>
            <div class="bar-value">${row.display}</div>
          </div>
        `
      )
      .join("");
  }

  function boardRows() {
    const teamCode = els.team.value;
    const role = els.role.value;
    const marketFilter = els.market.value;
    const sortBy = els.sort.value;
    const teamShareMap = (teams[teamCode] && teams[teamCode].mc_share_map) || {};

    let rows = players.map((row) => ({
      ...row,
      team_share: Number(teamShareMap[row.player_name] || 0),
      value_surplus: Number(row.base_ceiling || 0) - Number(row.expected_price || row.reserve_price || 0),
    }));

    rows = rows.filter((row) => row.active_flag);
    if (role !== "all") {
      rows = rows.filter((row) => row.role_bucket === role);
    }
    if (marketFilter === "domestic_only") {
      rows = rows.filter((row) => !row.is_overseas);
    } else if (marketFilter === "overseas_only") {
      rows = rows.filter((row) => row.is_overseas);
    }

    rows = rows.sort((a, b) => {
      const av = Number(a[sortBy] || 0);
      const bv = Number(b[sortBy] || 0);
      return bv - av || Number(b.team_share || 0) - Number(a.team_share || 0);
    });

    return rows;
  }

  function renderCards(rows) {
    const top = rows[0];
    const biggestValue = [...rows].sort((a, b) => b.value_surplus - a.value_surplus)[0];
    const mostLikely = [...rows].sort((a, b) => b.team_share - a.team_share)[0];
    const youngest = [...rows].filter((row) => row.age > 0).sort((a, b) => a.age - b.age)[0];
    els.cards.innerHTML = `
      <div class="replay-card">
        <h4>Top Ranked</h4>
        <strong>${top ? top.player_name : "None"}</strong>
        <p>${top ? `${titleize(top.role_bucket)} · quality ${formatDecimal(top.quality_score, 3)} · exp. ${formatDecimal(top.expected_price)} Cr` : "No board rows."}</p>
      </div>
      <div class="replay-card">
        <h4>Best Value</h4>
        <strong>${biggestValue ? biggestValue.player_name : "None"}</strong>
        <p>${biggestValue ? `${biggestValue.value_surplus >= 0 ? "+" : ""}${formatDecimal(biggestValue.value_surplus)} Cr surplus` : "No value read."}</p>
      </div>
      <div class="replay-card">
        <h4>Most Likely For ${els.team.value}</h4>
        <strong>${mostLikely ? `${formatDecimal(mostLikely.team_share * 100, 1)}%` : "0.0%"}</strong>
        <p>${mostLikely ? `${mostLikely.player_name} appears most often in ${els.team.value} paths.` : "No team-specific buy signal."}</p>
      </div>
      <div class="replay-card">
        <h4>Youngest Viable Target</h4>
        <strong>${youngest ? youngest.player_name : "None"}</strong>
        <p>${youngest ? `Age ${youngest.age} · ${youngest.ipl_matches} IPL matches` : "Age not available."}</p>
      </div>
    `;
  }

  function renderBoard(rows) {
    renderTable(
      els.table,
      [
        { key: "player_name", label: "Player" },
        { key: "role_bucket", label: "Role", render: (value) => titleize(value) },
        { key: "quality_score", label: "Quality", render: (value) => formatDecimal(value, 3) },
        { key: "expected_price", label: "Exp. Price", render: (value, row) => `₹${formatDecimal(value || row.reserve_price)} Cr` },
        { key: "team_share", label: `${els.team.value} Buy %`, render: (value) => `${formatDecimal(value * 100, 1)}%` },
        { key: "value_surplus", label: "Surplus", render: (value) => `${value >= 0 ? "+" : ""}${formatDecimal(value)} Cr` },
        { key: "age", label: "Age", render: (value) => (value ? value : "--") },
        { key: "ipl_matches", label: "IPL Exp.", render: (value) => value || 0 },
        { key: "active_flag", label: "Active", render: (value, row) => (value ? `Yes (${row.last_year})` : "No") },
      ],
      rows.slice(0, 60)
    );
  }

  function renderShape(rows) {
    const topRows = rows.slice(0, 10);
    renderBars(
      els.bars,
      topRows.map((row) => ({
        label: row.player_name,
        value: els.sort.value === "value_surplus" ? row.value_surplus : row[els.sort.value],
        display:
          els.sort.value === "team_share"
            ? `${formatDecimal(row.team_share * 100, 1)}%`
            : els.sort.value === "value_surplus"
              ? `${row.value_surplus >= 0 ? "+" : ""}${formatDecimal(row.value_surplus)} Cr`
              : formatDecimal(row[els.sort.value], els.sort.value === "quality_score" ? 3 : 1),
        alt: row.is_overseas,
      }))
    );
    els.note.textContent = `${rows.length} active board rows after filters. Overseas targets are shown with teal bars.`;
  }

  function render() {
    const rows = boardRows();
    renderCards(rows);
    renderBoard(rows);
    renderShape(rows);
  }

  function init() {
    setOptions(els.team, Object.keys(teams));
    setOptions(els.role, ["all", ...roleMarket.roles], (value) => (value === "all" ? "All Role Buckets" : titleize(value)));
    setOptions(els.market, ["all", "domestic_only", "overseas_only"], (value) => titleize(value));
    setOptions(els.sort, ["quality_score", "team_share", "value_surplus", "age", "ipl_matches"], (value) => titleize(value));
    [els.team, els.role, els.market, els.sort].forEach((element) => element.addEventListener("change", render));
    render();
  }

  init();
})();
