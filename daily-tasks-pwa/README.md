# Daily Tasks PWA

A beautiful daily task manager that resets every morning.

## Features
- ✅ Daily reset — tasks clear at midnight
- 🔁 Missed task carry-over — prompts you to bring unfinished tasks forward
- 🙌 High five celebration when all tasks are done
- 📴 Works offline (via service worker)
- 📲 Installable to iPhone home screen

---

## How to Deploy (GitHub Pages — Free & Easy)

### Step 1: Create a GitHub account
Go to https://github.com and sign up (free).

### Step 2: Create a new repository
1. Click the **+** icon → **New repository**
2. Name it: `daily-tasks`
3. Set it to **Public**
4. Click **Create repository**

### Step 3: Upload your files
1. Click **uploading an existing file**
2. Drag and drop ALL files in this folder:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icons/` folder (both icon files)
3. Click **Commit changes**

### Step 4: Enable GitHub Pages
1. Go to your repo's **Settings** tab
2. Click **Pages** in the left sidebar
3. Under "Source", select **Deploy from a branch**
4. Set Branch to **main**, folder to **/ (root)**
5. Click **Save**

### Step 5: Get your URL
After ~1 minute, your app will be live at:
`https://YOUR-USERNAME.github.io/daily-tasks`

---

## Add to iPhone Home Screen
1. Open your URL in **Safari** on iPhone
2. Tap the **Share** button (box with arrow)
3. Scroll down → tap **"Add to Home Screen"**
4. Tap **Add**

Your app now lives on your home screen, launches full-screen, and works offline! 🎉

---

## How It Works
- Tasks are stored in your browser's `localStorage` — private to your device
- Each new day, incomplete tasks are saved as "yesterday's" and you're prompted to carry them over
- The service worker (`sw.js`) caches the app so it loads instantly, even with no internet
