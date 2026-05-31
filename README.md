# Log Pose

Post-format Windows utility. You reinstall Windows, run Log Pose, and the
programs you always end up needing are installed in one place — fast. Plus
AppX debloat, performance/privacy tweaks, and a startup manager.

Standalone app for **any Windows 11 install** — no dependency on any specific
build or image.

## Stack

Tauri 2 · Vite 6 · React 18. The Rust backend (`src-tauri/`) drives winget,
DISM, the registry and powercfg; the React renderer talks to it over a
context-isolated bridge (`window.onlyOS.*`, see `src/bridge.js`) backed by Tauri
`invoke()` + `Channel`. The UI runs in the system WebView2 (already on Win11) —
no bundled browser, so the installer is ~5 MB.

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

Prereqs: Rust (`rustup`, MSVC toolchain) and the Windows WebView2 runtime.

```powershell
npm install
npm run dev      # tauri dev — vite + the Rust app, hot-reloads both
```

Dev builds run un-elevated (`asInvoker`), so registry/DISM tweaks will no-op —
test those from a packaged (elevated) build.

## Build

```powershell
npm run build    # tauri build — NSIS installer -> src-tauri/target/release/bundle/nsis/
```

Release builds embed a `requireAdministrator` manifest (the app must be elevated
for the tweaks to work). See [RELEASE.md](RELEASE.md) for signing + publishing.

## Layout

- `src-tauri/src/` — Rust backend, one module per area: `winget`, `tweaks`,
  `appx` (debloat), `system`, `startup`, `ops` (wipe/maintenance/dism),
  `download`, `app_ui` (tray/settings/updater), `util` (process streaming).
- `src-tauri/tauri.conf.json` — window, bundle, updater config. `build.rs` —
  embeds the elevation manifest.
- `src/App.jsx` — renderer (React). `src/bridge.js` — the `window.onlyOS.*`
  shim over Tauri. `src/data.js` — app catalogue + debloat + tweak definitions.
  `src/i18n.js` — pt-BR / en strings.

Security model: the renderer has no direct Node/OS access; every privileged
action goes through a named, input-validated Rust command.

## License

MIT.
