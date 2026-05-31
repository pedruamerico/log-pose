# Releasing Only App

Auto-update is wired via `electron-updater` reading GitHub Releases from
**`pedruamerico/only-os-releases`** (public). Clients on an installed build
check that repo on launch and self-update.

## Cut a new release

1. Make your code changes.
2. Bump the version in `package.json` (`version` field), e.g. `0.1.0` → `0.2.0`.
3. Publish (PowerShell):

   ```powershell
   cd D:\Code\Projetos\only-os\toolbox
   $env:ELECTRON_RUN_AS_NODE=$null
   $env:GH_TOKEN=(gh auth token)
   npm run publish
   ```

   Git Bash equivalent:

   ```bash
   cd /d/Code/Projetos/only-os/toolbox
   unset ELECTRON_RUN_AS_NODE
   export GH_TOKEN=$(gh auth token)
   npm run publish
   ```

This builds the renderer (Vite), packages with electron-builder (NSIS + portable),
and uploads `Only-App-Setup-<ver>.exe`, `OnlyApp-portable.exe`, `.blockmap`, and
`latest.yml` to a new GitHub release tagged `v<ver>`.

## How clients update

- On launch, the app calls `autoUpdater.checkForUpdatesAndNotify()` (packaged builds only).
- It reads `latest.yml` from the releases repo; if a newer version exists it
  downloads in the background and installs on next restart.
- The Options tab shows "Update available" + "Restart & install" when ready.

## Notes

- Builds are **unsigned** → first run shows SmartScreen "unknown publisher".
  Client clicks "More info → Run anyway". Code signing cert removes this (deferred).
- Dev runs (`npm run dev`) never auto-update — only packaged builds do.
- The `GH_TOKEN` comes from the authenticated `gh` CLI; no token is stored in the repo.
