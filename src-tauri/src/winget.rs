// winget: locate the real winget.exe, install/uninstall/upgrade (streaming),
// and parse the `list` / `upgrade` tables (faithful port of the old main.js
// table parsing — ANSI strip, column-index slicing, NAME_FALLBACK matching).

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

use serde_json::{json, Value};
use tauri::ipc::Channel;

use crate::util;

const DAI_FAMILY: &str = "Microsoft.DesktopAppInstaller_8wekyb3d8bbwe";

// --- winget.exe resolution --------------------------------------------------
// `winget` is an App Execution Alias that spawn-by-name can't launch (ENOENT),
// so we find the actual exe. We deliberately do NOT readdir Program Files\
// WindowsApps (ACL-locked); we ask AppX for the install location instead.

static WINGET: OnceLock<String> = OnceLock::new();

pub fn resolve() -> String {
    WINGET
        .get_or_init(|| {
            if let Some(p) = pick() {
                return p;
            }
            // Self-heal: register the staged/provisioned package by family name
            // (no admin needed) to recreate the alias, then re-pick.
            let _ = util::powershell(&format!(
                "Add-AppxPackage -RegisterByFamilyName -MainPackage {DAI_FAMILY}"
            ));
            pick().unwrap_or_else(|| "winget".to_string())
        })
        .clone()
}

fn pick() -> Option<String> {
    let mut cands: Vec<PathBuf> = Vec::new();
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        let base = Path::new(&local).join("Microsoft").join("WindowsApps");
        if let Ok(rd) = std::fs::read_dir(&base) {
            for e in rd.flatten() {
                if e.file_name()
                    .to_string_lossy()
                    .starts_with("Microsoft.DesktopAppInstaller")
                {
                    cands.push(e.path().join("winget.exe"));
                }
            }
        }
        cands.push(base.join("winget.exe")); // alias stub
    }
    let loc = util::powershell(
        "(Get-AppxPackage -Name Microsoft.DesktopAppInstaller | Select-Object -First 1).InstallLocation",
    );
    if !loc.is_empty() {
        cands.push(Path::new(&loc).join("winget.exe"));
    }
    cands
        .into_iter()
        .find(|c| c.exists())
        .map(|c| c.to_string_lossy().to_string())
}

// --- install / uninstall / upgrade (streaming) ------------------------------

#[tauri::command]
pub async fn winget_install(package_id: String, channel: Channel<String>) -> Value {
    if !util::is_valid_pkg(&package_id) {
        return json!({ "ok": false, "error": "invalid package id" });
    }
    let code = util::stream(
        &channel,
        &resolve(),
        &[
            "install",
            "--id",
            &package_id,
            "--exact",
            "--silent",
            "--accept-package-agreements",
            "--accept-source-agreements",
            "--disable-interactivity",
        ],
    )
    .await;
    json!({ "ok": code == 0, "exitCode": code })
}

#[tauri::command]
pub async fn winget_uninstall(package_id: String, channel: Channel<String>) -> Value {
    if !util::is_valid_pkg(&package_id) {
        return json!({ "ok": false, "error": "invalid package id" });
    }
    let code = util::stream(
        &channel,
        &resolve(),
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
    json!({ "ok": code == 0, "exitCode": code })
}

#[tauri::command]
pub async fn winget_upgrade(package_id: String, channel: Channel<String>) -> Value {
    if !util::is_valid_pkg(&package_id) {
        return json!({ "ok": false, "error": "invalid package id" });
    }
    let code = util::stream(
        &channel,
        &resolve(),
        &[
            "upgrade",
            "--id",
            &package_id,
            "--exact",
            "--silent",
            "--accept-package-agreements",
            "--accept-source-agreements",
            "--disable-interactivity",
        ],
    )
    .await;
    json!({ "ok": code == 0, "exitCode": code })
}

// --- list (which catalog ids are installed) ---------------------------------

fn name_fallback(id: &str) -> Option<&'static [&'static str]> {
    match id {
        "Git.Git" => Some(&["Git"]),
        "OpenJS.NodeJS.LTS" => Some(&["Node.js"]),
        "Valve.Steam" => Some(&["Steam"]),
        "Microsoft.VisualStudioCode" => {
            Some(&["Visual Studio Code", "Microsoft Visual Studio Code"])
        }
        "voidtools.Everything" => Some(&["Everything"]),
        "EpicGames.EpicGamesLauncher" => Some(&["Epic Games Launcher"]),
        "RiotGames.RiotClient" => Some(&["Riot Client"]),
        "Discord.Discord" => Some(&["Discord"]),
        "Spotify.Spotify" => Some(&["Spotify"]),
        _ => None,
    }
}

#[tauri::command]
pub fn winget_list(catalog_ids: Vec<String>) -> Value {
    let (stdout, _) = util::run_capture(
        &resolve(),
        &["list", "--accept-source-agreements", "--disable-interactivity"],
    );
    if stdout.is_empty() {
        return json!({ "ok": false, "installed": [] });
    }

    let clean = util::clean_winget(&stdout);
    let lines: Vec<&str> = clean
        .lines()
        .filter(|l| !l.trim().is_empty() && !util::is_spinner(l))
        .collect();

    let (mut name_col, mut id_col, mut header_idx) = (0usize, -1isize, -1isize);
    for (i, line) in lines.iter().enumerate() {
        if util::header_has(line, &["Name", "Id", "Version"]) {
            let chars: Vec<char> = line.chars().collect();
            name_col = util::char_find(&chars, "Name", 0).unwrap_or(0);
            id_col = util::char_find(&chars, "Id", name_col)
                .map(|x| x as isize)
                .unwrap_or(-1);
            header_idx = i as isize;
            break;
        }
    }

    let mut exact_ids: HashSet<String> = HashSet::new();
    let mut names: Vec<String> = Vec::new();
    if id_col >= 0 && header_idx >= 0 {
        let id_col = id_col as usize;
        for line in lines.iter().skip(header_idx as usize + 1) {
            let chars: Vec<char> = line.chars().collect();
            if chars.len() < id_col {
                continue;
            }
            if line.trim().chars().all(|c| c == '-' || c.is_whitespace()) {
                continue;
            }
            let id_field: String = chars[id_col..]
                .iter()
                .collect::<String>()
                .split_whitespace()
                .next()
                .unwrap_or("")
                .to_string();
            let name_field: String = chars[name_col..id_col].iter().collect::<String>().trim().to_string();
            if !id_field.is_empty()
                && id_field.chars().next().map_or(false, |c| c.is_ascii_alphanumeric())
            {
                exact_ids.insert(id_field);
            }
            if !name_field.is_empty() {
                names.push(name_field.to_lowercase());
            }
        }
    }

    let mut installed: Vec<String> = Vec::new();
    for app in &catalog_ids {
        if exact_ids.contains(app) {
            installed.push(app.clone());
            continue;
        }
        if let Some(fb) = name_fallback(app) {
            if fb
                .iter()
                .any(|s| names.iter().any(|n| n.contains(&s.to_lowercase())))
            {
                installed.push(app.clone());
            }
        }
    }
    json!({ "ok": true, "installed": installed })
}

// --- upgradable (which installed apps have an update) -----------------------

#[tauri::command]
pub fn winget_upgradable() -> Value {
    let (stdout, _) = util::run_capture(
        &resolve(),
        &[
            "upgrade",
            "--include-unknown",
            "--accept-source-agreements",
            "--disable-interactivity",
        ],
    );
    if stdout.is_empty() {
        return json!({ "ok": false, "ids": [] });
    }

    let clean = util::clean_winget(&stdout);
    let lines: Vec<&str> = clean
        .lines()
        .filter(|l| !l.trim().is_empty() && !util::is_spinner(l))
        .collect();

    let (mut id_col, mut ver_col, mut header_idx) = (-1isize, -1isize, -1isize);
    for (i, line) in lines.iter().enumerate() {
        if util::header_has(line, &["Name", "Id", "Available"]) {
            let chars: Vec<char> = line.chars().collect();
            let name_col = util::char_find(&chars, "Name", 0).unwrap_or(0);
            id_col = util::char_find(&chars, "Id", name_col)
                .map(|x| x as isize)
                .unwrap_or(-1);
            if id_col >= 0 {
                ver_col = util::char_find(&chars, "Available", id_col as usize)
                    .map(|x| x as isize)
                    .unwrap_or(-1);
            }
            header_idx = i as isize;
            break;
        }
    }

    let mut ids: Vec<String> = Vec::new();
    if id_col >= 0 && header_idx >= 0 {
        let id_col = id_col as usize;
        for line in lines.iter().skip(header_idx as usize + 1) {
            let chars: Vec<char> = line.chars().collect();
            if chars.len() < id_col || line.trim().chars().all(|c| c == '-' || c.is_whitespace()) {
                continue;
            }
            let end = if ver_col > id_col as isize {
                ver_col as usize
            } else {
                chars.len()
            };
            let end = end.min(chars.len());
            let id_field: String = chars[id_col..end]
                .iter()
                .collect::<String>()
                .split_whitespace()
                .next()
                .unwrap_or("")
                .to_string();
            // Footer lines ("N upgrades available.") have no valid Id token.
            if is_pkg_id(&id_field) && id_field.contains('.') {
                ids.push(id_field);
            }
        }
    }
    json!({ "ok": true, "ids": ids })
}

// /^[A-Za-z0-9][A-Za-z0-9._+\-]+$/
fn is_pkg_id(s: &str) -> bool {
    let mut chars = s.chars();
    match chars.next() {
        Some(c) if c.is_ascii_alphanumeric() => {}
        _ => return false,
    }
    s.len() >= 2
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '+' | '-'))
}
