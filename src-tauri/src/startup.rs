// Startup programs — enumerate the HKCU/HKLM Run keys and report each entry's
// enabled state from the same StartupApproved store Task Manager uses, so
// toggles here are reversible and consistent with the built-in UI.

use serde_json::{json, Value};
use winreg::enums::*;
use winreg::{RegKey, RegValue};

use crate::util;

#[tauri::command]
pub fn startup_list() -> Value {
    let ps = r#"
$ErrorActionPreference='SilentlyContinue'
$runKeys = @(
  @{ hive='HKCU'; path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' },
  @{ hive='HKLM'; path='HKLM:\Software\Microsoft\Windows\CurrentVersion\Run' }
)
$approved = @{
  HKCU='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'
  HKLM='HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'
}
$items = @()
foreach($k in $runKeys){
  $props = Get-ItemProperty -Path $k.path
  if(-not $props){ continue }
  foreach($p in $props.PSObject.Properties){
    if($p.Name -like 'PS*'){ continue }
    $enabled = $true
    $a = Get-ItemProperty -Path $approved[$k.hive] -Name $p.Name -ErrorAction SilentlyContinue
    if($a){ $b = $a.$($p.Name); if($b -and ($b[0] -band 1)){ $enabled = $false } }
    $items += [pscustomobject]@{ name=$p.Name; command=[string]$p.Value; hive=$k.hive; enabled=$enabled }
  }
}
ConvertTo-Json -InputObject @($items) -Compress -Depth 4
"#;

    let out = util::powershell(ps);
    let parsed: Value = serde_json::from_str(if out.is_empty() { "[]" } else { &out })
        .unwrap_or_else(|_| json!([]));
    let items = match parsed {
        Value::Array(a) => Value::Array(a),
        other => json!([other]),
    };
    json!({ "ok": true, "items": items })
}

// Enable/disable a Run entry by writing the StartupApproved binary flag
// (byte0 = 0x02 enabled, 0x03 disabled — bit0 marks disabled). 12-byte blob.
#[tauri::command]
pub fn startup_set(name: String, hive: String, enabled: bool) -> Value {
    if name.is_empty() || (hive != "HKCU" && hive != "HKLM") {
        return json!({ "ok": false, "error": "bad args" });
    }
    let root = if hive == "HKCU" {
        RegKey::predef(HKEY_CURRENT_USER)
    } else {
        RegKey::predef(HKEY_LOCAL_MACHINE)
    };
    let sub = r"Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run";
    let mut bytes = vec![0u8; 12];
    bytes[0] = if enabled { 0x02 } else { 0x03 };

    let result = root.create_subkey(sub).and_then(|(key, _)| {
        key.set_raw_value(
            &name,
            &RegValue {
                vtype: REG_BINARY,
                bytes,
            },
        )
    });
    match result {
        Ok(_) => json!({ "ok": true }),
        Err(e) => json!({ "ok": false, "error": e.to_string() }),
    }
}
