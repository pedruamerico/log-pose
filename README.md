# Log Pose

Post-format Windows utility. You reinstall Windows, run Log Pose, and the
programs you always end up needing are installed in one place — fast. Plus
AppX debloat, performance/privacy tweaks, and a startup manager.

Standalone app for **any Windows 11 install** — no dependency on any specific
build or image.

## Stack

Electron 33 · Vite 6 · React 18. The main process (`electron/main.js`) drives
winget, DISM, the registry and powercfg via `child_process`; the React renderer
talks to it over a context-isolated preload bridge (`window.onlyOS.*`, see
`electron/preload.js`) backed by Electron IPC. The renderer has no direct Node or
OS access.

## What it does

- **Apps** — one-click installs via `winget` (curated catalogue) plus a few apps
  not on winget (NVIDIA App, AMD Adrenalin, WhatsApp, DirectX) downloaded straight
  from the vendor. Live install/uninstall/upgrade/full-wipe with a streaming log.
- **Features** — live debloat: detects which curated AppX packages are actually
  installed on this machine and removes the ones you don't want (Remove-AppxPackage
  for all users + deprovision).
- **Tweaks** — post-install performance/privacy toggles wired to real registry /
  powercfg / DISM operations (HAGS, Game DVR, VBS, UAC, Windows Update, WSL, …).
- **System** — real hardware info, a startup-programs manager (reversible, same
  store Task Manager uses), and maintenance actions (clear temp, flush DNS,
  SFC + DISM repair, restore point).
- Command palette (`Ctrl+K`), system tray, pt-BR / en, signed auto-update.

## Dev

Prereqs: Node.js (LTS). No native toolchain needed.

```powershell
npm install
npm run dev      # vite dev server + Electron, hot-reloads the renderer
```

Dev runs un-elevated (`asInvoker`), so registry/DISM tweaks will no-op — test
those from a packaged (elevated) build.

## Build

```powershell
npm run build    # vite build + electron-builder NSIS -> dist-app\LogPose-Setup.exe
```

Release builds embed a `requireAdministrator` manifest (the app must be elevated
for the tweaks to work). See [RELEASE.md](RELEASE.md) for publishing.

## Layout

- `electron/main.js` — main process: window/tray, GitHub auto-update, and every
  native IPC handler (`winget` install/list/upgrade/uninstall/wipe, `tweak`
  registry/powercfg toggles, `appx` debloat, `service` Start tweaks, `startup`
  manager, `system`/hardware info, `maintenance` actions, `feature` DISM
  capability add/remove, vendor `download`-and-run).
- `electron/preload.js` — context-isolated bridge exposing `window.onlyOS.*`.
- `electron/dev-launch.js` — launches Electron against the Vite dev server.
- `src/App.jsx` — renderer (React). `src/bridge.js` — no-op import site (the
  bridge is injected by the preload). `src/data.js` — app catalogue + debloat +
  tweak definitions. `src/i18n.js` — pt-BR / en strings.
- `package.json` (`build` field) — electron-builder window/NSIS/updater config,
  including the `requireAdministrator` execution level.

Security model: the renderer runs with `contextIsolation` on and no
`nodeIntegration`; every privileged action goes through a named, input-validated
IPC handler in the main process.

## License

MIT.
