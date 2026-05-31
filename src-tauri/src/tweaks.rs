// Tweaks — real registry / powercfg / dism toggles. Registry writes use the
// winreg crate (native, with real Result errors — fixes the old silent
// `() => res()` swallow); powercfg/dism still shell out. Each tweak has an
// on/off op list plus a status probe. Faithful port of the old TWEAKS map.

use std::io::ErrorKind;

use serde_json::{json, Value};
use winreg::enums::*;
use winreg::RegKey;

use crate::util;

const DEF: &str = r"HKLM\SOFTWARE\Policies\Microsoft\Windows Defender";
const DEFRT: &str = r"HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection";
const SYS: &str = r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System";
const SVC: &str = r"HKLM\SYSTEM\CurrentControlSet\Services";
const GRAPHICS: &str = r"HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers";
const GAMEDVR: &str = r"HKCU\System\GameConfigStore";
const DEVGUARD: &str = r"HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard";
const WUX: &str = r"HKLM\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings";
// AI policy keys (25H2). WinAI is the per-user Windows AI policy hive.
const COPILOT: &str = r"HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot";
const WINAI: &str = r"HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsAI";
const EXPLORER_POL: &str = r"HKCU\SOFTWARE\Policies\Microsoft\Windows\Explorer";

// --- registry helpers (winreg) ----------------------------------------------

fn root(hive: &str) -> Option<RegKey> {
    match hive {
        "HKLM" => Some(RegKey::predef(HKEY_LOCAL_MACHINE)),
        "HKCU" => Some(RegKey::predef(HKEY_CURRENT_USER)),
        _ => None,
    }
}

fn split_hive(full: &str) -> Option<(RegKey, &str)> {
    let (hive, sub) = full.split_once('\\')?;
    Some((root(hive)?, sub))
}

fn set_dword(full: &str, name: &str, val: u32) -> Result<(), String> {
    let (root, sub) = split_hive(full).ok_or("bad path")?;
    let (key, _) = root.create_subkey(sub).map_err(|e| e.to_string())?;
    key.set_value(name, &val).map_err(|e| e.to_string())
}

fn set_sz(full: &str, name: &str, val: &str) -> Result<(), String> {
    let (root, sub) = split_hive(full).ok_or("bad path")?;
    let (key, _) = root.create_subkey(sub).map_err(|e| e.to_string())?;
    key.set_value(name, &val.to_string()).map_err(|e| e.to_string())
}

// Deleting an absent value (or key) is success — matches `reg delete /f`.
fn del_value(full: &str, name: &str) -> Result<(), String> {
    let (root, sub) = match split_hive(full) {
        Some(v) => v,
        None => return Err("bad path".into()),
    };
    match root.open_subkey_with_flags(sub, KEY_SET_VALUE) {
        Ok(key) => match key.delete_value(name) {
            Ok(_) => Ok(()),
            Err(e) if e.kind() == ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e.to_string()),
        },
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

fn read_dword(full: &str, name: &str) -> Option<u32> {
    let (root, sub) = split_hive(full)?;
    let key = root.open_subkey(sub).ok()?;
    key.get_value::<u32, _>(name).ok()
}

fn value_exists(full: &str, name: &str) -> bool {
    if let Some((root, sub)) = split_hive(full) {
        if let Ok(key) = root.open_subkey(sub) {
            return key.get_value::<u32, _>(name).is_ok()
                || key.get_value::<String, _>(name).is_ok();
        }
    }
    false
}

// powercfg/dism via cmd. dism returns 3010 on success-needs-reboot.
fn run_cmd(c: &str) -> Result<(), String> {
    let (out, code) = util::run_capture("cmd", &["/c", c]);
    if code == 0 || code == 3010 {
        Ok(())
    } else {
        Err(format!("exit {code}: {}", out.trim()))
    }
}

fn svc(name: &str) -> String {
    format!("{SVC}\\{name}")
}

// --- tweak_set --------------------------------------------------------------

fn needs_reboot(id: &str) -> bool {
    matches!(id, "defender" | "hags" | "vbs" | "wsl")
}

#[tauri::command]
pub fn tweak_set(id: String, enabled: bool) -> Value {
    let mut errs: Vec<String> = Vec::new();
    let mut push = |r: Result<(), String>| {
        if let Err(e) = r {
            errs.push(e);
        }
    };

    match id.as_str() {
        "defender" => {
            if enabled {
                push(del_value(DEF, "DisableAntiSpyware"));
                push(del_value(DEF, "DisableAntiVirus"));
                push(del_value(DEFRT, "DisableRealtimeMonitoring"));
                push(del_value(DEFRT, "DisableBehaviorMonitoring"));
                push(del_value(DEFRT, "DisableOnAccessProtection"));
                push(set_dword(&svc("WinDefend"), "Start", 2));
                push(set_dword(&svc("WdNisSvc"), "Start", 3));
                push(set_dword(&svc("Sense"), "Start", 3));
                push(set_dword(&svc("SecurityHealthService"), "Start", 2));
            } else {
                push(set_dword(DEF, "DisableAntiSpyware", 1));
                push(set_dword(DEF, "DisableAntiVirus", 1));
                push(set_dword(DEFRT, "DisableRealtimeMonitoring", 1));
                push(set_dword(DEFRT, "DisableBehaviorMonitoring", 1));
                push(set_dword(DEFRT, "DisableOnAccessProtection", 1));
                push(set_dword(&svc("WinDefend"), "Start", 4));
                push(set_dword(&svc("WdNisSvc"), "Start", 4));
                push(set_dword(&svc("Sense"), "Start", 4));
                push(set_dword(&svc("SecurityHealthService"), "Start", 4));
            }
        }
        "uac" => {
            let v = if enabled { 5 } else { 0 };
            push(set_dword(SYS, "ConsentPromptBehaviorAdmin", v));
            push(set_dword(SYS, "PromptOnSecureDesktop", if enabled { 1 } else { 0 }));
        }
        "auto-update" => {
            let keys = [
                "PauseUpdatesStartTime",
                "PauseUpdatesExpiryTime",
                "PauseFeatureUpdatesStartTime",
                "PauseFeatureUpdatesEndTime",
                "PauseQualityUpdatesStartTime",
                "PauseQualityUpdatesEndTime",
            ];
            if enabled {
                for k in keys {
                    push(del_value(WUX, k));
                }
            } else {
                let start = "2024-01-01T00:00:00Z";
                let end = "2077-01-01T00:00:00Z";
                push(set_sz(WUX, "PauseUpdatesStartTime", start));
                push(set_sz(WUX, "PauseUpdatesExpiryTime", end));
                push(set_sz(WUX, "PauseFeatureUpdatesStartTime", start));
                push(set_sz(WUX, "PauseFeatureUpdatesEndTime", end));
                push(set_sz(WUX, "PauseQualityUpdatesStartTime", start));
                push(set_sz(WUX, "PauseQualityUpdatesEndTime", end));
            }
        }
        "hags" => push(set_dword(GRAPHICS, "HwSchMode", if enabled { 2 } else { 1 })),
        "gamedvr" => push(set_dword(GAMEDVR, "GameDVR_Enabled", if enabled { 1 } else { 0 })),
        "vbs" => push(set_dword(
            DEVGUARD,
            "EnableVirtualizationBasedSecurity",
            if enabled { 1 } else { 0 },
        )),
        "ultimate-power" => {
            if enabled {
                push(run_cmd("powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 >nul 2>&1 & for /f \"tokens=4\" %a in ('powercfg /list ^| findstr /i \"Ultimate\"') do powercfg /setactive %a"));
            } else {
                push(run_cmd("powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e"));
            }
        }
        "wsl" => {
            let feats = [
                "Microsoft-Windows-Subsystem-Linux",
                "VirtualMachinePlatform",
                "HypervisorPlatform",
            ];
            let verb = if enabled { "Enable" } else { "Disable" };
            for f in feats {
                push(run_cmd(&format!(
                    "dism /Online /{verb}-Feature /FeatureName:{f} /NoRestart /Quiet"
                )));
            }
        }
        // AI policies: `enabled` = apply the policy that DISABLES the AI feature;
        // disabling the toggle removes the policy (restores the Windows default).
        "copilot-off" => {
            if enabled {
                push(set_dword(COPILOT, "TurnOffWindowsCopilot", 1));
            } else {
                push(del_value(COPILOT, "TurnOffWindowsCopilot"));
            }
        }
        "recall-off" => {
            if enabled {
                push(set_dword(WINAI, "DisableAIDataAnalysis", 1));
                push(set_dword(WINAI, "AllowRecallEnablement", 0));
            } else {
                push(del_value(WINAI, "DisableAIDataAnalysis"));
                push(del_value(WINAI, "AllowRecallEnablement"));
            }
        }
        "ai-cocreator-off" => {
            if enabled {
                push(set_dword(WINAI, "DisableImageCreator", 1));
                push(set_dword(WINAI, "DisableCocreator", 1));
                push(set_dword(WINAI, "DisableGenerativeFill", 1));
                push(set_dword(WINAI, "DisableTextGeneration", 1));
            } else {
                push(del_value(WINAI, "DisableImageCreator"));
                push(del_value(WINAI, "DisableCocreator"));
                push(del_value(WINAI, "DisableGenerativeFill"));
                push(del_value(WINAI, "DisableTextGeneration"));
            }
        }
        "web-search-off" => {
            if enabled {
                push(set_dword(EXPLORER_POL, "DisableSearchBoxSuggestions", 1));
            } else {
                push(del_value(EXPLORER_POL, "DisableSearchBoxSuggestions"));
            }
        }
        _ => return json!({ "ok": false, "error": "unknown tweak" }),
    }

    if errs.is_empty() {
        json!({ "ok": true, "needsReboot": needs_reboot(&id) })
    } else {
        json!({ "ok": false, "needsReboot": needs_reboot(&id), "error": errs.join("; ") })
    }
}

// --- tweak_status -----------------------------------------------------------

#[tauri::command]
pub fn tweak_status(ids: Vec<String>) -> Value {
    let mut result = serde_json::Map::new();
    for id in ids {
        let on: Option<bool> = match id.as_str() {
            // present (WinDefend service key still has Start) => Defender exists => on
            "defender" => Some(value_exists(&svc("WinDefend"), "Start")),
            "uac" => Some(read_dword(SYS, "PromptOnSecureDesktop") == Some(1)),
            // on only when the pause expiry is absent
            "auto-update" => Some(!value_exists(WUX, "PauseUpdatesExpiryTime")),
            "hags" => Some(read_dword(GRAPHICS, "HwSchMode") == Some(2)),
            "gamedvr" => Some(read_dword(GAMEDVR, "GameDVR_Enabled") == Some(1)),
            "vbs" => Some(read_dword(DEVGUARD, "EnableVirtualizationBasedSecurity") == Some(1)),
            "ultimate-power" => {
                let (out, _) = util::run_capture("powercfg", &["/getactivescheme"]);
                Some(out.contains("Ultimate"))
            }
            "wsl" => {
                let out = util::powershell(
                    "(Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux).State",
                );
                Some(out.contains("Enabled"))
            }
            // AI toggles report "on" when the disabling policy is in place.
            "copilot-off" => Some(read_dword(COPILOT, "TurnOffWindowsCopilot") == Some(1)),
            "recall-off" => Some(read_dword(WINAI, "DisableAIDataAnalysis") == Some(1)),
            "ai-cocreator-off" => Some(read_dword(WINAI, "DisableCocreator") == Some(1)),
            "web-search-off" => Some(read_dword(EXPLORER_POL, "DisableSearchBoxSuggestions") == Some(1)),
            _ => None,
        };
        result.insert(
            id,
            match on {
                Some(b) => Value::Bool(b),
                None => Value::Null,
            },
        );
    }
    Value::Object(result)
}
