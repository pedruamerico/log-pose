// Shared helpers: process spawning (streaming + capturing), PowerShell, winget
// output cleaning, and input validation. Ports the cross-cutting bits of the
// old electron/main.js (streamProcess, psQuery, the ANSI/table cleanup).

use std::os::windows::process::CommandExt;
use std::process::Stdio;
use std::sync::OnceLock;

use regex::Regex;
use tauri::ipc::Channel;
use tokio::io::AsyncReadExt;

// CREATE_NO_WINDOW — keep console children hidden (matches windowsHide: true).
pub const CREATE_NO_WINDOW: u32 = 0x0800_0000;

// Stream a child process' stdout+stderr to a Tauri Channel, line/chunk as it
// comes, and resolve with the exit code. Mirrors the old streamProcess: each
// raw chunk is forwarded (lossy UTF-8) just like Electron's d.toString().
pub async fn stream(channel: &Channel<String>, program: &str, args: &[&str]) -> i32 {
    let mut std_cmd = std::process::Command::new(program);
    std_cmd
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(CREATE_NO_WINDOW);

    let mut child = match tokio::process::Command::from(std_cmd).spawn() {
        Ok(c) => c,
        Err(e) => {
            let _ = channel.send(format!("error: {}\n", e));
            return -1;
        }
    };

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let mut tasks = Vec::new();
    if let Some(out) = stdout {
        tasks.push(tokio::spawn(pump(out, channel.clone())));
    }
    if let Some(err) = stderr {
        tasks.push(tokio::spawn(pump(err, channel.clone())));
    }
    for t in tasks {
        let _ = t.await;
    }
    match child.wait().await {
        Ok(s) => s.code().unwrap_or(-1),
        Err(_) => -1,
    }
}

async fn pump<R: AsyncReadExt + Unpin>(mut reader: R, ch: Channel<String>) {
    let mut buf = [0u8; 4096];
    loop {
        match reader.read(&mut buf).await {
            Ok(0) | Err(_) => break,
            Ok(n) => {
                let _ = ch.send(String::from_utf8_lossy(&buf[..n]).to_string());
            }
        }
    }
}

// Run a program and capture stdout (lossy) + exit code. Blocking — call only
// from sync #[tauri::command]s (Tauri runs those off the main thread).
pub fn run_capture(program: &str, args: &[&str]) -> (String, i32) {
    match std::process::Command::new(program)
        .args(args)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    {
        Ok(out) => (
            String::from_utf8_lossy(&out.stdout).to_string(),
            out.status.code().unwrap_or(-1),
        ),
        Err(_) => (String::new(), -1),
    }
}

// Run a short PowerShell command and return trimmed stdout (or "" on failure).
pub fn powershell(script: &str) -> String {
    let (out, _) = run_capture(
        "powershell.exe",
        &[
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ],
    );
    out.trim().to_string()
}

// Strip ANSI escapes and turn CR/backspace into newlines — winget interleaves
// progress spinners and control chars before the real table.
pub fn clean_winget(raw: &str) -> String {
    static ANSI: OnceLock<Regex> = OnceLock::new();
    let ansi = ANSI.get_or_init(|| Regex::new(r"\x1b\[[0-9;?]*[A-Za-z]").unwrap());
    let no_ansi = ansi.replace_all(raw, "");
    no_ansi.replace(['\r', '\u{8}'], "\n")
}

// A spinner-only line: nothing but whitespace and \ | / - characters.
pub fn is_spinner(line: &str) -> bool {
    !line.is_empty()
        && line
            .chars()
            .all(|c| c.is_whitespace() || c == '\\' || c == '|' || c == '/' || c == '-')
}

// The header row carries Name + Id + Version (or Available) as whole tokens.
pub fn header_has(line: &str, words: &[&str]) -> bool {
    let tokens: Vec<&str> = line.split_whitespace().collect();
    words.iter().all(|w| tokens.contains(w))
}

// char-aware indexOf: find `needle` in `chars` at/after `from`, return char pos.
pub fn char_find(chars: &[char], needle: &str, from: usize) -> Option<usize> {
    let pat: Vec<char> = needle.chars().collect();
    if pat.is_empty() || from > chars.len() {
        return None;
    }
    (from..=chars.len().saturating_sub(pat.len())).find(|&i| chars[i..i + pat.len()] == pat[..])
}

// Package id allow-list: [A-Za-z0-9._+-]
pub fn is_valid_pkg(s: &str) -> bool {
    !s.is_empty()
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '+' | '-'))
}

// DISM capability/feature name allow-list: [A-Za-z0-9.~_+-]
pub fn is_valid_capability(s: &str) -> bool {
    !s.is_empty()
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '~' | '_' | '+' | '-'))
}
