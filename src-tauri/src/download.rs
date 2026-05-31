// download_run — for apps not on winget (NVIDIA App, Adrenalin, WhatsApp,
// DirectX). Downloads the vendor .exe to TEMP, streams percent progress, and
// launches it for the user to run (no silent flag — they stay in control).
// Sync command: ureq is blocking, and Tauri runs sync commands off-thread.

use std::io::{Read, Write};

use serde_json::{json, Value};
use tauri::ipc::Channel;

#[tauri::command]
pub fn download_run(key: String, url: String, file_name: Option<String>, channel: Channel<String>) -> Value {
    let _ = key; // kept for signature parity; the channel already targets this call
    match run(&url, file_name.as_deref(), &channel) {
        Ok(dest) => {
            let _ = channel.send(format!(
                "==> Download complete: {dest}\n==> Opening installer...\n"
            ));
            // Launch the installer (equivalent to Electron's shell.openPath on an exe).
            let _ = std::process::Command::new(&dest).spawn();
            json!({ "ok": true })
        }
        Err(e) => {
            let _ = channel.send(format!("error: {e}\n"));
            json!({ "ok": false, "error": e })
        }
    }
}

fn run(url: &str, file_name: Option<&str>, channel: &Channel<String>) -> Result<String, String> {
    if !url.starts_with("https://") {
        return Err("invalid url".into());
    }
    let safe_name: String = file_name
        .unwrap_or("installer.exe")
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-') { c } else { '_' })
        .collect();
    let dest = std::env::temp_dir().join(safe_name);

    let _ = channel.send(format!("==> Downloading {url}\n"));

    let resp = ureq::get(url)
        .set("User-Agent", "LogPose")
        .call()
        .map_err(|e| e.to_string())?;

    let total: u64 = resp
        .header("Content-Length")
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    let mut reader = resp.into_reader();
    let mut file = std::fs::File::create(&dest).map_err(|e| e.to_string())?;
    let mut buf = [0u8; 65536];
    let mut got: u64 = 0;
    let mut last_pct: i64 = -1;
    loop {
        let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        got += n as u64;
        if total > 0 {
            let pct = ((got * 100) / total) as i64;
            if pct != last_pct && pct % 5 == 0 {
                let _ = channel.send(format!("    {pct}%\n"));
                last_pct = pct;
            }
        }
    }
    Ok(dest.to_string_lossy().to_string())
}
