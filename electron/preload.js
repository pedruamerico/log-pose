// preload.js — context-isolated bridge. Renderer only sees window.onlyOS.*

const { contextBridge, ipcRenderer } = require('electron');

function streamingInvoke(invokeChannel, key, outPrefix, donePrefix, onLog) {
    const outChannel = `${outPrefix}:${key}`;
    const onOut = (_e, line) => onLog?.(line);
    ipcRenderer.on(outChannel, onOut);
    return ipcRenderer.invoke(invokeChannel, key)
        .finally(() => ipcRenderer.removeListener(outChannel, onOut));
}

contextBridge.exposeInMainWorld('onlyOS', {
    getSystemInfo: () => ipcRenderer.invoke('system:info'),
    getHardware: () => ipcRenderer.invoke('system:hardware'),

    installPackage: (packageId, onLog) =>
        streamingInvoke('winget:install', packageId, 'winget:out', 'winget:done', onLog),

    // For apps not on winget (NVIDIA App, Adrenalin, WhatsApp): download the
    // vendor .exe and open it. Streams progress on dlrun:out:<key>.
    downloadRun: (key, url, fileName, onLog) => {
        const outCh = `dlrun:out:${key}`;
        const onOut = (_e, line) => onLog?.(line);
        ipcRenderer.on(outCh, onOut);
        return ipcRenderer.invoke('app:download-run', { key, url, fileName })
            .finally(() => ipcRenderer.removeListener(outCh, onOut));
    },

    uninstallPackage: (packageId, onLog) =>
        streamingInvoke('winget:uninstall', packageId, 'unins:out', 'unins:done', onLog),

    wipePackage: (packageId, onLog) =>
        streamingInvoke('app:wipe', packageId, 'wipe:out', 'wipe:done', onLog),

    listInstalled: (catalogIds) => ipcRenderer.invoke('winget:list', catalogIds),

    restoreFeature: (capabilityName, onLog) =>
        streamingInvoke('feature:restore', capabilityName, 'feature:out', 'feature:done', onLog),

    runMaintenance: (actionId, onLog) =>
        streamingInvoke('maintenance:run', actionId, 'maint:out', 'maint:done', onLog),

    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // Tweaks (real toggles)
    setTweak: (id, enabled) => ipcRenderer.invoke('tweak:set', { id, enabled }),
    tweakStatus: (ids) => ipcRenderer.invoke('tweak:status', ids),

    // Startup programs (boot performance)
    listStartup: () => ipcRenderer.invoke('startup:list'),
    setStartup: (name, hive, enabled) => ipcRenderer.invoke('startup:set', { name, hive, enabled }),

    // App behavior settings (startup with Windows / tray / start-minimized)
    getSettings: () => ipcRenderer.invoke('settings:get'),
    setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),

    // App updates (winget upgrade)
    listUpgradable: () => ipcRenderer.invoke('winget:upgradable'),
    upgradePackage: (packageId, onLog) =>
        streamingInvoke('winget:upgrade', packageId, 'wgup:out', 'wgup:done', onLog),

    // Auto-update events
    onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
    onUpdateReady:     (cb) => ipcRenderer.on('update:ready', (_e, info) => cb(info)),
    onUpdateError:     (cb) => ipcRenderer.on('update:error', (_e, info) => cb(info)),
    installUpdate:     () => ipcRenderer.invoke('update:install'),

    // Window controls (frameless titlebar — no maximize, window is fixed-size)
    windowMinimize: () => ipcRenderer.send('win:minimize'),
    windowClose:    () => ipcRenderer.send('win:close')
});
