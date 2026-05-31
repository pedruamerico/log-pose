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

// Names currently present on this machine: AppX package names (e.g.
// "Microsoft.BingWeather") plus the SHORT name of any installed Windows
// capability (e.g. "Recall" from "Recall~~~~0.0.1.0"). The Features catalog
// matches its entries (AppX by exact name, Capability by short name) against
// this set to decide present vs. removed. Capability short name = the part
// before the first '~', so the catalog can use "Recall" without the version.
#[tauri::command]
pub fn appx_list() -> Value {
    let out = util::powershell("Get-AppxPackage | ForEach-Object { $_.Name }");
    let mut installed: Vec<String> = out
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();

    // Installed capabilities, reduced to their short name (before the first '~').
    let caps = util::powershell(
        "Get-WindowsCapability -Online | Where-Object State -eq 'Installed' | ForEach-Object { ($_.Name -split '~')[0] }",
    );
    for line in caps.lines() {
        let short = line.trim();
        if !short.is_empty() {
            installed.push(short.to_string());
        }
    }

    json!({ "ok": true, "installed": installed })
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
