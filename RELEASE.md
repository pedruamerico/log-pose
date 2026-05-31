# Releasing Log Pose

Auto-update is wired via `tauri-plugin-updater` reading GitHub Releases from this
repo, **`pedruamerico/log-pose`** (public). Installed clients check it on launch
and self-update. Updates are **signed** with a minisign keypair — the public key
is in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`); the private key is
kept **outside the repo** at `~/.tauri/log-pose.key` (never commit it).

## Cut a new release

1. Make your code changes.
2. Bump the version in both `package.json` and `src-tauri/tauri.conf.json`
   (`version` field), e.g. `0.2.0` → `0.3.0`.
3. Build signed artifacts (PowerShell):

   ```powershell
   cd D:\code\win\log-pose
   $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$HOME\.tauri\log-pose.key" -Raw
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
   npm run build
   ```

   Output lands in `src-tauri/target/release/bundle/nsis/`:
   - `Log Pose_<ver>_x64-setup.exe` — the installer
   - `Log Pose_<ver>_x64-setup.exe.sig` — the updater signature

4. Create the GitHub release tagged `v<ver>` and upload:
   - the installer **renamed to `LogPose-Setup.exe`** (the only-os-playbook's
     `logpose.yml` downloads that exact asset name), and
   - a `latest.json` manifest (below).

## latest.json

The updater endpoint is
`https://github.com/pedruamerico/log-pose/releases/latest/download/latest.json`.
Upload a `latest.json` alongside the installer:

```json
{
  "version": "0.3.0",
  "notes": "What changed",
  "pub_date": "2026-05-31T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "<contents of the .sig file>",
      "url": "https://github.com/pedruamerico/log-pose/releases/download/v0.3.0/LogPose-Setup.exe"
    }
  }
}
```

`signature` is the literal text inside the generated `.exe.sig` file.

## How clients update

- On launch (packaged builds only), the app checks the endpoint, and if a newer
  signed version exists it downloads + installs in the background.
- The Options tab shows "Update available" + "Restart & install" when ready.

## Notes

- The app ships with a **requireAdministrator** manifest (release builds), so it
  always runs elevated — required for the registry/DISM/winget tweaks to work.
- Builds are **unsigned by Authenticode** → first run shows SmartScreen "unknown
  publisher". Client clicks "More info → Run anyway". A code-signing cert removes
  this (deferred). The minisign signing above is for the *updater*, separate from
  Authenticode.
- Dev runs (`npm run dev`) never auto-update and run un-elevated (asInvoker).
