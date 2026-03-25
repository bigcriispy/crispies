# Fantasy Basketball — Per Game Analyzer

A small web app to analyze NBA players’ per-game stats with your **league scoring settings**, view **game-by-game trends**, upload **league rosters**, and track **your team vs opponent** over time.

## Features

- **League settings**: Configure points per stat (PTS, REB, AST, STL, BLK, TOV, 3PM, FGM/FGA, FTM/FTA). Settings are saved in your browser.
- **Players table**: Per-game stats and **Fantasy PPG**; search and sort.
- **Player trends**: Game-by-game fantasy points time series for any player with game logs. Use it to decide whether to add or drop a player.
- **My league**: Upload your league’s teams (CSV or JSON). Choose “My team” and “Opponent” for the matchup view.
- **My team vs opponent**: Time series of fantasy performance by date—your team’s total vs the opponent’s total each day (from game logs).

## Run locally

Serve the folder so JSON and file uploads work:

```bash
cd fantasy-basketball
npx serve .
# open http://localhost:3000
```

## Data

- **`data/players.json`**: Season per-game averages. Structure: `name`, `team`, `gp`, `pts`, `reb`, `ast`, `stl`, `blk`, `tov`, `fgm`, `fga`, `ftm`, `fta`, `threes`.
- **`data/game-logs.json`**: Game-by-game stats for trend and matchup charts. Array of `{ "name", "team", "games": [ { "date", "pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "ftm", "fta", "threes" } ] }`.
- **League upload**  
  - **CSV**: One row per player; columns `Team` and `Player` (or similar). First row can be a header.  
  - **JSON**: `{ "teams": [ { "name": "Team A", "players": ["Player 1", "Player 2", ...] } ] }`.  
  Player names are matched to game logs by normalized name (trim, case-insensitive).

## Tech

HTML, CSS, JavaScript, and Chart.js (CDN). No build step. Works with GitHub Pages.
