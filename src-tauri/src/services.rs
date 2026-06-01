// Windows service optimization (reversible) + Core Isolation / Memory Integrity
// status. Each managed service has an "optimized" start type (reduced) and the
// Windows default (restore target). Before reducing a service we back up its
// current Start value under HKLM\SOFTWARE\LogPose\ServiceBackup so we can revert
// faithfully even on a machine that was already tweaked; if no backup exists we
// fall back to the known Windows default. Writes need admin (release elevated).

use serde_json::{json, Value};
use winreg::enums::*;
use winreg::RegKey;

use crate::util;

const SVC_ROOT: &str = r"SYSTEM\CurrentControlSet\Services";
const BACKUP_ROOT: &str = r"SOFTWARE\LogPose\ServiceBackup";

// Start values: 2=Automatic, 3=Manual, 4=Disabled. Returns (optimized, default).
fn targets(name: &str) -> Option<(u32, u32)> {
    Some(match name {
        "SysMain" => (3, 2),
        "WSearch" => (3, 2),
        "Spooler" => (3, 2),
        "Ndu" => (4, 2),
        "Fax" => (4, 3),
        "GpuEnergyDrv" => (4, 3),
        "DiagTrack" => (4, 2),
        "dmwappushservice" => (4, 3),
        _ => return None,
    })
}

fn valid(name: &str) -> bool {
    !name.is_empty() && name.chars().all(|c| c.is_ascii_alphanumeric())
}

fn read_start(name: &str) -> Option<u32> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm.open_subkey(format!("{SVC_ROOT}\\{name}")).ok()?;
    key.get_value::<u32, _>("Start").ok()
}

fn set_start(name: &str, val: u32) -> Result<(), String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm
        .open_subkey_with_flags(format!("{SVC_ROOT}\\{name}"), KEY_SET_VALUE)
        .map_err(|e| e.to_string())?;
    key.set_value("Start", &val).map_err(|e| e.to_string())
}

fn backup_get(name: &str) -> Option<u32> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    hklm.open_subkey(BACKUP_ROOT)
        .ok()?
        .get_value::<u32, _>(name)
        .ok()
}

fn backup_set(name: &str, val: u32) -> Result<(), String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let (key, _) = hklm.create_subkey(BACKUP_ROOT).map_err(|e| e.to_string())?;
    key.set_value(name, &val).map_err(|e| e.to_string())
}

fn backup_del(name: &str) {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(key) = hklm.open_subkey_with_flags(BACKUP_ROOT, KEY_SET_VALUE) {
        let _ = key.delete_value(name);
    }
}

// Per-service: exists, current Start, and whether it's at/below the optimized
// (reduced) state. The UI hides services that don't exist on this machine.
#[tauri::command]
pub async fn service_list(names: Vec<String>) -> Value {
    util::blocking(move || service_list_inner(names)).await
}

fn service_list_inner(names: Vec<String>) -> Value {
    let mut out = serde_json::Map::new();
    for name in names {
        if !valid(&name) {
            continue;
        }
        let entry = match (targets(&name), read_start(&name)) {
            (Some((opt, _)), Some(cur)) => {
                json!({ "exists": true, "start": cur, "optimized": cur >= opt })
            }
            _ => json!({ "exists": false }),
        };
        out.insert(name, entry);
    }
    Value::Object(out)
}

#[tauri::command]
pub fn service_set(name: String, optimized: bool) -> Value {
    if !valid(&name) {
        return json!({ "ok": false, "error": "invalid service" });
    }
    let Some((opt, def)) = targets(&name) else {
        return json!({ "ok": false, "error": "unknown service" });
    };
    if read_start(&name).is_none() {
        return json!({ "ok": false, "error": "service not present" });
    }

    let result = if optimized {
        // Back up the current value once, then reduce.
        if backup_get(&name).is_none() {
            if let Some(cur) = read_start(&name) {
                let _ = backup_set(&name, cur);
            }
        }
        set_start(&name, opt)
    } else {
        // Restore: prefer our own backup, else the known Windows default.
        let target = backup_get(&name).unwrap_or(def);
        let r = set_start(&name, target);
        if r.is_ok() {
            backup_del(&name);
        }
        r
    };

    match result {
        Ok(_) => json!({ "ok": true, "needsReboot": true }),
        Err(e) => json!({ "ok": false, "error": e }),
    }
}

// --- Core Isolation / Memory Integrity (HVCI) -------------------------------
// Read-only posture check. Vanguard (Valorant) requires Memory Integrity ON.
// We DETECT and warn — never force-enable HVCI via registry (a blind Enabled=1
// can BSOD/boot-loop on incompatible drivers; Windows must run its own check).

#[tauri::command]
pub async fn core_isolation_status() -> Value {
    util::blocking(core_isolation_status_inner).await
}

fn core_isolation_status_inner() -> Value {
    // SecurityServicesRunning contains 2 when HVCI is actually running.
    let running = util::powershell(
        "(Get-CimInstance -Namespace root\\Microsoft\\Windows\\DeviceGuard -ClassName Win32_DeviceGuard).SecurityServicesRunning -join ','",
    );
    let hvci_running = running.split(',').any(|s| s.trim() == "2");
    json!({ "ok": true, "hvci": hvci_running })
}

// Open a Windows settings page (Core Isolation, etc.). Allowlisted schemes only.
#[tauri::command]
pub fn open_settings(uri: String) -> Value {
    let allowed = uri.starts_with("ms-settings:") || uri.starts_with("windowsdefender:");
    if !allowed {
        return json!({ "ok": false });
    }
    let _ = std::process::Command::new("explorer.exe").arg(&uri).spawn();
    json!({ "ok": true })
}
