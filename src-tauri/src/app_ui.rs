// App shell behavior: settings (tray / start-minimized / start-with-Windows),
// the system tray, the close-to-tray window behavior, and the auto-update flow.
// These are the bits the old main.js handled outside the IPC ops.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_autostart::ManagerExt;

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct Settings {
    #[serde(default)]
    pub tray: bool,
    #[serde(default, rename = "startMinimized")]
    pub start_minimized: bool,
}

pub struct SettingsState(pub Mutex<Settings>);
pub struct TrayState(pub Mutex<Option<TrayIcon>>);
pub struct QuitState(pub AtomicBool);

// --- persistence ------------------------------------------------------------

fn settings_path(app: &AppHandle) -> Option<std::path::PathBuf> {
    let dir = app.path().app_config_dir().ok()?;
    let _ = std::fs::create_dir_all(&dir);
    Some(dir.join("settings.json"))
}

pub fn load_settings(app: &AppHandle) -> Settings {
    settings_path(app)
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_settings(app: &AppHandle, s: &Settings) {
    if let Some(p) = settings_path(app) {
        let _ = std::fs::write(p, serde_json::to_string(s).unwrap_or_default());
    }
}

// --- window helpers ---------------------------------------------------------

pub fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.set_focus();
    }
}

// --- tray -------------------------------------------------------------------

pub fn ensure_tray(app: &AppHandle) {
    let st = app.state::<TrayState>();
    let mut guard = st.0.lock().unwrap();
    if guard.is_some() {
        return;
    }
    let Some(icon) = app.default_window_icon().cloned() else {
        return;
    };
    let (Ok(open), Ok(quit)) = (
        MenuItem::with_id(app, "open", "Abrir Log Pose", true, None::<&str>),
        MenuItem::with_id(app, "quit", "Sair", true, None::<&str>),
    ) else {
        return;
    };
    let Ok(menu) = Menu::with_items(app, &[&open, &quit]) else {
        return;
    };
    let tray = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .tooltip("Log Pose")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "quit" => {
                app.state::<QuitState>().0.store(true, Ordering::SeqCst);
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                show_main(tray.app_handle());
            }
        })
        .build(app);
    if let Ok(t) = tray {
        *guard = Some(t);
    }
}

pub fn remove_tray(app: &AppHandle) {
    let st = app.state::<TrayState>();
    let mut guard = st.0.lock().unwrap();
    guard.take(); // dropping the TrayIcon removes it from the tray
}

pub fn is_quitting(app: &AppHandle) -> bool {
    app.state::<QuitState>().0.load(Ordering::SeqCst)
}

// --- settings commands ------------------------------------------------------

fn state_json(app: &AppHandle) -> Value {
    let s = app.state::<SettingsState>();
    let g = s.0.lock().unwrap();
    let startup = app.autolaunch().is_enabled().unwrap_or(false);
    json!({ "startup": startup, "tray": g.tray, "startMinimized": g.start_minimized })
}

#[tauri::command]
pub fn settings_get(app: AppHandle) -> Value {
    state_json(&app)
}

#[tauri::command]
pub fn settings_set(app: AppHandle, key: String, value: bool) -> Value {
    match key.as_str() {
        "startup" => {
            let al = app.autolaunch();
            let _ = if value { al.enable() } else { al.disable() };
        }
        "tray" => {
            {
                let st = app.state::<SettingsState>();
                let mut g = st.0.lock().unwrap();
                g.tray = value;
                if !value {
                    g.start_minimized = false;
                }
                save_settings(&app, &g);
            }
            if value {
                ensure_tray(&app);
            } else {
                remove_tray(&app);
                show_main(&app);
            }
        }
        "startMinimized" => {
            {
                let st = app.state::<SettingsState>();
                let mut g = st.0.lock().unwrap();
                g.start_minimized = value;
                if value {
                    g.tray = true; // start-minimized implies tray
                }
                save_settings(&app, &g);
            }
            if value {
                ensure_tray(&app);
            }
        }
        _ => {}
    }
    state_json(&app)
}

// --- auto-update ------------------------------------------------------------
// Runs only in packaged builds. Checks GitHub Releases, downloads, and emits
// update://available / update://ready / update://error for the renderer.

pub fn spawn_update_check(app: &AppHandle) {
    if cfg!(debug_assertions) {
        return; // updates only matter in packaged builds
    }
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        use tauri_plugin_updater::UpdaterExt;
        let updater = match app.updater() {
            Ok(u) => u,
            Err(_) => return,
        };
        match updater.check().await {
            Ok(Some(update)) => {
                let _ = app.emit("update://available", json!({ "version": update.version }));
                let ver = update.version.clone();
                match update.download_and_install(|_, _| {}, || {}).await {
                    Ok(_) => {
                        let _ = app.emit("update://ready", json!({ "version": ver }));
                    }
                    Err(e) => {
                        let _ = app.emit("update://error", json!({ "message": e.to_string() }));
                    }
                }
            }
            Ok(None) => {}
            Err(e) => {
                let _ = app.emit("update://error", json!({ "message": e.to_string() }));
            }
        }
    });
}

#[tauri::command]
pub fn install_update(app: AppHandle) -> Value {
    // download_and_install already staged the update; restarting applies it.
    app.state::<QuitState>().0.store(true, Ordering::SeqCst);
    app.restart()
}
