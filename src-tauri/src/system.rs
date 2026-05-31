// system_info (edition/manifest/platform) and hardware (real specs for the
// System tab). Hardware is a faithful port of the old PowerShell CIM query —
// it already returns exactly the fields App.jsx builds its sysRows from.

use serde_json::{json, Value};

use crate::util;

const MANIFEST_PATH: &str = r"C:\Program Files\OnlyOS\removed-features.json";
const EDITION_PATH: &str = r"C:\Program Files\OnlyOS\edition.txt";

#[tauri::command]
pub fn system_info() -> Value {
    let edition = std::fs::read_to_string(EDITION_PATH)
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    let manifest = std::fs::read_to_string(MANIFEST_PATH)
        .ok()
        .and_then(|s| serde_json::from_str::<Value>(&s).ok())
        .unwrap_or(Value::Null);

    json!({
        "edition": edition,
        "manifest": manifest,
        "platform": "win32",
        "arch": std::env::consts::ARCH,
        "isDev": cfg!(debug_assertions),
    })
}

#[tauri::command]
pub fn hardware() -> Value {
    // One PowerShell call returning compact JSON, same shape App.jsx expects.
    let ps = r#"
$ErrorActionPreference='SilentlyContinue'
$os  = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$gpu = Get-CimInstance Win32_VideoController | Where-Object { $_.AdapterRAM -gt 0 -or $_.Name -notmatch 'Basic|Remote' } | Select-Object -First 1
$cs  = Get-CimInstance Win32_ComputerSystem
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$ramTotal = [math]::Round($cs.TotalPhysicalMemory/1GB,1)
$ramFree  = [math]::Round($os.FreePhysicalMemory/1MB,1)
$ramUsed  = [math]::Round($ramTotal - $ramFree,1)
$diskTotal = [math]::Round($disk.Size/1GB,0)
$diskFree  = [math]::Round($disk.FreeSpace/1GB,0)
$diskUsed  = $diskTotal - $diskFree
$obj = [ordered]@{
  osCaption  = $os.Caption
  osBuild    = $os.BuildNumber
  osArch     = $os.OSArchitecture
  cpuName    = ($cpu.Name).Trim()
  cpuCores   = $cpu.NumberOfCores
  cpuThreads = $cpu.NumberOfLogicalProcessors
  gpuName    = $gpu.Name
  ramTotal   = $ramTotal
  ramUsed    = $ramUsed
  diskModel  = (Get-CimInstance Win32_DiskDrive | Select-Object -First 1).Model
  diskTotal  = $diskTotal
  diskFree   = $diskFree
  diskUsed   = $diskUsed
  lastBoot   = $os.LastBootUpTime.ToString('yyyy-MM-dd HH:mm:ss')
}
$obj | ConvertTo-Json -Compress
"#;

    let out = util::powershell(ps);
    match serde_json::from_str::<Value>(&out) {
        Ok(hw) => json!({ "ok": true, "hw": hw }),
        Err(_) => json!({ "ok": false }),
    }
}
