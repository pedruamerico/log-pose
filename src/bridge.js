// bridge.js — no-op.
//
// The renderer (App.jsx) talks only to window.onlyOS.*, which electron/preload.js
// injects before the renderer loads. This module therefore has nothing to do; it
// stays as a stable import site in main.jsx so the renderer's import graph never
// has to change if the bridge wiring moves.

// Intentionally empty: window.onlyOS comes from the Electron preload.
export {};
