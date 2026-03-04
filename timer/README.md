# HIIT Timer

A simple web app for High-Intensity Interval Training (HIIT) workouts.

## Features

- **Work** and **Rest** intervals (configurable in seconds)
- **Rounds** – number of work/rest cycles
- Countdown display with clear **WORK** / **REST** phases
- Sound cues when switching phases and when the workout is complete
- Start, Pause, and Reset controls

## How to run

Open `index.html` in a browser (double-click or drag into a window). For local development with a simple server:

```bash
# Python 3
python3 -m http.server 8080

# or npx
npx serve .
```

Then visit `http://localhost:8080` (or the port shown).

## Usage

1. Set **Work** (e.g. 30 sec), **Rest** (e.g. 15 sec), and **Rounds** (e.g. 8).
2. Press **Start** to begin. You’ll hear a beep at each phase change.
3. Use **Pause** to pause and **Resume** to continue.
4. Use **Reset** to stop and return to the initial settings.

Settings are locked once the timer has started; use **Reset** to change them again.
