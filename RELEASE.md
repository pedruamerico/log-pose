# Releasing Log Pose

Auto-update is wired via `electron-updater` reading GitHub Releases from this
repo, **`pedruamerico/log-pose`** (public). Installed clients check it on launch
and self-update.

## Cut a new release

1. Make your code changes.
2. Bump the version in `package.json` (`version` field), e.g. `0.2.0` → `0.3.0`.
3. Publish (PowerShell):

   ```powershell
   cd D:\code\logpose
   $env:ELECTRON_RUN_AS_NODE=$null
   $env:GH_TOKEN=(gh auth token)
   npm run publish
   ```

   Git Bash equivalent:

   ```bash
   cd /d/code/logpose
   unset ELECTRON_RUN_AS_NODE
   export GH_TOKEN=$(gh auth token)
   npm run publish
   ```

This builds the renderer (Vite), packages with electron-builder (NSIS + portable),
and uploads `LogPose-Setup.exe`, `LogPose-portable.exe`, `.blockmap`, and
`latest.yml` to a new GitHub release tagged `v<ver>`.

## How clients update

- On launch, the app calls `autoUpdater.checkForUpdatesAndNotify()` (packaged builds only).
- It reads `latest.yml` from the releases repo; if a newer version exists it
  downloads in the background and installs on next restart.
- The Options tab shows "Update available" + "Restart & install" when ready.

## Notes

- Builds are **unsigned** → first run shows SmartScreen "unknown publisher".
  Client clicks "More info → Run anyway". A code-signing cert removes this (deferred).
- Dev runs (`npm run dev`) never auto-update — only packaged builds do.
- The `GH_TOKEN` comes from the authenticated `gh` CLI; no token is stored in the repo.
