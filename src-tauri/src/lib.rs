mod app_ui;
mod appx;
mod download;
mod ops;
mod services;
mod startup;
mod system;
mod tweaks;
mod util;
mod winget;

use std::sync::atomic::AtomicBool;
use std::sync::Mutex;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_autostart::init(
        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        None,
    ));

    // The updater plugin needs plugins.updater config (endpoints + signing
    // pubkey) which only exists for packaged builds. Register it in release
    // only; in dev spawn_update_check no-ops anyway.
    #[cfg(not(debug_assertions))]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .setup(|app| {
            let handle = app.handle().clone();
            let settings = app_ui::load_settings(&handle);

            app.manage(app_ui::SettingsState(Mutex::new(settings.clone())));
            app.manage(app_ui::TrayState(Mutex::new(None)));
            app.manage(app_ui::QuitState(AtomicBool::new(false)));

            if settings.tray {
                app_ui::ensure_tray(&handle);
            }
            // Start hidden to tray when asked.
            if settings.start_minimized && settings.tray {
                if let Some(w) = handle.get_webview_window("main") {
                    let _ = w.hide();
                }
            }
            app_ui::spawn_update_check(&handle);
            Ok(())
        })
        .on_window_event(|window, event| {
            // With "minimize to tray" on, the close button hides the window
            // instead of quitting (the tray's Sair is the real exit).
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                let tray_on = app
                    .state::<app_ui::SettingsState>()
                    .0
                    .lock()
                    .map(|g| g.tray)
                    .unwrap_or(false);
                if tray_on && !app_ui::is_quitting(app) {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            system::hardware,
            winget::winget_install,
            winget::winget_uninstall,
            winget::winget_upgrade,
            winget::winget_list,
            winget::winget_upgradable,
            winget::winget_show,
            ops::app_wipe,
            ops::feature_restore,
            ops::feature_remove,
            ops::maintenance_run,
            appx::appx_list,
            appx::appx_capabilities,
            appx::appx_remove,
            appx::appx_restore,
            ops::open_external,
            download::download_run,
            tweaks::tweak_set,
            tweaks::tweak_status,
            startup::startup_list,
            startup::startup_set,
            services::service_list,
            services::service_set,
            services::core_isolation_status,
            services::open_settings,
            app_ui::settings_get,
            app_ui::settings_set,
            app_ui::install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
