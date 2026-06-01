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
            // Launch the installer via the shell (explorer), the same path a
            // double-click takes — so the GUI window shows and UAC elevation is
            // handled. CRUCIAL: check the spawn result. The old code did
            // `let _ = ...spawn()`, swallowing failures, so a blocked/failed
            // launch still returned ok:true and the card lied "Installed" with
            // nothing actually opened.
            match std::process::Command::new("explorer.exe").arg(&dest).spawn() {
                Ok(_) => {
                    let _ = channel.send("==> Installer launched.\n".to_string());
                    json!({ "ok": true })
                }
                Err(e) => {
                    let _ = channel.send(format!("error: failed to open installer: {e}\n"));
                    json!({ "ok": false, "error": e.to_string() })
                }
            }
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

    // Some vendor CDNs (WhatsApp's among them) reject a non-browser User-Agent
    // with a 403 / HTML error page instead of the binary. Send a browser-like UA
    // so we get the real installer.
    let resp = ureq::get(url)
        .set(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) LogPose",
        )
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
    let mut head = [0u8; 2]; // first two bytes — a real PE installer is "MZ"
    loop {
        let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        if got < 2 {
            for (i, b) in buf[..n].iter().enumerate() {
                let pos = got as usize + i;
                if pos < 2 {
                    head[pos] = *b;
                }
            }
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
    drop(file);

    // Guard against an error page / redirect HTML slipping through as a
    // "download": a Windows installer is a PE that begins with "MZ" and is not
    // tiny. If it's not, delete it and fail loudly instead of opening garbage
    // (which silently does nothing — the original "nothing opened" symptom).
    if got < 1024 || &head != b"MZ" {
        let _ = std::fs::remove_file(&dest);
        return Err(format!(
            "o servidor não retornou um instalador válido ({got} bytes — não é um .exe do Windows)"
        ));
    }

    Ok(dest.to_string_lossy().to_string())
}
