// Misc native ops: full wipe (uninstall + leftover folders), DISM capability
// restore, maintenance actions, and opening external links.

use std::os::windows::process::CommandExt;

use serde_json::{json, Value};
use tauri::ipc::Channel;

use crate::util;
use crate::winget;

// Known leftover locations per app id. Only paths we are confident about.
fn wipe_paths(id: &str) -> &'static [&'static str] {
    match id {
        "Discord.Discord" => &["%APPDATA%\\discord", "%LOCALAPPDATA%\\Discord"],
        "Google.Chrome" => &["%LOCALAPPDATA%\\Google\\Chrome", "%APPDATA%\\Google\\Chrome"],
        "Mozilla.Firefox" => &["%APPDATA%\\Mozilla", "%LOCALAPPDATA%\\Mozilla"],
        "Brave.Brave" => &["%LOCALAPPDATA%\\BraveSoftware"],
        "Valve.Steam" => &["%LOCALAPPDATA%\\Steam"],
        "EpicGames.EpicGamesLauncher" => &["%LOCALAPPDATA%\\EpicGamesLauncher", "%PROGRAMDATA%\\Epic"],
        "Spotify.Spotify" => &["%APPDATA%\\Spotify", "%LOCALAPPDATA%\\Spotify"],
        "OBSProject.OBSStudio" => &["%APPDATA%\\obs-studio"],
        "Microsoft.VisualStudioCode" => &["%APPDATA%\\Code", "%USERPROFILE%\\.vscode"],
        _ => &[],
    }
}

fn expand_env(raw: &str) -> String {
    let mut out = String::new();
    let mut rest = raw;
    while let Some(start) = rest.find('%') {
        out.push_str(&rest[..start]);
        let after = &rest[start + 1..];
        if let Some(end) = after.find('%') {
            let var = &after[..end];
            out.push_str(&std::env::var(var).unwrap_or_default());
            rest = &after[end + 1..];
        } else {
            out.push_str(&rest[start..]);
            rest = "";
        }
    }
    out.push_str(rest);
    out
}

#[tauri::command]
pub async fn app_wipe(package_id: String, channel: Channel<String>) -> Value {
    if !util::is_valid_pkg(&package_id) {
        return json!({ "ok": false, "error": "invalid package id" });
    }
    let _ = channel.send(format!("==> Uninstalling {package_id}...\n"));
    util::stream(
        &channel,
        &winget::resolve(),
        &[
            "uninstall",
            "--id",
            &package_id,
            "--exact",
            "--silent",
            "--disable-interactivity",
        ],
    )
    .await;

    let folders = wipe_paths(&package_id);
    if folders.is_empty() {
        let _ = channel.send("==> No known leftover folders for this app. Uninstall complete.\n".into());
    } else {
        for raw in folders {
            let expanded = expand_env(raw);
            if !expanded.is_empty() && std::path::Path::new(&expanded).exists() {
                match std::fs::remove_dir_all(&expanded) {
                    Ok(_) => {
                        let _ = channel.send(format!("==> Removed {expanded}\n"));
                    }
                    Err(e) => {
                        let _ = channel.send(format!("==> Could not remove {expanded}: {e}\n"));
                    }
                }
            }
        }
    }
    let _ = channel.send("==> Wipe complete.\n".into());
    json!({ "ok": true })
}

#[tauri::command]
pub async fn feature_restore(capability_name: String, channel: Channel<String>) -> Value {
    if !util::is_valid_capability(&capability_name) {
        return json!({ "ok": false, "error": "invalid name" });
    }
    let arg = format!("/CapabilityName:{capability_name}");
    let code = util::stream(
        &channel,
        "dism.exe",
        &["/Online", "/Add-Capability", &arg],
    )
    .await;
    json!({ "ok": code == 0, "exitCode": code })
}

// Maintenance actions — (program, args). `winget` is resolved lazily.
fn maintenance(action: &str) -> Option<(String, Vec<String>)> {
    let ps = |cmd: &str| {
        (
            "powershell".to_string(),
            vec!["-NoProfile".to_string(), "-Command".to_string(), cmd.to_string()],
        )
    };
    Some(match action {
        "flush-dns" => ("ipconfig".to_string(), vec!["/flushdns".to_string()]),
        "restart-explorer" => ps("Stop-Process -Name explorer -Force; Start-Sleep 1; if(-not(Get-Process explorer -ErrorAction SilentlyContinue)){Start-Process explorer}"),
        "clear-temp" => ps("Remove-Item \"$env:TEMP\\*\" -Recurse -Force -ErrorAction SilentlyContinue; Write-Output \"temp cleared\""),
        "check-updates" => ps("Write-Output \"Opening Windows Update...\"; Start-Process ms-settings:windowsupdate"),
        "repair" => ps("Write-Output \"=== SFC /scannow ===\"; sfc /scannow; Write-Output \"=== DISM RestoreHealth ===\"; DISM /Online /Cleanup-Image /RestoreHealth"),
        "add-store" => ps("Get-AppxPackage -AllUsers *WindowsStore* | ForEach-Object { Add-AppxPackage -DisableDevelopmentMode -Register \"$($_.InstallLocation)\\AppxManifest.xml\" -ErrorAction SilentlyContinue }; Start-Process wsreset.exe -ArgumentList \"-i\"; Write-Output \"Store re-add triggered (wsreset may take a minute).\""),
        "remove-store" => ps("Get-AppxPackage -AllUsers *WindowsStore* | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue; Write-Output \"Store removed.\""),
        "add-onedrive" => (
            winget::resolve(),
            vec!["install", "--id", "Microsoft.OneDrive", "-e", "--silent", "--accept-package-agreements", "--accept-source-agreements"]
                .into_iter().map(String::from).collect(),
        ),
        "restore-point" => ps(concat!(
            "Write-Output \"Enabling System Restore on C:...\"; ",
            "Enable-ComputerRestore -Drive \"C:\\\" -ErrorAction SilentlyContinue; ",
            "New-ItemProperty -Path \"HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore\" -Name SystemRestorePointCreationFrequency -Value 0 -PropertyType DWord -Force -ErrorAction SilentlyContinue | Out-Null; ",
            "Write-Output \"Creating restore point...\"; ",
            "Checkpoint-Computer -Description \"Log Pose\" -RestorePointType \"MODIFY_SETTINGS\"; ",
            "Write-Output \"Restore point created.\""
        )),
        _ => return None,
    })
}

#[tauri::command]
pub async fn maintenance_run(action_id: String, channel: Channel<String>) -> Value {
    let Some((cmd, args)) = maintenance(&action_id) else {
        return json!({ "ok": false, "error": "unknown action" });
    };
    let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
    let code = util::stream(&channel, &cmd, &arg_refs).await;
    json!({ "ok": code == 0, "exitCode": code })
}

#[tauri::command]
pub fn open_external(url: String) -> Value {
    if url.starts_with("https://") {
        let _ = std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", &url])
            .creation_flags(util::CREATE_NO_WINDOW)
            .spawn();
        return json!({ "ok": true });
    }
    json!({ "ok": false })
}
