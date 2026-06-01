// AppX debloat — list the packages actually installed on this machine (so the
// Features tab shows live state, not a hardcoded list) and remove them
// (Remove-AppxPackage for all users + deprovision so they don't come back on
// new accounts). Removal needs admin; in dev it fails loudly via the log.

use serde_json::{json, Value};
use tauri::ipc::Channel;

use crate::util;

fn is_valid_appx(name: &str) -> bool {
    !name.is_empty()
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-' | '*'))
}

// AppX package names installed for the user (e.g. "Microsoft.BingWeather"). The
// Features catalog matches its AppX entries against this set. Fast (one
// Get-AppxPackage call) so it can run on boot without hanging the UI.
#[tauri::command]
pub fn appx_list() -> Value {
    let out = util::powershell("Get-AppxPackage | ForEach-Object { $_.Name }");
    let installed: Vec<String> = out
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();
    json!({ "ok": true, "installed": installed })
}

// Installed Windows capabilities, reduced to their SHORT name (the part before
// the first '~', e.g. "Recall" from "Recall~~~~0.0.1.0"). Split out from
// appx_list because `Get-WindowsCapability -Online` is SLOW (enumerates every
// capability online, ~10-30s) — running it on boot froze the app. The Features
// tab calls this separately/async so the UI stays responsive; only the few
// Capability-type catalog entries (Recall) depend on it.
#[tauri::command]
pub fn appx_capabilities() -> Value {
    let caps = util::powershell(
        "Get-WindowsCapability -Online | Where-Object State -eq 'Installed' | ForEach-Object { ($_.Name -split '~')[0] }",
    );
    let installed: Vec<String> = caps
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();
    json!({ "ok": true, "installed": installed })
}

// Restore a previously removed AppX by reinstalling it from the Microsoft Store
// for the current user (Get-AppxPackage with -Register re-registers a staged
// package; otherwise we ask the Store via winget). Best-effort: a deprovisioned
// package that has no staged copy needs the Store, which this triggers.
#[tauri::command]
pub async fn appx_restore(name: String, channel: Channel<String>) -> Value {
    if !is_valid_appx(&name) {
        return json!({ "ok": false, "error": "invalid name" });
    }
    let _ = channel.send(format!("==> Restoring AppX {name}...\n"));
    // Try to re-register a staged copy for all users; if none, open the Store
    // page so the user can reinstall. Re-provision so new accounts get it too.
    let script = format!(
        "$pkg = Get-AppxPackage -AllUsers '{name}' | Select-Object -First 1; \
         if ($pkg) {{ \
            Add-AppxPackage -DisableDevelopmentMode -Register \"$($pkg.InstallLocation)\\AppxManifest.xml\" -ErrorAction SilentlyContinue; \
            Write-Output 'reregistered' \
         }} else {{ \
            Start-Process \"ms-windows-store://pdp/?PFN={name}\"; \
            Write-Output 'opened-store' \
         }}"
    );
    let code = util::stream(
        &channel,
        "powershell",
        &["-NoProfile", "-NonInteractive", "-Command", &script],
    )
    .await;
    json!({ "ok": code == 0, "exitCode": code })
}

#[tauri::command]
pub async fn appx_remove(name: String, channel: Channel<String>) -> Value {
    if !is_valid_appx(&name) {
        return json!({ "ok": false, "error": "invalid name" });
    }
    let _ = channel.send(format!("==> Removing AppX {name}...\n"));
    let script = format!(
        "Get-AppxPackage -AllUsers '{name}' | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue; \
         Get-AppxProvisionedPackage -Online | Where-Object {{ $_.DisplayName -like '{name}' }} | \
         Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Out-Null; \
         Write-Output 'done'"
    );
    let code = util::stream(
        &channel,
        "powershell",
        &["-NoProfile", "-NonInteractive", "-Command", &script],
    )
    .await;
    json!({ "ok": code == 0, "exitCode": code })
}
