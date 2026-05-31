// render-logo.js — generates assets/icon.ico from the Log Pose compass mark.
// Renders the ornate "badge" compass (ported from the design handoff's
// logo-marks.jsx) on the dark squircle app-icon container, captures it with
// Electron's Chromium, and packs the sizes into a multi-resolution .ico.
//
// Run: npx electron scripts/render-logo.js   (or: npm run make-icon)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'assets', 'icon.ico');
const PURPLE = '#A855F7', GOLD = '#E8C77A';

// polar -> "x,y" around centre c (matches logo-marks.jsx P())
const P = (r, deg, c = 60) => {
  const a = (deg - 90) * Math.PI / 180;
  return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
};
const spike = (deg, tipR, notchR, w, light, dark) =>
  `<polygon points="${P(tipR, deg)} ${P(notchR, deg - w)} 60,60" fill="${light}"/>` +
  `<polygon points="${P(tipR, deg)} ${P(notchR, deg + w)} 60,60" fill="${dark}"/>`;

let ticks = '';
for (let i = 0; i < 48; i++) {
  const deg = i * 7.5, major = i % 6 === 0;
  const a = P(major ? 37.5 : 40, deg).split(','), b = P(43.5, deg).split(',');
  ticks += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${major ? GOLD : PURPLE}" stroke-width="${major ? 0.9 : 0.6}" opacity="${major ? 0.65 : 0.32}" stroke-linecap="round"/>`;
}
const pix = [[16, 33, 5, .9], [25, 26, 3.4, .6], [10, 45, 4, .5], [31, 38, 2.6, .45],
             [104, 87, 5, .85], [111, 79, 3.4, .55], [98, 96, 3, .45], [92, 84, 2.6, .4]];
const pixels = pix.map(p => `<rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[2]}" rx="0.6" fill="${PURPLE}" opacity="${p[3]}"/>`).join('');

const badge = `
<defs>
  <linearGradient id="gold" x1="0.15" y1="0.05" x2="0.85" y2="0.95"><stop offset="0" stop-color="#F4DD9C"/><stop offset="0.45" stop-color="#D8A94B"/><stop offset="1" stop-color="#8A621F"/></linearGradient>
  <radialGradient id="face" cx="0.5" cy="0.40" r="0.72"><stop offset="0" stop-color="#241738"/><stop offset="0.7" stop-color="#120c22"/><stop offset="1" stop-color="#0a0715"/></radialGradient>
  <linearGradient id="vlight" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9D5FF"/><stop offset="1" stop-color="#A855F7"/></linearGradient>
  <radialGradient id="hub" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#F4DD9C"/><stop offset="1" stop-color="#9A6E22"/></radialGradient>
</defs>
<circle cx="60" cy="60" r="46" fill="url(#face)"/>
${ticks}
<circle cx="60" cy="60" r="52" fill="none" stroke="url(#gold)" stroke-width="3"/>
<circle cx="60" cy="60" r="46.5" fill="none" stroke="url(#gold)" stroke-width="1" opacity="0.6"/>
${[45, 135, 225, 315].map(d => spike(d, 30, 11, 9, '#9B6FE0', '#4C1D95')).join('')}
${[90, 270].map(d => spike(d, 45, 14, 10, '#C9A4F7', '#5B21B6')).join('')}
${spike(0, 58, 16, 6.5, 'url(#vlight)', '#7C3AED')}
${spike(180, 58, 16, 6.5, '#6D28D9', '#4C1D95')}
<polygon points="${P(58, 0)} ${P(16, -6.5)} 60,60 ${P(16, 6.5)}" fill="none" stroke="url(#gold)" stroke-width="0.9"/>
<polygon points="${P(58, 180)} ${P(16, 180 - 6.5)} 60,60 ${P(16, 180 + 6.5)}" fill="none" stroke="url(#gold)" stroke-width="0.9" opacity="0.8"/>
<circle cx="60" cy="60" r="12" fill="url(#hub)"/>
<circle cx="60" cy="60" r="12" fill="none" stroke="#6A4A18" stroke-width="0.8"/>
<circle cx="60" cy="60" r="8.5" fill="#160f28"/>
<circle cx="60" cy="60" r="8.5" fill="none" stroke="${PURPLE}" stroke-width="0.8" opacity="0.55"/>
<polygon points="${P(5.5, 0)} ${P(1.6, 45)} ${P(5.5, 90)} ${P(1.6, 135)} ${P(5.5, 180)} ${P(1.6, 225)} ${P(5.5, 270)} ${P(1.6, 315)}" fill="#E9D5FF"/>
<circle cx="60" cy="60" r="1.4" fill="#fff"/>
${pixels}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;width:256px;height:256px;overflow:hidden;background:transparent}
  .squircle{width:256px;height:256px;border-radius:60px;overflow:hidden;
    background:radial-gradient(circle at 50% 36%, #1c1130 0%, #0a0712 62%, #050509 100%);
    border:1px solid rgba(168,85,247,0.26);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);
    display:flex;align-items:center;justify-content:center}
</style></head><body>
  <div class="squircle">
    <svg width="210" height="210" viewBox="0 0 120 120" style="overflow:visible;filter:drop-shadow(0 0 8px rgba(168,85,247,.55)) drop-shadow(0 0 26px rgba(124,58,237,.34))">${badge}</svg>
  </div>
</body></html>`;

app.disableHardwareAcceleration(); // deterministic software raster for the capture

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 256, height: 256, show: false, frame: false, transparent: true,
    backgroundColor: '#00000000', useContentSize: true,
    webPreferences: { offscreen: false },
  });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise(r => setTimeout(r, 400)); // let gradients/filters paint

  const img = await win.webContents.capturePage();
  if (process.env.LOGO_PREVIEW) fs.writeFileSync(process.env.LOGO_PREVIEW, img.toPNG());
  const sizes = [256, 128, 64, 48, 32, 16];
  const buffers = sizes.map(s => img.resize({ width: s, height: s, quality: 'best' }).toPNG());

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const _ptico = await import('png-to-ico');
  const pngToIco = _ptico.default || _ptico;
  const ico = await pngToIco(buffers);
  fs.writeFileSync(OUT, ico);
  console.log(`icon written: ${OUT} (${ico.length} bytes)`);

  win.destroy();
  app.quit();
}).catch(err => {
  console.error('icon generation failed:', err);
  app.exit(1);
});
