#!/usr/bin/env python3
"""
Generate players.json (300 players) and game-logs.json (game-by-game for all 300).
Run from repo root: python3 scripts/generate_data.py
"""
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data"
SEED = 42
random.seed(SEED)

# 30 NBA teams, 10 players each = 300. Team abbreviations.
TEAMS = [
    "ATL", "BOS", "BKN", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW",
    "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK",
    "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS",
]

# Existing 30 players (keep as-is for players.json); we'll add 270 more names.
# 270 additional names (realistic NBA-style first/last) to reach 300 total.
EXTRA_NAMES = [
    "Austin Reaves", "D'Angelo Russell", "Rui Hachimura", "Gabe Vincent", "Jarred Vanderbilt",
    "Max Christie", "Jaxson Hayes", "Skylar Mays", "Colin Gillespie", "Maxwell Lewis",
    "James Harden", "Joel Embiid", "Tobias Harris", "Kelly Oubre Jr.", "Andre Drummond",
    "Robert Covington", "Kyle Lowry", "Eric Gordon", "KJ Martin", "Jeff Dowtin Jr.",
    "Zion Williamson", "Brandon Ingram", "CJ McCollum", "Herb Jones", "Trey Murphy III",
    "Jose Alvarado", "Larry Nance Jr.", "Jordan Hawkins", "Jeremiah Robinson-Earl", "Dyson Daniels",
    "Ja Morant", "Desmond Bane", "Jaren Jackson Jr.", "Marcus Smart", "Luke Kennard",
    "Xavier Tillman", "David Roddy", "Vince Williams Jr.", "GG Jackson", "Jake LaRavia",
    "Damian Lillard", "Giannis Antetokounmpo", "Khris Middleton", "Brook Lopez", "Bobby Portis",
    "MarJon Beauchamp", "Pat Connaughton", "Andre Jackson Jr.", "Chris Livingston", "TyTy Washington",
    "Jimmy Butler", "Bam Adebayo", "Tyler Herro", "Terry Rozier", "Duncan Robinson",
    "Haywood Highsmith", "Jaime Jaquez Jr.", "Thomas Bryant", "Orlando Robinson", "Cole Swider",
    "Jalen Brunson", "Mikal Bridges", "OG Anunoby", "Donte DiVincenzo", "Josh Hart",
    "Precious Achiuwa", "Jericho Sims", "Miles McBride", "DaQuan Jeffries", "Dylan Windler",
    "Paolo Banchero", "Franz Wagner", "Wendell Carter Jr.", "Gary Harris", "Jalen Suggs",
    "Markelle Fultz", "Cole Anthony", "Jonathan Isaac", "Moritz Wagner", "Caleb Houstan",
    "Joel Embiid", "Tyrese Maxey", "Kelly Oubre Jr.", "Andre Drummond", "Kyle Lowry",
    "De'Anthony Melton", "Paul Reed", "Robert Covington", "KJ Martin", "Jeff Dowtin Jr.",
    "LaMelo Ball", "Miles Bridges", "Brandon Miller", "Mark Williams", "Cody Martin",
    "Nick Richards", "Nathan Mensah", "James Bouknight", "Leaky Black", "Amari Bailey",
    "Trae Young", "Dejounte Murray", "Bogdan Bogdanovic", "De'Andre Hunter", "Onyeka Okongwu",
    "Clint Capela", "Saddiq Bey", "Garrison Mathews", "Bruno Fernando", "Wesley Matthews",
    "Jayson Tatum", "Jaylen Brown", "Kristaps Porzingis", "Derrick White", "Jrue Holiday",
    "Al Horford", "Payton Pritchard", "Sam Hauser", "Luke Kornet", "Neemias Queta",
    "Donovan Mitchell", "Darius Garland", "Evan Mobley", "Jarrett Allen", "Max Strus",
    "Caris LeVert", "Isaac Okoro", "Georges Niang", "Dean Wade", "Craig Porter Jr.",
    "Cade Cunningham", "Jaden Ivey", "Ausar Thompson", "Jalen Duren", "Bojan Bogdanovic",
    "Isaiah Stewart", "Marcus Sasser", "Simone Fontecchio", "Taj Gibson", "Malachi Flynn",
    "Tyrese Haliburton", "Pascal Siakam", "Myles Turner", "Andrew Nembhard", "Aaron Nesmith",
    "Bennedict Mathurin", "Obi Toppin", "Jarace Walker", "Isaiah Jackson", "Ben Sheppard",
    "Kawhi Leonard", "Paul George", "James Harden", "Ivica Zubac", "Norman Powell",
    "Russell Westbrook", "Amir Coffey", "PJ Tucker", "Daniel Theis", "Bones Hyland",
    "LeBron James", "Anthony Davis", "Austin Reaves", "D'Angelo Russell", "Rui Hachimura",
    "Gabe Vincent", "Jarred Vanderbilt", "Max Christie", "Jaxson Hayes", "Skylar Mays",
    "Luka Doncic", "Kyrie Irving", "P.J. Washington", "Daniel Gafford", "Dereck Lively II",
    "Tim Hardaway Jr.", "Josh Green", "Dante Exum", "Maxi Kleber", "Jaden Hardy",
    "Nikola Jokic", "Jamal Murray", "Michael Porter Jr.", "Aaron Gordon", "Christian Braun",
    "Kentavious Caldwell-Pope", "Reggie Jackson", "Julian Strawther", "DeAndre Jordan", "Hunter Tyson",
    "Anthony Edwards", "Rudy Gobert", "Karl-Anthony Towns", "Jaden McDaniels", "Mike Conley",
    "Nickeil Alexander-Walker", "Naz Reid", "Leonard Miller", "Josh Minott", "Wendell Moore Jr.",
    "Shai Gilgeous-Alexander", "Chet Holmgren", "Jalen Williams", "Lu Dort", "Isaiah Joe",
    "Cason Wallace", "Aaron Wiggins", "Kenrich Williams", "Jaylin Williams", "Olivier Sarr",
    "Anfernee Simons", "Scoot Henderson", "Jerami Grant", "Deandre Ayton", "Matisse Thybulle",
    "Shaedon Sharpe", "Toumani Camara", "Duop Reath", "Jabari Walker", "Kris Murray",
    "Kevin Durant", "Devin Booker", "Bradley Beal", "Jusuf Nurkic", "Eric Gordon",
    "Royce O'Neale", "Drew Eubanks", "David Roddy", "Bol Bol", "Theo Maledon",
    "De'Aaron Fox", "Domantas Sabonis", "Keegan Murray", "Malik Monk", "Keegan Murray",
    "Harrison Barnes", "Trey Lyles", "Chris Duarte", "JaVale McGee", "Colby Jones",
    "Victor Wembanyama", "Devin Vassell", "Jeremy Sochan", "Keldon Johnson", "Tre Jones",
    "Cedi Osman", "Malaki Branham", "Blake Wesley", "Zach Collins", "Sidy Cissoko",
    "Stephen Curry", "Draymond Green", "Andrew Wiggins", "Jonathan Kuminga", "Klay Thompson",
    "Brandin Podziemski", "Gary Payton II", "Kevon Looney", "Lester Quinones", "Gui Santos",
    "Donovan Mitchell", "Darius Garland", "Evan Mobley", "Jarrett Allen", "Max Strus",
    "Caris LeVert", "Isaac Okoro", "Georges Niang", "Dean Wade", "Craig Porter Jr.",
    "Scottie Barnes", "RJ Barrett", "Immanuel Quickley", "Jakob Poeltl", "Gary Trent Jr.",
    "Bruce Brown", "Gradey Dick", "Chris Boucher", "Jontay Porter", "Jalen McDaniels",
    "Lauri Markkanen", "Collin Sexton", "Jordan Clarkson", "John Collins", "Walker Kessler",
    "Kris Dunn", "Keyonte George", "Taylor Hendricks", "Brice Sensabaugh", "Luka Samanic",
    "Jordan Poole", "Kyle Kuzma", "Marvin Bagley III", "Corey Kispert", "Bilal Coulibaly",
    "Deni Avdija", "Daniel Gafford", "Landry Shamet", "Johnny Davis", "Jared Butler",
]

# Existing 30 player names (must not appear in extra list)
EXISTING_NAMES = {
    "Luka Doncic", "Shai Gilgeous-Alexander", "Giannis Antetokounmpo", "Nikola Jokic",
    "Stephen Curry", "Jayson Tatum", "Kevin Durant", "Anthony Edwards", "LeBron James",
    "Donovan Mitchell", "Tyrese Haliburton", "Trae Young", "Domantas Sabonis", "Bam Adebayo",
    "Paolo Banchero", "Scottie Barnes", "Victor Wembanyama", "Chet Holmgren", "Jalen Brunson",
    "De'Aaron Fox", "LaMelo Ball", "Desmond Bane", "Tyrese Maxey", "Jaylen Brown",
    "Karl-Anthony Towns", "Evan Mobley", "Franz Wagner", "Mikal Bridges", "Jaren Jackson Jr.",
    "Alperen Sengun",
}

def unique_names(exclude=None):
    exclude = exclude or set()
    seen = set(exclude)
    out = []
    for n in EXTRA_NAMES:
        n = n.strip()
        if n and n not in seen:
            seen.add(n)
            out.append(n)
    return out

EXTRA_LIST = unique_names(EXISTING_NAMES)

# If we're short, pad with "Player N"
def all_extra_names(count=270):
    out = list(EXTRA_LIST)[:count]
    idx = 31
    while len(out) < count:
        candidate = "Player " + str(idx)
        if candidate not in out:
            out.append(candidate)
        idx += 1
    return out[:count]

def random_variance(base, spread=0.15):
    s = max(0, base * (1 + random.uniform(-spread, spread)))
    return round(s, 1)

def int_variance(base, spread=2):
    return max(0, int(base + random.uniform(-spread, spread)))

def one_game_from_avg(avg, date_str):
    g = {}
    for k in ["pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "ftm", "fta", "threes"]:
        v = avg.get(k, 0)
        if k in ("fgm", "fga", "ftm", "fta", "threes"):
            g[k] = max(0, int_variance(v, 2))
        else:
            g[k] = round(random_variance(v, 0.25), 1) if isinstance(v, (int, float)) else 0
    g["date"] = date_str
    return g

# Full NBA regular season 2024-25: Oct 22, 2024 -> Apr 13, 2025
SEASON_START = "2024-10-22"
SEASON_END = "2025-04-13"

def full_season_dates():
    """All calendar days in the NBA regular season."""
    start = datetime.strptime(SEASON_START, "%Y-%m-%d")
    end = datetime.strptime(SEASON_END, "%Y-%m-%d")
    out = []
    d = start
    while d <= end:
        out.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)
    return out

def sample_game_dates(num_games, pool):
    """Pick num_games distinct dates from pool, sorted. Simulates which nights a player actually played."""
    if num_games >= len(pool):
        return sorted(pool[:num_games])
    return sorted(random.sample(pool, num_games))

def tier_stats(tier):
    """tier: 0=superstar, 1=star, 2=starter, 3=rotation, 4=bench"""
    if tier == 0:
        return {"pts": random.uniform(26, 34), "reb": random.uniform(6, 12), "ast": random.uniform(5, 10),
                "stl": random.uniform(1, 1.8), "blk": random.uniform(0.3, 1.2), "tov": random.uniform(2.5, 4),
                "fgm": random.uniform(9, 13), "fga": random.uniform(18, 25), "ftm": random.uniform(4, 8), "fta": random.uniform(5, 10),
                "threes": random.uniform(1.5, 4)}
    if tier == 1:
        return {"pts": random.uniform(18, 26), "reb": random.uniform(4, 9), "ast": random.uniform(3, 7),
                "stl": random.uniform(0.7, 1.4), "blk": random.uniform(0.2, 1), "tov": random.uniform(1.8, 3),
                "fgm": random.uniform(6, 10), "fga": random.uniform(13, 20), "ftm": random.uniform(2, 6), "fta": random.uniform(3, 7),
                "threes": random.uniform(1, 3)}
    if tier == 2:
        return {"pts": random.uniform(12, 18), "reb": random.uniform(3, 7), "ast": random.uniform(2, 5),
                "stl": random.uniform(0.5, 1.2), "blk": random.uniform(0.2, 0.8), "tov": random.uniform(1.2, 2.2),
                "fgm": random.uniform(4, 7), "fga": random.uniform(9, 14), "ftm": random.uniform(1, 4), "fta": random.uniform(1.5, 5),
                "threes": random.uniform(0.5, 2)}
    if tier == 3:
        return {"pts": random.uniform(6, 12), "reb": random.uniform(2, 5), "ast": random.uniform(1, 3),
                "stl": random.uniform(0.3, 0.9), "blk": random.uniform(0.1, 0.5), "tov": random.uniform(0.8, 1.5),
                "fgm": random.uniform(2, 5), "fga": random.uniform(5, 10), "ftm": random.uniform(0.5, 2), "fta": random.uniform(1, 3),
                "threes": random.uniform(0.2, 1.2)}
    # tier 4 bench
    return {"pts": random.uniform(2, 7), "reb": random.uniform(1, 4), "ast": random.uniform(0.5, 2),
            "stl": random.uniform(0.1, 0.6), "blk": random.uniform(0, 0.4), "tov": random.uniform(0.3, 1),
            "fgm": random.uniform(0.8, 3), "fga": random.uniform(2, 7), "ftm": random.uniform(0, 1.5), "fta": random.uniform(0, 2),
            "threes": random.uniform(0, 0.8)}

def avg_to_season_row(name, team, gp, avg):
    row = {"name": name, "team": team, "gp": gp}
    for k in ["pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "ftm", "fta", "threes"]:
        row[k] = round(avg.get(k, 0), 1)
    return row

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing 30
    players_path = OUTPUT_DIR / "players.json"
    existing = []
    if players_path.exists():
        with open(players_path, "r") as f:
            existing = json.load(f)
    existing = existing[:30]

    # Build 270 more: assign team round-robin, tier distribution
    extra_names_list = all_extra_names(270)
    team_index = 0
    new_players = []
    for i, name in enumerate(extra_names_list):
        team = TEAMS[team_index % len(TEAMS)]
        team_index += 1
        # tier: ~5% superstar, ~15% star, ~35% starter, ~30% rotation, ~15% bench
        r = random.random()
        if r < 0.05: tier = 0
        elif r < 0.20: tier = 1
        elif r < 0.55: tier = 2
        elif r < 0.85: tier = 3
        else: tier = 4
        avg = tier_stats(tier)
        gp = random.randint(40, 82)
        new_players.append(avg_to_season_row(name, team, gp, avg))

    players_list = existing + new_players
    assert len(players_list) >= 300, "Expected 300 players"
    players_list = players_list[:300]

    with open(OUTPUT_DIR / "players.json", "w") as f:
        json.dump(players_list, f, indent=2)

    # Game logs: full season — each player gets gp games on random dates in season range
    season_dates = full_season_dates()
    game_logs = []
    for p in players_list:
        name = p["name"]
        team = p["team"]
        gp = int(p.get("gp", 65))
        gp = max(1, min(gp, len(season_dates)))
        avg = {k: p[k] for k in ["pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "ftm", "fta", "threes"]}
        dates = sample_game_dates(gp, season_dates)
        games = [one_game_from_avg(avg, d) for d in dates]
        game_logs.append({"name": name, "team": team, "games": games})

    with open(OUTPUT_DIR / "game-logs.json", "w") as f:
        json.dump(game_logs, f, indent=2)

    total_games = sum(len(g["games"]) for g in game_logs)
    print("Wrote", OUTPUT_DIR / "players.json", "with", len(players_list), "players")
    print("Wrote", OUTPUT_DIR / "game-logs.json", "with", len(game_logs), "players,", total_games, "total games (full season)")

if __name__ == "__main__":
    main()
