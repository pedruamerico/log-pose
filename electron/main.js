// main.js â€” Electron main process for Only App.
// Window creation, auto-update (GitHub), and IPC for native ops
// (winget, DISM capability restore, maintenance actions, tweaks).

const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, execFileSync, spawn } = require('child_process');

let autoUpdater = null;
try {
    ({ autoUpdater } = require('electron-updater'));
} catch {
    // electron-updater not present in dev â€” fine, updates only matter in packaged builds
}

// Resolve the real winget.exe path. `winget` is a Windows App Execution Alias
// that child_process can't launch by name (spawn -> ENOENT), so we find the
// actual exe inside the DesktopAppInstaller package.
const DAI_FAMILY = 'Microsoft.DesktopAppInstaller_8wekyb3d8bbwe';

// Run a short PowerShell query and return trimmed stdout (or '' on failure).
// Used to locate / register the AppX without needing to enumerate the
// ACL-locked Program Files\WindowsApps directory.
function psQuery(script) {
    try {
        return execFileSync('powershell.exe',
            ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
            { encoding: 'utf8', timeout: 15000, windowsHide: true }).trim();
    } catch { return ''; }
}

let _wingetPath = null;
function resolveWinget() {
    if (_wingetPath) return _wingetPath;

    // Build the candidate list fresh each pass (the self-heal step below can
    // create new ones). NOTE: we deliberately do NOT readdir Program Files\
    // WindowsApps -- that dir is ACL-locked against listing for a standard
    // user, so readdirSync throws EACCES and the old code silently lost the
    // system-wide winget.exe. We ask AppX for the install location instead;
    // the winget.exe inside stays *executable* even when the folder can't be
    // *listed*.
    const fileCandidates = () => {
        const out = [];
        const local = process.env.LOCALAPPDATA;
        if (local) {
            const base = path.join(local, 'Microsoft', 'WindowsApps');
            try {
                for (const entry of fs.readdirSync(base)) {
                    if (entry.startsWith('Microsoft.DesktopAppInstaller')) {
                        out.push(path.join(base, entry, 'winget.exe'));
                    }
                }
            } catch {}
            out.push(path.join(base, 'winget.exe')); // alias stub (spawnable in many cases)
        }
        // Real package dir via AppX -- no admin, survives the locked WindowsApps.
        const loc = psQuery(`(Get-AppxPackage -Name Microsoft.DesktopAppInstaller | Select-Object -First 1).InstallLocation`);
        if (loc) out.push(path.join(loc, 'winget.exe'));
        return out;
    };

    const pick = (cands) => {
        for (const c of cands) { try { if (fs.existsSync(c)) return c; } catch {} }
        return null;
    };

    let hit = pick(fileCandidates());

    // Self-heal: Only OS's autounattend skips the OOBE step that registers
    // DesktopAppInstaller for the user, so the per-user alias + winget.exe can
    // be missing even though the package is staged system-wide. Registering by
    // family name needs NO admin for a staged/provisioned package, recreates
    // the alias, and makes winget resolvable -- then we re-pick.
    if (!hit) {
        psQuery(`Add-AppxPackage -RegisterByFamilyName -MainPackage ${DAI_FAMILY}`);
        hit = pick(fileCandidates());
    }

    _wingetPath = hit || 'winget'; // last-resort: PATH (caller sees a real error)
    return _wingetPath;
}

const isDev = !app.isPackaged;
const MANIFEST_PATH = 'C:\\Program Files\\OnlyOS\\removed-features.json';
const EDITION_PATH  = 'C:\\Program Files\\OnlyOS\\edition.txt';
const ICON_PATH     = path.join(__dirname, '..', 'assets', 'icon.ico');

// --- app settings (tray / start-minimized). Startup-with-Windows is handled by
// Electron's loginItemSettings (OS Run key), not stored here. ----------------
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
function readSettings() {
    try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch { return {}; }
}
function writeSettings(s) {
    try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s)); } catch {}
}
let settings = Object.assign({ tray: false, startMinimized: false }, readSettings());

let mainWin = null;
let tray = null;
let isQuiting = false;

function showMainWindow() {
    if (!mainWin) { mainWin = createWindow(); return; }
    mainWin.show();
    mainWin.focus();
}

function setupTray() {
    if (tray) return;
    try {
        const img = nativeImage.createFromPath(ICON_PATH);
        tray = new Tray(img);
        tray.setToolTip('Log Pose');
        tray.setContextMenu(Menu.buildFromTemplate([
            { label: 'Abrir Log Pose', click: showMainWindow },
            { type: 'separator' },
            { label: 'Sair', click: () => { isQuiting = true; app.quit(); } },
        ]));
        tray.on('click', showMainWindow);
    } catch {}
}
function destroyTray() {
    if (tray) { tray.destroy(); tray = null; }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 720,
        resizable: false,        // fixed size â€” design is built for exactly 1100x720
        maximizable: false,
        fullscreenable: false,
        backgroundColor: '#0a0a0f',
        autoHideMenuBar: true,
        frame: false,            // frameless â€” the design provides its own titlebar
        titleBarStyle: 'hidden',
        center: true,
        show: !(settings.startMinimized && settings.tray), // start hidden to tray when asked
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        icon: ICON_PATH
    });

    mainWin = win;

    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // With "minimize to tray" on, the close button hides the window instead of
    // quitting; the tray menu's Sair (or before-quit) is the real exit.
    win.on('close', (e) => {
        if (!isQuiting && settings.tray) {
            e.preventDefault();
            win.hide();
        }
    });

    return win;
}

app.whenReady().then(() => {
    const win = createWindow();
    if (settings.tray) setupTray();

    // Auto-update: only in packaged builds. Checks GitHub Releases (only-os-releases).
    if (autoUpdater && !isDev) {
        autoUpdater.autoDownload = true;
        autoUpdater.on('update-available', (info) => {
            win.webContents.send('update:available', { version: info.version });
        });
        autoUpdater.on('update-downloaded', (info) => {
            win.webContents.send('update:ready', { version: info.version });
        });
        autoUpdater.on('error', (err) => {
            win.webContents.send('update:error', { message: String(err) });
        });
        autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
        else showMainWindow();
    });
});

app.on('before-quit', () => { isQuiting = true; });

app.on('window-all-closed', () => {
    // Keep running in the tray when enabled; otherwise quit (non-mac).
    if (settings.tray) return;
    if (process.platform !== 'darwin') app.quit();
});

// --- helpers ----------------------------------------------------------------

function streamProcess(event, channelOut, channelDone, cmd, args) {
    return new Promise((resolve) => {
        const child = spawn(cmd, args, { windowsHide: true });
        child.stdout.on('data', (d) => event.sender.send(channelOut, d.toString()));
        child.stderr.on('data', (d) => event.sender.send(channelOut, d.toString()));
        child.on('close', (code) => {
            event.sender.send(channelDone, { exitCode: code });
            resolve(code);
        });
        child.on('error', (err) => {
            event.sender.send(channelOut, `error: ${err.message}\n`);
            event.sender.send(channelDone, { exitCode: -1 });
            resolve(-1);
        });
    });
}

// --- IPC: system info -------------------------------------------------------

ipcMain.handle('system:info', async () => {
    let edition = 'unknown';
    let manifest = null;
    try { if (fs.existsSync(EDITION_PATH)) edition = fs.readFileSync(EDITION_PATH, 'utf8').trim(); } catch {}
    try { if (fs.existsSync(MANIFEST_PATH)) manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch {}
    return { edition, manifest, platform: process.platform, arch: process.arch, node: process.version, isDev };
});

// --- IPC: real hardware info (one PowerShell call returning JSON) ------------

ipcMain.handle('system:hardware', async () => {
    const ps = `
$ErrorActionPreference='SilentlyContinue'
$os  = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$gpu = Get-CimInstance Win32_VideoController | Where-Object { $_.AdapterRAM -gt 0 -or $_.Name -notmatch 'Basic|Remote' } | Select-Object -First 1
$cs  = Get-CimInstance Win32_ComputerSystem
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$ramTotal = [math]::Round($cs.TotalPhysicalMemory/1GB,1)
# FreePhysicalMemory is reported in KB.
$ramFree  = [math]::Round($os.FreePhysicalMemory/1MB,1)
$ramUsed  = [math]::Round($ramTotal - $ramFree,1)
$diskTotal = [math]::Round($disk.Size/1GB,0)
$diskFree  = [math]::Round($disk.FreeSpace/1GB,0)
$diskUsed  = $diskTotal - $diskFree
$obj = [ordered]@{
  osCaption  = $os.Caption
  osBuild    = $os.BuildNumber
  osArch     = $os.OSArchitecture
  cpuName    = ($cpu.Name).Trim()
  cpuCores   = $cpu.NumberOfCores
  cpuThreads = $cpu.NumberOfLogicalProcessors
  gpuName    = $gpu.Name
  ramTotal   = $ramTotal
  ramUsed    = $ramUsed
  diskModel  = (Get-CimInstance Win32_DiskDrive | Select-Object -First 1).Model
  diskTotal  = $diskTotal
  diskFree   = $diskFree
  diskUsed   = $diskUsed
  lastBoot   = $os.LastBootUpTime.ToString('yyyy-MM-dd HH:mm:ss')
}
$obj | ConvertTo-Json -Compress
`;
    return new Promise((resolve) => {
        execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps],
            { windowsHide: true, maxBuffer: 5 * 1024 * 1024 },
            (err, stdout) => {
                if (err || !stdout) { resolve({ ok: false }); return; }
                try { resolve({ ok: true, hw: JSON.parse(stdout.trim()) }); }
                catch { resolve({ ok: false }); }
            });
    });
});

// --- IPC: download an installer URL and open it -----------------------------
// For apps that aren't on winget (e.g. NVIDIA App). Downloads the .exe to TEMP
// and launches it so the user runs the vendor's installer themselves. Streams
// progress to the same log channel the UI already listens on.
const https = require('https');
const os = require('os');

function downloadFile(url, dest, onProgress, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'LogPose' } }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                res.resume();
                if (maxRedirects <= 0) return reject(new Error('too many redirects'));
                return resolve(downloadFile(res.headers.location, dest, onProgress, maxRedirects - 1));
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const total = parseInt(res.headers['content-length'] || '0', 10);
            let got = 0;
            const out = fs.createWriteStream(dest);
            res.on('data', (chunk) => {
                got += chunk.length;
                if (total) onProgress?.(Math.round((got / total) * 100), got, total);
            });
            res.pipe(out);
            out.on('finish', () => out.close(() => resolve()));
            out.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(120000, () => { req.destroy(new Error('timeout')); });
    });
}

ipcMain.handle('app:download-run', async (event, payload) => {
    const { key, url, fileName } = payload || {};
    const out = (s) => event.sender.send(`dlrun:out:${key}`, s);
    const done = (ok, err) => event.sender.send(`dlrun:done:${key}`, { ok, error: err });
    try {
        if (typeof url !== 'string' || !url.startsWith('https://')) throw new Error('invalid url');
        const safeName = (fileName || 'installer.exe').replace(/[^A-Za-z0-9._-]/g, '_');
        const dest = path.join(os.tmpdir(), safeName);
        out(`==> Downloading ${url}\n`);
        let lastPct = -1;
        await downloadFile(url, dest, (pct) => {
            if (pct !== lastPct && pct % 5 === 0) { out(`    ${pct}%\n`); lastPct = pct; }
        });
        out(`==> Download complete: ${dest}\n==> Opening installer...\n`);
        // Open the installer for the user to run (no silent flag -- they control it).
        await shell.openPath(dest);
        done(true);
        return { ok: true };
    } catch (e) {
        out(`error: ${e.message}\n`);
        done(false, e.message);
        return { ok: false, error: e.message };
    }
});

// --- IPC: winget install ----------------------------------------------------

ipcMain.handle('winget:install', async (event, packageId) => {
    if (!/^[A-Za-z0-9._+\-]+$/.test(packageId)) return { ok: false, error: 'invalid package id' };
    const args = [
        'install', '--id', packageId, '--exact', '--silent',
        '--accept-package-agreements', '--accept-source-agreements',
        '--disable-interactivity'
    ];
    const code = await streamProcess(event, `winget:out:${packageId}`, `winget:done:${packageId}`, resolveWinget(), args);
    return { ok: code === 0, exitCode: code };
});

// --- IPC: winget list (which of our catalog ids are installed) --------------

// Maps catalog ids to substrings that may appear in the winget list "Name"
// column for apps installed outside winget (which show ARP\... ids).
const NAME_FALLBACK = {
    'Git.Git':                     ['Git'],
    'OpenJS.NodeJS.LTS':           ['Node.js'],
    'Valve.Steam':                 ['Steam'],
    'Microsoft.VisualStudioCode':  ['Visual Studio Code', 'Microsoft Visual Studio Code'],
    'voidtools.Everything':        ['Everything'],
    'EpicGames.EpicGamesLauncher': ['Epic Games Launcher'],
    'RiotGames.RiotClient':        ['Riot Client'],
    'Discord.Discord':             ['Discord'],
    'Spotify.Spotify':             ['Spotify'],
};

ipcMain.handle('winget:list', async (event, catalogIds) => {
    const catalog = Array.isArray(catalogIds) ? catalogIds : [];
    return new Promise((resolve) => {
        execFile(resolveWinget(), ['list', '--accept-source-agreements', '--disable-interactivity'],
            { windowsHide: true, maxBuffer: 20 * 1024 * 1024 },
            (err, stdout) => {
                if (!stdout) { resolve({ ok: false, installed: [] }); return; }

                // winget interleaves progress spinners (\ | / -) and ANSI/control chars
                // before the real table. Strip ANSI, drop spinner-only lines, then parse.
                const clean = stdout
                    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')   // ANSI escape sequences
                    .replace(/[\r\b]/g, '\n');                // CR/backspace -> newline
                const lines = clean.split('\n').filter(l => l.trim() && !/^[\s\\|/-]+$/.test(l));

                // The real header line contains Name + Id + Version (and usually Source).
                let idCol = -1, nameCol = 0, headerIdx = -1;
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (/\bName\b/.test(line) && /\bId\b/.test(line) && /\bVersion\b/.test(line)) {
                        nameCol = line.indexOf('Name');
                        idCol = line.indexOf('Id', nameCol);
                        headerIdx = i;
                        break;
                    }
                }

                const exactIds = new Set();   // ids straight from the Id column
                const names = [];             // full Name column text per row (for fallback)
                if (idCol >= 0 && headerIdx >= 0) {
                    // Only parse rows AFTER the header (skip the ---- separator line too).
                    for (let i = headerIdx + 1; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.length < idCol) continue;
                        if (/^[-\s]+$/.test(line)) continue;
                        const idField = line.slice(idCol).trim().split(/\s{2,}/)[0];
                        const nameField = line.slice(nameCol, idCol).trim();
                        if (idField && /^[A-Za-z0-9]/.test(idField)) exactIds.add(idField);
                        if (nameField) names.push(nameField.toLowerCase());
                    }
                }

                // Match catalog ids: exact id present OR name-fallback substring present.
                const installed = [];
                for (const app of catalog) {
                    if (exactIds.has(app)) { installed.push(app); continue; }
                    const fb = NAME_FALLBACK[app];
                    if (fb && fb.some(s => names.some(n => n.includes(s.toLowerCase())))) {
                        installed.push(app);
                    }
                }
                resolve({ ok: true, installed });
            });
    });
});

// --- IPC: winget uninstall --------------------------------------------------

ipcMain.handle('winget:uninstall', async (event, packageId) => {
    if (!/^[A-Za-z0-9._+\-]+$/.test(packageId)) return { ok: false, error: 'invalid package id' };
    const args = ['uninstall', '--id', packageId, '--exact', '--silent', '--disable-interactivity'];
    const code = await streamProcess(event, `unins:out:${packageId}`, `unins:done:${packageId}`, resolveWinget(), args);
    return { ok: code === 0, exitCode: code };
});

// --- IPC: full wipe (uninstall + leftover folders/registry) -----------------
// Known leftover locations per app id. Only paths we are confident about.
const WIPE_PATHS = {
    'Discord.Discord':              ['%APPDATA%\\discord', '%LOCALAPPDATA%\\Discord'],
    'Google.Chrome':                ['%LOCALAPPDATA%\\Google\\Chrome', '%APPDATA%\\Google\\Chrome'],
    'Mozilla.Firefox':              ['%APPDATA%\\Mozilla', '%LOCALAPPDATA%\\Mozilla'],
    'Brave.Brave':                  ['%LOCALAPPDATA%\\BraveSoftware'],
    'Valve.Steam':                  ['%LOCALAPPDATA%\\Steam'],
    'EpicGames.EpicGamesLauncher':  ['%LOCALAPPDATA%\\EpicGamesLauncher', '%PROGRAMDATA%\\Epic'],
    'Spotify.Spotify':              ['%APPDATA%\\Spotify', '%LOCALAPPDATA%\\Spotify'],
    'OBSProject.OBSStudio':         ['%APPDATA%\\obs-studio'],
    'Microsoft.VisualStudioCode':   ['%APPDATA%\\Code', '%USERPROFILE%\\.vscode'],
};

ipcMain.handle('app:wipe', async (event, packageId) => {
    if (!/^[A-Za-z0-9._+\-]+$/.test(packageId)) return { ok: false, error: 'invalid package id' };
    const ch = (s) => event.sender.send(`wipe:out:${packageId}`, s);

    ch(`==> Uninstalling ${packageId}...\n`);
    await streamProcess(event, `wipe:out:${packageId}`, `wipe:_uninstall_done:${packageId}`,
        resolveWinget(), ['uninstall', '--id', packageId, '--exact', '--silent', '--disable-interactivity']);

    const folders = WIPE_PATHS[packageId] || [];
    if (folders.length === 0) {
        ch('==> No known leftover folders for this app. Uninstall complete.\n');
    } else {
        for (const raw of folders) {
            const expanded = raw.replace(/%([^%]+)%/g, (_, v) => process.env[v] || '');
            if (expanded && fs.existsSync(expanded)) {
                try {
                    fs.rmSync(expanded, { recursive: true, force: true });
                    ch(`==> Removed ${expanded}\n`);
                } catch (e) {
                    ch(`==> Could not remove ${expanded}: ${e.message}\n`);
                }
            }
        }
    }
    ch('==> Wipe complete.\n');
    event.sender.send(`wipe:done:${packageId}`, { exitCode: 0 });
    return { ok: true };
});

// --- IPC: DISM capability restore -------------------------------------------

ipcMain.handle('feature:restore', async (event, capabilityName) => {
    // Only allow safe-looking capability/feature names
    if (!/^[A-Za-z0-9.~_+\-]+$/.test(capabilityName)) return { ok: false, error: 'invalid name' };
    const args = ['/Online', '/Add-Capability', `/CapabilityName:${capabilityName}`];
    const code = await streamProcess(event, `feature:out:${capabilityName}`, `feature:done:${capabilityName}`, 'dism.exe', args);
    return { ok: code === 0, exitCode: code };
});

// --- IPC: maintenance actions -----------------------------------------------

const MAINTENANCE = {
    'flush-dns':       { cmd: 'ipconfig', args: ['/flushdns'] },
    'restart-explorer':{ cmd: 'powershell', args: ['-NoProfile','-Command','Stop-Process -Name explorer -Force; Start-Sleep 1; if(-not(Get-Process explorer -ErrorAction SilentlyContinue)){Start-Process explorer}'] },
    'clear-temp':      { cmd: 'powershell', args: ['-NoProfile','-Command','Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue; Write-Output "temp cleared"'] },
    'check-updates':   { cmd: 'powershell', args: ['-NoProfile','-Command','Write-Output "Opening Windows Update..."; Start-Process ms-settings:windowsupdate'] },
    // Repair system files + component store.
    'repair':          { cmd: 'powershell', args: ['-NoProfile','-Command','Write-Output "=== SFC /scannow ==="; sfc /scannow; Write-Output "=== DISM RestoreHealth ==="; DISM /Online /Cleanup-Image /RestoreHealth'] },
    // Microsoft Store: re-register from the staged package if present, then
    // wsreset -i as a fallback reinstall. (Build removes Store by default.)
    'add-store':       { cmd: 'powershell', args: ['-NoProfile','-Command','Get-AppxPackage -AllUsers *WindowsStore* | ForEach-Object { Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\\AppxManifest.xml" -ErrorAction SilentlyContinue }; Start-Process wsreset.exe -ArgumentList "-i"; Write-Output "Store re-add triggered (wsreset may take a minute)."'] },
    'remove-store':    { cmd: 'powershell', args: ['-NoProfile','-Command','Get-AppxPackage -AllUsers *WindowsStore* | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue; Write-Output "Store removed."'] },
    // OneDrive: build strips the binaries, so re-add via winget.
    'add-onedrive':    { winget: ['install','--id','Microsoft.OneDrive','-e','--silent','--accept-package-agreements','--accept-source-agreements'] },
    // System Restore checkpoint (safety net before tweaks). Enables protection on
    // C:, clears the 24h throttle so it always creates, then checkpoints.
    'restore-point':   { cmd: 'powershell', args: ['-NoProfile','-Command',
        'Write-Output "Enabling System Restore on C:..."; ' +
        'Enable-ComputerRestore -Drive "C:\\" -ErrorAction SilentlyContinue; ' +
        'New-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore" -Name SystemRestorePointCreationFrequency -Value 0 -PropertyType DWord -Force -ErrorAction SilentlyContinue | Out-Null; ' +
        'Write-Output "Creating restore point..."; ' +
        'Checkpoint-Computer -Description "Log Pose" -RestorePointType "MODIFY_SETTINGS"; ' +
        'Write-Output "Restore point created."'] },
};

ipcMain.handle('maintenance:run', async (event, actionId) => {
    const action = MAINTENANCE[actionId];
    if (!action) return { ok: false, error: 'unknown action' };
    const cmd  = action.winget ? resolveWinget() : action.cmd;
    const args = action.winget || action.args;
    const code = await streamProcess(event, `maint:out:${actionId}`, `maint:done:${actionId}`, cmd, args);
    return { ok: code === 0, exitCode: code };
});

// --- IPC: external links + update control -----------------------------------

ipcMain.handle('open-external', async (event, url) => {
    if (typeof url === 'string' && url.startsWith('https://')) { await shell.openExternal(url); return { ok: true }; }
    return { ok: false };
});

ipcMain.handle('update:install', async () => {
    if (autoUpdater && !isDev) { autoUpdater.quitAndInstall(); return { ok: true }; }
    return { ok: false, error: 'updates only in packaged build' };
});

// --- IPC: tweaks (real registry/powercfg toggles) --------------------------
// Each tweak maps to an "on" command and an "off" command, plus a status probe.
// Run elevated. Registry writes use reg.exe via cmd for predictable quoting.

function regAdd(path, name, type, data) {
    return `reg add "${path}" /v ${name} /t ${type} /d ${data} /f`;
}
function regDel(path, name) {
    return `reg delete "${path}" /v ${name} /f`;
}

const DEF = 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender';
const DEFRT = 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Real-Time Protection';
const AU = 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU';
const GAMEDVR = 'HKCU\\System\\GameConfigStore';
const GRAPHICS = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers';
const SYS = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System';
const SVC = 'HKLM\\SYSTEM\\CurrentControlSet\\Services';
const DEVGUARD = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard';
const WUX = 'HKLM\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings';

// id -> { on:[cmds], off:[cmds], status:{path,name,onValue} }
const TWEAKS = {
    // Security
    'defender': {
        // "on" = Defender enabled = REMOVE the GPO + restore the services.
        // The build hard-disables Defender (GPO + services Start=4), so the
        // toggle must also reset the service start types. Tamper Protection can
        // block the live service write -- a reboot finalizes it.
        on:  [regDel(DEF,'DisableAntiSpyware'), regDel(DEF,'DisableAntiVirus'),
              regDel(DEFRT,'DisableRealtimeMonitoring'), regDel(DEFRT,'DisableBehaviorMonitoring'),
              regDel(DEFRT,'DisableOnAccessProtection'),
              regAdd(`${SVC}\\WinDefend`,'Start','REG_DWORD',2), regAdd(`${SVC}\\WdNisSvc`,'Start','REG_DWORD',3),
              regAdd(`${SVC}\\Sense`,'Start','REG_DWORD',3), regAdd(`${SVC}\\SecurityHealthService`,'Start','REG_DWORD',2)],
        off: [regAdd(DEF,'DisableAntiSpyware','REG_DWORD',1), regAdd(DEF,'DisableAntiVirus','REG_DWORD',1),
              regAdd(DEFRT,'DisableRealtimeMonitoring','REG_DWORD',1), regAdd(DEFRT,'DisableBehaviorMonitoring','REG_DWORD',1),
              regAdd(DEFRT,'DisableOnAccessProtection','REG_DWORD',1),
              regAdd(`${SVC}\\WinDefend`,'Start','REG_DWORD',4), regAdd(`${SVC}\\WdNisSvc`,'Start','REG_DWORD',4),
              regAdd(`${SVC}\\Sense`,'Start','REG_DWORD',4), regAdd(`${SVC}\\SecurityHealthService`,'Start','REG_DWORD',4)],
        // The build now REMOVES Defender (service keys + files deleted offline),
        // not just disables it. Report "on" only when the WinDefend service still
        // exists -> removed = off. UI treats this as informational (data.js
        // info:true): there is no working re-enable toggle once it's gone.
        status: { path: `${SVC}\\WinDefend`, name: 'Start' },
        needsReboot: true
    },
    // UAC prompts. "on" = normal prompts; "off" = Never Notify (no pop-ups).
    // We touch ONLY ConsentPromptBehaviorAdmin + PromptOnSecureDesktop -- never
    // FilterAdministratorToken/EnableLUA, so UWP keeps working under the
    // auto-login Administrator.
    'uac': {
        on:  [regAdd(SYS,'ConsentPromptBehaviorAdmin','REG_DWORD',5), regAdd(SYS,'PromptOnSecureDesktop','REG_DWORD',1)],
        off: [regAdd(SYS,'ConsentPromptBehaviorAdmin','REG_DWORD',0), regAdd(SYS,'PromptOnSecureDesktop','REG_DWORD',0)],
        status: { path: SYS, name: 'PromptOnSecureDesktop', onValue: '0x1' }
    },
    // Build PAUSES Windows Update to 2077 (not the NoAutoUpdate GPO). "on" =
    // auto-update = clear the pause; "off" = pause to 2077 (reversible). Status
    // reports "on" only when the pause expiry is absent.
    'auto-update': {
        on:  [regDel(WUX,'PauseUpdatesStartTime'), regDel(WUX,'PauseUpdatesExpiryTime'),
              regDel(WUX,'PauseFeatureUpdatesStartTime'), regDel(WUX,'PauseFeatureUpdatesEndTime'),
              regDel(WUX,'PauseQualityUpdatesStartTime'), regDel(WUX,'PauseQualityUpdatesEndTime')],
        off: [regAdd(WUX,'PauseUpdatesStartTime','REG_SZ','2024-01-01T00:00:00Z'),
              regAdd(WUX,'PauseUpdatesExpiryTime','REG_SZ','2077-01-01T00:00:00Z'),
              regAdd(WUX,'PauseFeatureUpdatesStartTime','REG_SZ','2024-01-01T00:00:00Z'),
              regAdd(WUX,'PauseFeatureUpdatesEndTime','REG_SZ','2077-01-01T00:00:00Z'),
              regAdd(WUX,'PauseQualityUpdatesStartTime','REG_SZ','2024-01-01T00:00:00Z'),
              regAdd(WUX,'PauseQualityUpdatesEndTime','REG_SZ','2077-01-01T00:00:00Z')],
        status: { path: WUX, name: 'PauseUpdatesExpiryTime', onWhenAbsent: true }
    },
    // Performance
    'hags': {
        on:  [regAdd(GRAPHICS,'HwSchMode','REG_DWORD',2)],
        off: [regAdd(GRAPHICS,'HwSchMode','REG_DWORD',1)],
        status: { path: GRAPHICS, name: 'HwSchMode', onValue: '2' },
        needsReboot: true
    },
    'gamedvr': {
        on:  [regAdd(GAMEDVR,'GameDVR_Enabled','REG_DWORD',1)],
        off: [regAdd(GAMEDVR,'GameDVR_Enabled','REG_DWORD',0)],
        // here "on" means DVR enabled; our tweak is "disable DVR" so invert at UI level
        status: { path: GAMEDVR, name: 'GameDVR_Enabled', onValue: '1' }
    },
    'ultimate-power': {
        on:  ['powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 >nul 2>&1 & for /f "tokens=4" %a in (\'powercfg /list ^| findstr /i "Ultimate"\') do powercfg /setactive %a'],
        off: ['powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e'],  // Balanced
        status: { probe: 'powercfg /getactivescheme', match: 'Ultimate' }
    },
    // Security: Virtualization-Based Security.
    // "on" (enabled=true) = VBS ON = restore kernel code-integrity (auto launch).
    // "off" = Gaming mode = VBS off via hypervisorlaunchtype, the ~5-8% FPS win.
    // Riot allows VBS off (VAN 9005) so it is NOT a ban vector; it is a security
    // trade-off the user opts into here. bcdedit needs a reboot to take effect.
    'vbs': {
        // Build sets VBS off via DeviceGuard\EnableVirtualizationBasedSecurity=0
        // (offline SYSTEM hive), NOT bcdedit. Match that mechanism so the toggle
        // reflects the real state: "on" (=1) restores VBS, "off" (=0) is the
        // gaming FPS win. CurrentControlSet maps to the active set at runtime.
        on:  [regAdd(DEVGUARD,'EnableVirtualizationBasedSecurity','REG_DWORD',1)],
        off: [regAdd(DEVGUARD,'EnableVirtualizationBasedSecurity','REG_DWORD',0)],
        status: { path: DEVGUARD, name: 'EnableVirtualizationBasedSecurity', onValue: '0x1' },
        needsReboot: true
    },
    // Developer
    'wsl': {
        // Enabling/disabling 3 optional features. /NoRestart so we don't auto-reboot;
        // UI shows reboot hint via needsReboot below.
        on:  ['dism /Online /Enable-Feature /FeatureName:Microsoft-Windows-Subsystem-Linux /NoRestart /Quiet',
              'dism /Online /Enable-Feature /FeatureName:VirtualMachinePlatform /NoRestart /Quiet',
              'dism /Online /Enable-Feature /FeatureName:HypervisorPlatform /NoRestart /Quiet'],
        off: ['dism /Online /Disable-Feature /FeatureName:Microsoft-Windows-Subsystem-Linux /NoRestart /Quiet',
              'dism /Online /Disable-Feature /FeatureName:VirtualMachinePlatform /NoRestart /Quiet',
              'dism /Online /Disable-Feature /FeatureName:HypervisorPlatform /NoRestart /Quiet'],
        // PowerShell enum 'State : Enabled' is locale-independent (unlike DISM's localized output)
        status: { probe: 'powershell -NoProfile -Command "(Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux).State"', match: 'Enabled' },
        needsReboot: true
    }
};

ipcMain.handle('tweak:set', async (event, { id, enabled }) => {
    const t = TWEAKS[id];
    if (!t) return { ok: false, error: 'unknown tweak' };
    const cmds = enabled ? t.on : t.off;
    for (const c of cmds) {
        await new Promise((res) => {
            execFile('cmd.exe', ['/c', c], { windowsHide: true }, () => res());
        });
    }
    return { ok: true, needsReboot: !!t.needsReboot };
});

ipcMain.handle('tweak:status', async (event, ids) => {
    const result = {};
    for (const id of (ids || [])) {
        const t = TWEAKS[id];
        if (!t || !t.status) { result[id] = null; continue; }
        const s = t.status;
        if (s.probe) {
            const out = await new Promise((res) => {
                execFile('cmd.exe', ['/c', s.probe], { windowsHide: true }, (e, so) => res(so || ''));
            });
            // notMatch: report "on" unless the matched setting equals the off-marker.
            // (e.g. bcdedit hypervisorlaunchtype: ON unless the line reads "Off";
            //  default when the line is absent is Auto = VBS on.)
            if (s.notMatch) {
                const line = out.split(/\r?\n/).find((l) => l.includes(s.match)) || '';
                result[id] = !new RegExp(s.notMatch, 'i').test(line);
            } else {
                result[id] = out.includes(s.match);
            }
        } else {
            const out = await new Promise((res) => {
                execFile('cmd.exe', ['/c', `reg query "${s.path}" /v ${s.name}`], { windowsHide: true }, (e, so) => res({ e, so: so || '' }));
            });
            const present = !out.e && new RegExp(s.name).test(out.so);
            if (s.onWhenAbsent) result[id] = !present;
            else if (s.onValue != null) result[id] = present && out.so.includes(s.onValue);
            else result[id] = present;
        }
    }
    return result;
});

// --- IPC: startup programs (boot performance) -------------------------------
// Enumerate the Run keys (HKCU + HKLM) and report each entry's enabled state
// from the same StartupApproved store Task Manager uses, so toggles here are
// reversible and consistent with the built-in UI.
ipcMain.handle('startup:list', async () => {
    const ps = `
$ErrorActionPreference='SilentlyContinue'
$runKeys = @(
  @{ hive='HKCU'; path='HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' },
  @{ hive='HKLM'; path='HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' }
)
$approved = @{
  HKCU='HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
  HKLM='HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
}
$items = @()
foreach($k in $runKeys){
  $props = Get-ItemProperty -Path $k.path
  if(-not $props){ continue }
  foreach($p in $props.PSObject.Properties){
    if($p.Name -like 'PS*'){ continue }
    $enabled = $true
    $a = Get-ItemProperty -Path $approved[$k.hive] -Name $p.Name -ErrorAction SilentlyContinue
    if($a){ $b = $a.$($p.Name); if($b -and ($b[0] -band 1)){ $enabled = $false } }
    $items += [pscustomobject]@{ name=$p.Name; command=[string]$p.Value; hive=$k.hive; enabled=$enabled }
  }
}
ConvertTo-Json -InputObject @($items) -Compress -Depth 4
`;
    return new Promise((resolve) => {
        execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps],
            { windowsHide: true, maxBuffer: 5 * 1024 * 1024 },
            (err, stdout) => {
                if (err) { resolve({ ok: false, error: String(err) }); return; }
                try {
                    const parsed = JSON.parse((stdout || '[]').trim() || '[]');
                    resolve({ ok: true, items: Array.isArray(parsed) ? parsed : [parsed] });
                } catch { resolve({ ok: true, items: [] }); }
            });
    });
});

// Enable/disable a Run entry by writing the StartupApproved binary flag
// (0x02… = enabled, 0x03… = disabled — bit0 marks disabled).
ipcMain.handle('startup:set', async (event, { name, hive, enabled }) => {
    if (!name || (hive !== 'HKCU' && hive !== 'HKLM')) return { ok: false, error: 'bad args' };
    const root = `${hive}\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run`;
    const data = (enabled ? '02' : '03') + '0000000000000000000000'; // 12-byte blob
    const code = await new Promise((res) => {
        execFile('cmd.exe', ['/c', `reg add "${root}" /v "${name}" /t REG_BINARY /d ${data} /f`],
            { windowsHide: true }, (e) => res(e ? 1 : 0));
    });
    return { ok: code === 0 };
});

// --- IPC: app behavior settings (startup / tray / start-minimized) ----------
function settingsState() {
    let openAtLogin = false;
    try { openAtLogin = app.getLoginItemSettings().openAtLogin; } catch {}
    return { startup: openAtLogin, tray: !!settings.tray, startMinimized: !!settings.startMinimized };
}

ipcMain.handle('settings:get', async () => settingsState());

ipcMain.handle('settings:set', async (event, { key, value }) => {
    value = !!value;
    if (key === 'startup') {
        // Don't auto-start in dev (would register the electron.exe dev binary).
        try { app.setLoginItemSettings({ openAtLogin: value, path: process.execPath }); } catch {}
    } else if (key === 'tray') {
        settings.tray = value;
        if (value) setupTray();
        else {
            destroyTray();
            settings.startMinimized = false; // no tray -> can't start hidden
            showMainWindow();                // make sure the window is reachable
        }
        writeSettings(settings);
    } else if (key === 'startMinimized') {
        settings.startMinimized = value;
        if (value) { settings.tray = true; setupTray(); } // implies tray
        writeSettings(settings);
    }
    return settingsState();
});

// --- IPC: winget upgrades (which installed apps have an update) --------------
ipcMain.handle('winget:upgradable', async () => {
    return new Promise((resolve) => {
        execFile(resolveWinget(),
            ['upgrade', '--include-unknown', '--accept-source-agreements', '--disable-interactivity'],
            { windowsHide: true, maxBuffer: 20 * 1024 * 1024 },
            (err, stdout) => {
                if (!stdout) { resolve({ ok: false, ids: [] }); return; }
                const clean = stdout
                    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
                    .replace(/[\r\b]/g, '\n');
                const lines = clean.split('\n').filter(l => l.trim() && !/^[\s\\|/-]+$/.test(l));
                let nameCol = 0, idCol = -1, verCol = -1, headerIdx = -1;
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (/\bName\b/.test(line) && /\bId\b/.test(line) && /\bAvailable\b/.test(line)) {
                        nameCol = line.indexOf('Name');
                        idCol = line.indexOf('Id', nameCol);
                        verCol = line.indexOf('Available', idCol);
                        headerIdx = i;
                        break;
                    }
                }
                const ids = [];
                if (idCol >= 0 && headerIdx >= 0) {
                    for (let i = headerIdx + 1; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.length < idCol || /^[-\s]+$/.test(line)) continue;
                        // Footer lines like "N upgrades available." have no Id column content.
                        const idField = line.slice(idCol, verCol > idCol ? verCol : undefined).trim().split(/\s{2,}/)[0];
                        if (idField && /^[A-Za-z0-9][A-Za-z0-9._+\-]+$/.test(idField) && idField.includes('.')) {
                            ids.push(idField);
                        }
                    }
                }
                resolve({ ok: true, ids });
            });
    });
});

ipcMain.handle('winget:upgrade', async (event, packageId) => {
    if (!/^[A-Za-z0-9._+\-]+$/.test(packageId)) return { ok: false, error: 'invalid package id' };
    const args = [
        'upgrade', '--id', packageId, '--exact', '--silent',
        '--accept-package-agreements', '--accept-source-agreements',
        '--disable-interactivity'
    ];
    const code = await streamProcess(event, `wgup:out:${packageId}`, `wgup:done:${packageId}`, resolveWinget(), args);
    return { ok: code === 0, exitCode: code };
});

// --- IPC: window controls (frameless titlebar) ------------------------------
ipcMain.on('win:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on('win:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());
