// bridge.js — reimplements the window.onlyOS contract on top of Tauri.
//
// The renderer (App.jsx) was written against an Electron preload that exposed
// window.onlyOS.*. We keep that exact surface so the React code is untouched;
// only the implementation underneath changes from Electron IPC to Tauri
// invoke() + Channel. Streaming methods take an onLog(chunk) callback, mirrored
// here with a Tauri Channel whose messages are forwarded to onLog.

import { invoke, Channel } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';

// Run a streaming command: create a Channel, forward each message to onLog,
// resolve when the command (and thus the spawned process) finishes.
function streamInvoke(cmd, payload, onLog) {
    const channel = new Channel();
    channel.onmessage = (line) => { onLog?.(line); };
    return invoke(cmd, { ...payload, channel }).catch((e) => {
        onLog?.(`error: ${e}\n`);
        return { ok: false, error: String(e) };
    });
}

// Plain invoke that never throws to the caller (the renderer expects soft
// failures — it optional-chains and catches). Returns a fallback on reject.
function safeInvoke(cmd, payload, fallback) {
    return invoke(cmd, payload).catch(() => fallback);
}

// Only install the Tauri-backed bridge when actually running under Tauri.
// During the migration the Electron build still ships its own preload that sets
// window.onlyOS; under Electron this module must be a no-op so we don't clobber
// it. __TAURI_INTERNALS__ is injected by the Tauri webview only.
if (window.__TAURI_INTERNALS__) {

const appWindow = getCurrentWindow();

window.onlyOS = {
    // --- system info ---
    getHardware: () => safeInvoke('hardware', undefined, { ok: false }),

    // --- winget install / uninstall / wipe / upgrade ---
    installPackage: (packageId, onLog) =>
        streamInvoke('winget_install', { packageId }, onLog),

    uninstallPackage: (packageId, onLog) =>
        streamInvoke('winget_uninstall', { packageId }, onLog),

    wipePackage: (packageId, onLog) =>
        streamInvoke('app_wipe', { packageId }, onLog),

    upgradePackage: (packageId, onLog) =>
        streamInvoke('winget_upgrade', { packageId }, onLog),

    listInstalled: (catalogIds) =>
        safeInvoke('winget_list', { catalogIds }, { ok: false, installed: [] }),

    listUpgradable: () =>
        safeInvoke('winget_upgradable', undefined, { ok: false, ids: [] }),

    // --- apps not on winget: download the vendor .exe and open it ---
    downloadRun: (key, url, fileName, onLog) =>
        streamInvoke('download_run', { key, url, fileName }, onLog),

    // --- DISM capability restore ---
    restoreFeature: (capabilityName, onLog) =>
        streamInvoke('feature_restore', { capabilityName }, onLog),

    // --- AppX debloat (live present/remove) ---
    listAppx: () => safeInvoke('appx_list', undefined, { ok: false, installed: [] }),
    removeAppx: (name, onLog) => streamInvoke('appx_remove', { name }, onLog),

    // --- maintenance actions ---
    runMaintenance: (actionId, onLog) =>
        streamInvoke('maintenance_run', { actionId }, onLog),

    // --- external links ---
    openExternal: (url) => safeInvoke('open_external', { url }, { ok: false }),

    // --- tweaks (real registry/powercfg/dism toggles) ---
    setTweak: (id, enabled) =>
        safeInvoke('tweak_set', { id, enabled }, { ok: false }),
    tweakStatus: (ids) => safeInvoke('tweak_status', { ids }, {}),

    // --- service optimization (reversible) ---
    listServices: (names) => safeInvoke('service_list', { names }, {}),
    setService: (name, optimized) => safeInvoke('service_set', { name, optimized }, { ok: false }),

    // --- Core Isolation / Memory Integrity (detect + open settings) ---
    coreIsolation: () => safeInvoke('core_isolation_status', undefined, { ok: false }),
    openSettings: (uri) => safeInvoke('open_settings', { uri }, { ok: false }),

    // --- startup programs ---
    listStartup: () => safeInvoke('startup_list', undefined, { ok: false, items: [] }),
    setStartup: (name, hive, enabled) =>
        safeInvoke('startup_set', { name, hive, enabled }, { ok: false }),

    // --- app behavior settings (startup with Windows / tray / start-minimized) ---
    getSettings: () => safeInvoke('settings_get', undefined, {}),
    setSetting: (key, value) => safeInvoke('settings_set', { key, value }, {}),

    // --- auto-update events (emitted by the Rust updater flow) ---
    onUpdateAvailable: (cb) => { listen('update://available', (e) => cb(e.payload)); },
    onUpdateReady:     (cb) => { listen('update://ready', (e) => cb(e.payload)); },
    onUpdateError:     (cb) => { listen('update://error', (e) => cb(e.payload)); },
    installUpdate:     () => safeInvoke('install_update', undefined, { ok: false }),

    // --- window controls (frameless titlebar) ---
    windowMinimize: () => { appWindow.minimize(); },
    windowClose:    () => { appWindow.close(); },
};

}
