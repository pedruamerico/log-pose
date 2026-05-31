# OnlyOS Toolbox

Post-install companion app for Only OS. Electron-based, dark themed.

## Features

- **Apps tab** — one-click installs via `winget` (Chrome, Discord, Steam, VSCode, Git, Docker, PowerToys, etc).
- **Features tab** — reads `C:\Program Files\OnlyOS\removed-features.json` (manifest written by the ISO pipeline) and lists what was removed per edition.
- **System tab** — shows current edition, manifest status, runtime info.
- **Log drawer** — streams live `winget` stdout/stderr during installs.

## Dev

```powershell
cd D:\Code\Projetos\only-os\toolbox
npm install
$env:ELECTRON_RUN_AS_NODE=$null   # if set, electron.exe runs as plain Node and `app` is undefined
npm start
```

> Gotcha: if you see `Cannot read properties of undefined (reading 'whenReady')`,
> the env var `ELECTRON_RUN_AS_NODE=1` is set in your shell. Clear it (line above).

## Build portable .exe

```powershell
npm run build:portable
# output: dist\OnlyOS Toolbox <version>.exe (single-file portable)
```

## Architecture

- `electron.js` — main process. Owns IPC handlers (`system:info`, `winget:install`).
- `preload.js` — contextIsolation bridge. Renderer only sees `window.onlyOS.*`.
- `src/index.html`, `style.css`, `app.js` — renderer (no React, vanilla DOM).

Security model: contextIsolation on, nodeIntegration off, sandbox off (needed for `child_process` in main). Renderer has zero access to Node APIs directly.
