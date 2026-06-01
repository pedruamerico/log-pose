// dev-launch.js — spawns Electron with ELECTRON_RUN_AS_NODE fully removed.
// Needed because some shells inherit that var, which forces electron.exe to
// run as plain Node (then `app` is undefined). cross-env can't *delete* a var,
// only set it; this launcher deletes it then execs electron.

const { spawn } = require('child_process');
const path = require('path');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const electronBin = require('electron'); // resolves to electron.exe path
const projectRoot = path.join(__dirname, '..');

const child = spawn(electronBin, [projectRoot], {
    env,
    stdio: 'inherit',
    windowsHide: false
});

child.on('close', (code) => process.exit(code ?? 0));