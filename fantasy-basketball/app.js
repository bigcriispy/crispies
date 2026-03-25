(function () {
  'use strict';

  const SETTINGS_KEY = 'fantasy-basketball-settings';
  const LEAGUE_TEAMS_KEY = 'fantasy-basketball-league-teams';
  const DEFAULT_SETTINGS = {
    pts: 1,
    reb: 1.2,
    ast: 1.5,
    stl: 3,
    blk: 3,
    tov: -1,
    threes: 0.5,
    fgm: 0,
    fga: 0,
    ftm: 0,
    fta: 0,
  };

  let players = [];
  let gameLogs = [];
  let leagueTeams = [];
  let settings = { ...DEFAULT_SETTINGS };
  let chartTrends = null;
  let chartMatchup = null;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(settings, DEFAULT_SETTINGS, parsed);
      }
    } catch (_) {}
    return settings;
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}
  }

  function applySettingsFromForm() {
    const keys = Object.keys(DEFAULT_SETTINGS);
    keys.forEach(function (key) {
      const el = document.getElementById(key);
      if (el) {
        const v = parseFloat(el.value, 10);
        settings[key] = isNaN(v) ? DEFAULT_SETTINGS[key] : v;
      }
    });
    saveSettings();
  }

  function fillFormFromSettings() {
    Object.keys(settings).forEach(function (key) {
      const el = document.getElementById(key);
      if (el) el.value = settings[key];
    });
  }

  function fantasyPPG(player) {
    return fantasyPointsForGame(player);
  }

  function fantasyPointsForGame(game) {
    const s = settings;
    return (
      (game.pts || 0) * s.pts +
      (game.reb || 0) * s.reb +
      (game.ast || 0) * s.ast +
      (game.stl || 0) * s.stl +
      (game.blk || 0) * s.blk +
      (game.tov || 0) * s.tov +
      (game.threes || 0) * s.threes +
      (game.fgm || 0) * s.fgm +
      (game.fga || 0) * s.fga +
      (game.ftm || 0) * s.ftm +
      (game.fta || 0) * s.fta
    );
  }

  function normalizeName(name) {
    return (name || '').trim().toLowerCase();
  }

  function playerNameMatch(a, b) {
    return normalizeName(a) === normalizeName(b);
  }

  function fgPct(player) {
    const fga = player.fga || 0;
    if (fga === 0) return null;
    const fgm = player.fgm || 0;
    return (fgm / fga) * 100;
  }

  function ftPct(player) {
    const fta = player.fta || 0;
    if (fta === 0) return null;
    const ftm = player.ftm || 0;
    return (ftm / fta) * 100;
  }

  function formatNum(n, decimals) {
    if (n == null || isNaN(n)) return '—';
    const d = decimals != null ? decimals : 1;
    return Number(n).toFixed(d);
  }

  function filterAndSortPlayers(data, search, sortKey) {
    let list = data.slice();
    const q = (search || '').trim().toLowerCase();
    if (q) {
      list = list.filter(function (p) {
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.team || '').toLowerCase().includes(q)
        );
      });
    }
    list.sort(function (a, b) {
      let va, vb;
      if (sortKey === 'fantasy') {
        va = fantasyPPG(a);
        vb = fantasyPPG(b);
      } else if (sortKey === 'name') {
        va = (a.name || '').toLowerCase();
        vb = (b.name || '').toLowerCase();
        return va.localeCompare(vb);
      } else {
        va = a[sortKey] != null ? a[sortKey] : -Infinity;
        vb = b[sortKey] != null ? b[sortKey] : -Infinity;
      }
      return vb - va;
    });
    return list;
  }

  function renderTable(list) {
    const tbody = document.getElementById('players-body');
    const countEl = document.getElementById('player-count');
    if (!tbody) return;

    tbody.innerHTML = '';
    countEl.textContent = list.length + ' player' + (list.length !== 1 ? 's' : '');

    list.forEach(function (player) {
      const fppg = fantasyPPG(player);
      const fg = fgPct(player);
      const ft = ftPct(player);
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(player.name || '—') + '</td>' +
        '<td>' + escapeHtml(player.team || '—') + '</td>' +
        '<td class="num">' + (player.gp != null ? player.gp : '—') + '</td>' +
        '<td class="num fantasy">' + formatNum(fppg, 1) + '</td>' +
        '<td class="num">' + formatNum(player.pts) + '</td>' +
        '<td class="num">' + formatNum(player.reb) + '</td>' +
        '<td class="num">' + formatNum(player.ast) + '</td>' +
        '<td class="num">' + formatNum(player.stl) + '</td>' +
        '<td class="num">' + formatNum(player.blk) + '</td>' +
        '<td class="num' + (player.tov > 0 ? ' negative' : '') + '">' + formatNum(player.tov) + '</td>' +
        '<td class="num">' + formatNum(player.threes) + '</td>' +
        '<td class="num">' + (fg != null ? formatNum(fg, 1) + '%' : '—') + '</td>' +
        '<td class="num">' + (ft != null ? formatNum(ft, 1) + '%' : '—') + '</td>';
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function refresh() {
    const search = (document.getElementById('search') || {}).value;
    const sortKey = (document.getElementById('sort') || {}).value || 'fantasy';
    const list = filterAndSortPlayers(players, search, sortKey);
    renderTable(list);
  }

  function loadPlayers() {
    fetch('data/players.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load players');
        return r.json();
      })
      .then(function (data) {
        players = Array.isArray(data) ? data : [];
        refresh();
      })
      .catch(function () {
        players = [];
        refresh();
      });
  }

  function loadGameLogs() {
    fetch('data/game-logs.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load game logs');
        return r.json();
      })
      .then(function (data) {
        gameLogs = Array.isArray(data) ? data : [];
        populateTrendPlayerSelect();
        updateMatchupChart();
      })
      .catch(function () {
        gameLogs = [];
        populateTrendPlayerSelect();
      });
  }

  function switchPanel(panelId) {
    document.querySelectorAll('.tab').forEach(function (tab) {
      const isActive = tab.getAttribute('data-panel') === panelId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
    document.querySelectorAll('.panel').forEach(function (panel) {
      const id = panel.id;
      const show = id === 'panel-' + panelId;
      panel.classList.toggle('hidden', !show);
      panel.setAttribute('aria-hidden', !show);
      if (show && panelId === 'trends') updateTrendChart();
      if (show && panelId === 'matchup') updateMatchupChart();
    });
  }

  function populateTrendPlayerSelect() {
    const sel = document.getElementById('trend-player');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select player —</option>';
    gameLogs.forEach(function (log) {
      const opt = document.createElement('option');
      opt.value = log.name;
      opt.textContent = log.name + ' (' + log.team + ')';
      sel.appendChild(opt);
    });
  }

  function updateTrendChart() {
    const name = (document.getElementById('trend-player') || {}).value;
    const maxGames = parseInt(document.getElementById('trend-games') && document.getElementById('trend-games').value, 10) || 15;
    const canvas = document.getElementById('chart-trends');
    if (!canvas || !name) {
      if (chartTrends) {
        chartTrends.destroy();
        chartTrends = null;
      }
      return;
    }
    const log = gameLogs.find(function (l) { return playerNameMatch(l.name, name); });
    if (!log || !log.games || !log.games.length) return;
    const games = log.games.slice(-maxGames);
    const labels = games.map(function (g, i) { return g.date || 'G' + (i + 1); });
    const data = games.map(function (g) { return Math.round(fantasyPointsForGame(g) * 10) / 10; });
    if (chartTrends) chartTrends.destroy();
    chartTrends = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Fantasy pts',
          data: data,
          borderColor: 'rgb(201, 162, 39)',
          backgroundColor: 'rgba(201, 162, 39, 0.1)',
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#8c8986' } },
          x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#8c8986', maxRotation: 45 } }
        }
      }
    });
  }

  function loadLeagueTeams() {
    try {
      const raw = localStorage.getItem(LEAGUE_TEAMS_KEY);
      leagueTeams = raw ? JSON.parse(raw) : [];
    } catch (_) {
      leagueTeams = [];
    }
    renderLeagueTeams();
  }

  function saveLeagueTeams() {
    try {
      localStorage.setItem(LEAGUE_TEAMS_KEY, JSON.stringify(leagueTeams));
    } catch (_) {}
    renderLeagueTeams();
    updateMatchupChart();
  }

  function parseLeagueFile(text, filename) {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.json')) {
      const j = JSON.parse(text);
      const teams = j.teams || (Array.isArray(j) ? j : []);
      return teams.map(function (t) {
        return { name: t.name || t.team || 'Unknown', players: Array.isArray(t.players) ? t.players : [] };
      });
    }
    const lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) return [];
    const header = lines[0].toLowerCase();
    const hasTeam = header.includes('team');
    const hasPlayer = header.includes('player') || header.includes('name');
    const delim = lines[0].indexOf(',') >= 0 ? ',' : '\t';
    const parseRow = function (row) {
      const cells = row.split(delim).map(function (c) { return c.replace(/^"|"$/g, '').trim(); });
      return cells;
    };
    const teamCol = hasTeam ? 0 : -1;
    const playerCol = hasPlayer ? (hasTeam ? 1 : 0) : (hasTeam ? 1 : 0);
    const start = (header.indexOf('team') >= 0 || header.indexOf('player') >= 0 || header.indexOf('name') >= 0) ? 1 : 0;
    const byTeam = {};
    for (var i = start; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      const team = teamCol >= 0 ? (cells[teamCol] || '').trim() : 'League';
      const player = (cells[playerCol] != null ? cells[playerCol] : cells[0] || '').trim();
      if (!player) continue;
      if (!byTeam[team]) byTeam[team] = [];
      byTeam[team].push(player);
    }
    return Object.keys(byTeam).map(function (name) { return { name: name, players: byTeam[name] }; });
  }

  function renderLeagueTeams() {
    const wrap = document.getElementById('league-teams-wrap');
    const listEl = document.getElementById('league-teams-list');
    const mySel = document.getElementById('my-team');
    const oppSel = document.getElementById('opponent-team');
    if (!listEl || !mySel || !oppSel) return;
    listEl.innerHTML = '';
    mySel.innerHTML = '<option value="">— My team —</option>';
    oppSel.innerHTML = '<option value="">— Opponent —</option>';
    leagueTeams.forEach(function (t) {
      const li = document.createElement('li');
      li.textContent = t.name + ' (' + (t.players && t.players.length) + ' players)';
      listEl.appendChild(li);
      const opt1 = document.createElement('option');
      opt1.value = t.name;
      opt1.textContent = t.name;
      mySel.appendChild(opt1);
      const opt2 = document.createElement('option');
      opt2.value = t.name;
      opt2.textContent = t.name;
      oppSel.appendChild(opt2);
    });
    if (wrap) wrap.style.display = leagueTeams.length ? 'block' : 'none';
  }

  function getTeamPlayerNames(teamName) {
    const t = leagueTeams.find(function (x) { return normalizeName(x.name) === normalizeName(teamName); });
    return (t && t.players) ? t.players : [];
  }

  function buildMatchupSeries() {
    const myName = (document.getElementById('my-team') || {}).value;
    const oppName = (document.getElementById('opponent-team') || {}).value;
    const myPlayers = getTeamPlayerNames(myName);
    const oppPlayers = getTeamPlayerNames(oppName);
    if (!myPlayers.length && !oppPlayers.length) return { dates: [], my: [], opp: [] };
    const dateMap = {};
    gameLogs.forEach(function (log) {
      (log.games || []).forEach(function (g) {
        const d = g.date;
        if (!d) return;
        if (!dateMap[d]) dateMap[d] = { my: 0, opp: 0 };
        const fp = fantasyPointsForGame(g);
        if (myPlayers.some(function (p) { return playerNameMatch(p, log.name); })) dateMap[d].my += fp;
        if (oppPlayers.some(function (p) { return playerNameMatch(p, log.name); })) dateMap[d].opp += fp;
      });
    });
    const dates = Object.keys(dateMap).sort();
    return {
      dates: dates,
      my: dates.map(function (d) { return Math.round(dateMap[d].my * 10) / 10; }),
      opp: dates.map(function (d) { return Math.round(dateMap[d].opp * 10) / 10; })
    };
  }

  function updateMatchupChart() {
    const series = buildMatchupSeries();
    const canvas = document.getElementById('chart-matchup');
    if (!canvas) return;
    if (chartMatchup) chartMatchup.destroy();
    if (!series.dates.length) {
      if (chartMatchup) {
        chartMatchup.destroy();
        chartMatchup = null;
      }
      return;
    }
    const myName = (document.getElementById('my-team') && document.getElementById('my-team').value) || 'My team';
    const oppName = (document.getElementById('opponent-team') && document.getElementById('opponent-team').value) || 'Opponent';
    chartMatchup = new Chart(canvas, {
      type: 'line',
      data: {
        labels: series.dates,
        datasets: [
          { label: myName, data: series.my, borderColor: 'rgb(201, 162, 39)', backgroundColor: 'rgba(201, 162, 39, 0.1)', fill: true, tension: 0.2 },
          { label: oppName, data: series.opp, borderColor: 'rgb(90, 140, 200)', backgroundColor: 'rgba(90, 140, 200, 0.1)', fill: true, tension: 0.2 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#8c8986' } },
          x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#8c8986', maxRotation: 45 } }
        }
      }
    });
  }

  function initSettingsToggle() {
    const toggle = document.getElementById('settings-toggle');
    const panel = document.getElementById('settings-panel');
    const parent = toggle && toggle.closest('.league-settings');
    if (!toggle || !parent) return;
    toggle.addEventListener('click', function () {
      const collapsed = parent.hasAttribute('data-collapsed');
      if (collapsed) {
        parent.removeAttribute('data-collapsed');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        parent.setAttribute('data-collapsed', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function init() {
    loadSettings();
    fillFormFromSettings();

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchPanel(tab.getAttribute('data-panel'));
      });
    });

    document.getElementById('apply-settings').addEventListener('click', function () {
      applySettingsFromForm();
      refresh();
      updateTrendChart();
      updateMatchupChart();
    });

    document.getElementById('reset-settings').addEventListener('click', function () {
      settings = { ...DEFAULT_SETTINGS };
      saveSettings();
      fillFormFromSettings();
      refresh();
      updateTrendChart();
      updateMatchupChart();
    });

    document.getElementById('search').addEventListener('input', refresh);
    document.getElementById('sort').addEventListener('change', refresh);

    var trendPlayer = document.getElementById('trend-player');
    var trendGames = document.getElementById('trend-games');
    if (trendPlayer) trendPlayer.addEventListener('change', updateTrendChart);
    if (trendGames) trendGames.addEventListener('change', updateTrendChart);

    document.getElementById('my-team').addEventListener('change', updateMatchupChart);
    document.getElementById('opponent-team').addEventListener('change', updateMatchupChart);

    var leagueFile = document.getElementById('league-file');
    var leagueFileName = document.getElementById('league-file-name');
    var loadSampleBtn = document.getElementById('load-sample-league');
    if (loadSampleBtn) {
      loadSampleBtn.addEventListener('click', function () {
        leagueTeams = [
          { name: 'Team Alpha', players: ['Luka Doncic', 'Shai Gilgeous-Alexander', 'Nikola Jokic', 'Jalen Brunson'] },
          { name: 'Team Beta', players: ['Anthony Edwards', 'Tyrese Haliburton', 'Victor Wembanyama', 'Domantas Sabonis'] }
        ];
        saveLeagueTeams();
        if (leagueFileName) leagueFileName.textContent = 'Sample league loaded';
      });
    }
    if (leagueFile) {
      leagueFile.addEventListener('change', function () {
        var file = leagueFile.files[0];
        if (!file) {
          if (leagueFileName) leagueFileName.textContent = 'No file chosen';
          return;
        }
        if (leagueFileName) leagueFileName.textContent = file.name;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            leagueTeams = parseLeagueFile(reader.result, file.name);
            saveLeagueTeams();
          } catch (e) {
            if (leagueFileName) leagueFileName.textContent = 'Error: ' + e.message;
          }
        };
        reader.readAsText(file);
      });
    }

    initSettingsToggle();
    loadPlayers();
    loadGameLogs();
    loadLeagueTeams();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
