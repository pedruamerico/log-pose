# Log Pose

Post-format Windows app installer. You reinstall the OS, run Log Pose, and the
programs you always end up needing are queued and installed in one place — fast.

Companion app for the **Only OS** Windows build, but it runs on any normal
Windows 11 install.

## Stack

Electron 33 · Vite 6 · React 18. No backend service — the renderer talks to the
main process over a context-isolated IPC bridge (`window.onlyOS.*`).

## What it does

- **Apps** — one-click installs via `winget` (curated catalogue) plus a few apps
  not on winget (NVIDIA App, AMD Adrenalin, WhatsApp, DirectX) downloaded straight
  from the vendor. FIFO queue, live stdout/stderr log, install / uninstall /
  upgrade / full wipe (uninstall + leftover folders).
- **Tweaks** — post-install performance/privacy toggles wired to real registry /
  powercfg / DISM operations, plus a one-switch Game Mode.
- **System** — real hardware info, a startup-programs manager (reversible, same
  store Task Manager uses), and maintenance actions (clear temp, flush DNS,
  SFC + DISM repair, restore point).
- **Features** — lists Windows components removed by the Only OS image and lets
  you restore any back via DISM. (No-op on a normal Windows install.)
- Command palette (`Ctrl+K`), system tray, pt-BR / en, auto-update.

## Dev

```powershell
npm install
npm run dev   # vite + electron (dev-launch)
```

> Gotcha: if you see `Cannot read properties of undefined (reading 'whenReady')`,
> the env var `ELECTRON_RUN_AS_NODE=1` is set in your shell — electron.exe is
> running as plain Node. Clear it: `$env:ELECTRON_RUN_AS_NODE=$null`.

## Build

```powershell
npm run build            # NSIS installer + portable -> dist-app/
npm run build:portable   # portable only
```

Artifacts: `LogPose-Setup.exe`, `LogPose-portable.exe`.

## Layout

- `electron/main.js` — main process. All IPC handlers (winget, DISM, registry
  tweaks, maintenance, startup, hardware, auto-update).
- `electron/preload.js` — context-isolated bridge. Renderer only sees
  `window.onlyOS.*`.
- `src/App.jsx` — renderer (React). `src/data.js` — app catalogue + tweak
  definitions. `src/i18n.js` — pt-BR / en strings.

Security model: `contextIsolation` on, `nodeIntegration` off, `sandbox` off (the
main process needs `child_process` to drive winget/DISM). The renderer has no
direct Node access.

## License

MIT.
