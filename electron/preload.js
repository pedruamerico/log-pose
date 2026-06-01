// preload.js — context-isolated bridge. The renderer only ever sees
// window.onlyOS.*, backed here by Electron IPC. Streaming methods take an
// onLog(chunk) callback fed from a per-key output channel that main.js emits on.

const { contextBridge, ipcRenderer } = require('electron');

// Run a streaming command: subscribe to `${outPrefix}:${key}`, forward each
// chunk to onLog, and clean up the listener when the invoke settles.
function streamingInvoke(invokeChannel, key, outPrefix, onLog, payload) {
    const outChannel = `${outPrefix}:${key}`;
    const onOut = (_e, line) => onLog?.(line);
    ipcRenderer.on(outChannel, onOut);
    return ipcRenderer.invoke(invokeChannel, payload !== undefined ? payload : key)
        .catch((e) => ({ ok: false, error: String(e) }))
        .finally(() => ipcRenderer.removeListener(outChannel, onOut));
}

contextBridge.exposeInMainWorld('onlyOS', {
    // --- system info ---
    getHardware: () => ipcRenderer.invoke('system:hardware'),

    // --- winget install / uninstall / wipe / upgrade ---
    // source is optional ("msstore" for Store-only apps like WhatsApp).
    installPackage: (packageId, onLog, source) =>
        streamingInvoke('winget:install', packageId, 'winget:out', onLog, { packageId, source }),

    uninstallPackage: (packageId, onLog) =>
        streamingInvoke('winget:uninstall', packageId, 'unins:out', onLog),

    wipePackage: (packageId, onLog) =>
        streamingInvoke('app:wipe', packageId, 'wipe:out', onLog),

    upgradePackage: (packageId, onLog) =>
        streamingInvoke('winget:upgrade', packageId, 'wgup:out', onLog),

    listInstalled: (catalogIds) => ipcRenderer.invoke('winget:list', catalogIds),
    listUpgradable: () => ipcRenderer.invoke('winget:upgradable'),

    // Live details for the info popover (winget show).
    appInfo: (packageId) => ipcRenderer.invoke('winget:show', packageId),

    // --- apps not on winget: download the vendor .exe and open it ---
    downloadRun: (key, url, fileName, onLog) => {
        const outCh = `dlrun:out:${key}`;
        const onOut = (_e, line) => onLog?.(line);
        ipcRenderer.on(outCh, onOut);
        return ipcRenderer.invoke('app:download-run', { key, url, fileName })
            .catch((e) => ({ ok: false, error: String(e) }))
            .finally(() => ipcRenderer.removeListener(outCh, onOut));
    },

    // --- DISM capability restore / remove ---
    restoreFeature: (capabilityName, onLog) =>
        streamingInvoke('feature:restore', capabilityName, 'feature:out', onLog),
    removeFeature: (capabilityName, onLog) =>
        streamingInvoke('feature:remove', capabilityName, 'feature:out', onLog),

    // --- AppX debloat (live present/remove/restore) ---
    listAppx: () => ipcRenderer.invoke('appx:list'),
    listCapabilities: () => ipcRenderer.invoke('appx:capabilities'),
    removeAppx: (name, onLog) => streamingInvoke('appx:remove', name, 'appx:out', onLog),
    restoreAppx: (name, onLog) => streamingInvoke('appx:restore', name, 'appx:out', onLog),

    // --- maintenance actions ---
    runMaintenance: (actionId, onLog) =>
        streamingInvoke('maintenance:run', actionId, 'maint:out', onLog),

    // --- external links ---
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // --- tweaks (real registry/powercfg/dism toggles) ---
    setTweak: (id, enabled) => ipcRenderer.invoke('tweak:set', { id, enabled }),
    tweakStatus: (ids) => ipcRenderer.invoke('tweak:status', ids),

    // --- service optimization (reversible) ---
    listServices: (names) => ipcRenderer.invoke('service:list', names),
    setService: (name, optimized) => ipcRenderer.invoke('service:set', { name, optimized }),

    // --- Core Isolation / Memory Integrity (detect + open settings) ---
    coreIsolation: () => ipcRenderer.invoke('core-isolation:status'),
    openSettings: (uri) => ipcRenderer.invoke('open-settings', uri),

    // --- startup programs ---
    listStartup: () => ipcRenderer.invoke('startup:list'),
    setStartup: (name, hive, enabled) => ipcRenderer.invoke('startup:set', { name, hive, enabled }),

    // --- app behavior settings (startup with Windows / tray / start-minimized) ---
    getSettings: () => ipcRenderer.invoke('settings:get'),
    setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),

    // --- auto-update events ---
    onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
    onUpdateReady:     (cb) => ipcRenderer.on('update:ready', (_e, info) => cb(info)),
    onUpdateError:     (cb) => ipcRenderer.on('update:error', (_e, info) => cb(info)),
    installUpdate:     () => ipcRenderer.invoke('update:install'),

    // --- window controls (frameless titlebar) ---
    windowMinimize: () => ipcRenderer.send('win:minimize'),
    windowClose:    () => ipcRenderer.send('win:close'),
});
