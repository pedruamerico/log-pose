# Releasing Log Pose

Auto-update is wired via `electron-updater` reading GitHub Releases from this
repo, **`pedruamerico/log-pose`** (public). Installed clients check it on launch
and self-update. `electron-builder` generates the update manifest (`latest.yml`)
and a block map alongside the installer; no separate signing key is involved.

## Cut a new release

1. Make your code changes.
2. Bump the `version` field in `package.json`, e.g. `1.4.0` → `1.5.0`.
3. Build + publish the draft release (PowerShell):

   ```powershell
   cd D:\code\log-pose
   $env:GH_TOKEN = "<a GitHub token with repo scope>"
   npm run publish      # vite build + electron-builder --win --publish always
   ```

   This uploads a **draft** GitHub release with:
   - `LogPose-Setup.exe` — the installer (NSIS, one-click, per-machine)
   - `LogPose-Setup.exe.blockmap` — used for differential downloads
   - `latest.yml` — the `electron-updater` manifest (version + sha512 + url)

4. On GitHub, edit the draft release, confirm the tag is `v<ver>`, and
   **publish** it. The only-os-playbook's `logpose.yml` downloads the asset named
   exactly `LogPose-Setup.exe`, so don't rename it.

## How clients update

- On launch (packaged builds only), `electron-updater` checks the release feed,
  and if a newer version exists it downloads it in the background.
- The Options tab shows "Update available" + "Restart & install" when ready
  (`update:available` / `update:ready` IPC events from `electron/main.js`).

## Notes

- The app ships with a **requireAdministrator** manifest (`build.win.
  requestedExecutionLevel`), so it always runs elevated — required for the
  registry/DISM/winget tweaks to work.
- Builds are **unsigned by Authenticode** → first run shows SmartScreen "unknown
  publisher". Client clicks "More info → Run anyway". A code-signing cert removes
  this (deferred). `electron-updater` still validates updates against the sha512
  in `latest.yml`, so unsigned auto-update works.
- Dev runs (`npm run dev`) never auto-update and run un-elevated (asInvoker).
- A local-only build that skips publishing: `npm run build` (or
  `npm run build:portable` for a portable .exe). Output lands in `dist-app\`.
