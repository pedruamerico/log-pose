// Log Pose — renderer root. Migrated from design handoff (React prototype) to Vite.
// Keeps the design's window.* data globals (populated by data.js, imported in main.jsx).
import React from 'react';
import { getIconPath } from './app-icons.js';
import { LangCtx, LANGS, initialLang, persistLang, makeT, useT } from './i18n.js';

// ============ ICONS ============
const Icon = ({ name, size = 16 }) => {
  const s = size;
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    apps:     <g {...stroke}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></g>,
    features: <g {...stroke}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /><circle cx="18" cy="18" r="2" /></g>,
    system:   <g {...stroke}><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8" /><path d="M12 17v4" /></g>,
    metrics:  <g {...stroke}><path d="M4 18V6" /><path d="M4 18h16" /><path d="m7 14 3-4 3 3 4-7" /></g>,
    tweaks:   <g {...stroke}><path d="M5 8h7" /><circle cx="15" cy="8" r="2" /><path d="M19 8h0" /><path d="M19 16h-7" /><circle cx="9" cy="16" r="2" /><path d="M5 16h0" /></g>,
    options:  <g {...stroke}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" /></g>,
    search:   <g {...stroke}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></g>,
    check:    <g {...stroke}><path d="m4 12 5 5L20 6" /></g>,
    restore:  <g {...stroke}><path d="M4 4v6h6" /><path d="M4 10a8 8 0 1 1 2 5.5" /></g>,
    refresh:  <g {...stroke}><path d="M20 4v6h-6" /><path d="M20 10A8 8 0 1 0 18 16" /></g>,
    close:    <g {...stroke}><path d="m6 6 12 12M18 6 6 18" /></g>,
    chev:     <g {...stroke}><path d="m9 6 6 6-6 6" /></g>,
    filter:   <g {...stroke}><path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" /></g>,
    download: <g {...stroke}><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></g>,
    plug:     <g {...stroke}><path d="M9 3v6" /><path d="M15 3v6" /><path d="M7 9h10v3a5 5 0 0 1-10 0V9z" /><path d="M12 17v4" /></g>,
    game:     <g {...stroke}><path d="M7 8.5h10a4 4 0 0 1 3.9 3.1l1 4.4a2.1 2.1 0 0 1-4 1.2l-.9-2A2 2 0 0 0 16.2 14H7.8a2 2 0 0 0-1.8 1.2l-.9 2a2.1 2.1 0 0 1-4-1.2l1-4.4A4 4 0 0 1 7 8.5Z" /><path d="M7 11v2M6 12h2" /><circle cx="15.5" cy="11.5" r=".6" fill="currentColor" /><circle cx="17.5" cy="13" r=".6" fill="currentColor" /></g>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

// ============ BRAND — COMPASS MARK ============
// Ported from the design handoff (logo-marks.jsx, "flat" variant). Pure vector,
// no assets. Single instance lives in the sidebar brand lockup.
const PURPLE = '#A855F7', PURPLE_DEEP = '#7C3AED', GOLD = '#E8C77A';
// polar -> "x,y" around centre c
const polar = (r, deg, c = 60) => {
  const a = (deg - 90) * Math.PI / 180;
  return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
};
const Spike = ({ deg, tipR, notchR, w, light, dark }) => (
  <g>
    <polygon points={`${polar(tipR, deg)} ${polar(notchR, deg - w)} 60,60`} fill={light} />
    <polygon points={`${polar(tipR, deg)} ${polar(notchR, deg + w)} 60,60`} fill={dark} />
  </g>
);
const Compass = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"
    style={{ filter: 'drop-shadow(0 0 3.5px rgba(168,85,247,.55)) drop-shadow(0 0 12px rgba(124,58,237,.34))', display: 'block', overflow: 'visible' }}
    aria-hidden="true">
    <defs>
      <linearGradient id="lp-gold" x1="0.15" y1="0.05" x2="0.85" y2="0.95">
        <stop offset="0" stopColor="#F4DD9C" /><stop offset="0.45" stopColor="#D8A94B" /><stop offset="1" stopColor="#8A621F" />
      </linearGradient>
      <radialGradient id="lp-hub" cx="0.5" cy="0.4" r="0.6">
        <stop offset="0" stopColor="#F4DD9C" /><stop offset="1" stopColor="#9A6E22" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#lp-gold)" strokeWidth="4" />
    <circle cx="60" cy="60" r="42" fill="#120c22" />
    {[45, 135, 225, 315].map(d => <Spike key={d} deg={d} tipR={22} notchR={10} w={11} light="#8B5CF6" dark="#5B21B6" />)}
    {[90, 270].map(d => <Spike key={d} deg={d} tipR={34} notchR={13} w={12} light="#C9A4F7" dark="#6D28D9" />)}
    <Spike deg={0} tipR={44} notchR={14} w={9} light="#D8B4FE" dark={PURPLE_DEEP} />
    <Spike deg={180} tipR={40} notchR={14} w={9} light={PURPLE_DEEP} dark="#4C1D95" />
    <circle cx="60" cy="60" r="8" fill="url(#lp-hub)" stroke="#6A4A18" strokeWidth="0.8" />
    <circle cx="60" cy="60" r="3.4" fill="#160f28" />
    <circle cx="60" cy="60" r="1.5" fill="#E9D5FF" />
  </svg>
);

// Faint cartographic compass-rose watermark for page headers (bleeds off-corner).
const CompassField = ({ color = PURPLE }) => {
  const ticks = [];
  for (let i = 0; i < 72; i++) {
    const a = (i * 5 - 90) * Math.PI / 180, major = i % 9 === 0;
    const r0 = major ? 86 : 91;
    ticks.push(<line key={i} x1={100 + r0 * Math.cos(a)} y1={100 + r0 * Math.sin(a)}
      x2={100 + 96 * Math.cos(a)} y2={100 + 96 * Math.sin(a)} stroke={color}
      strokeWidth={major ? 1 : 0.5} opacity={major ? 0.9 : 0.45} />);
  }
  return (
    <svg className="compass-field" viewBox="0 0 200 200" aria-hidden="true" style={{ overflow: 'visible' }}>
      <circle cx="100" cy="100" r="96" fill="none" stroke={color} strokeWidth="0.75" />
      <circle cx="100" cy="100" r="74" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="100" cy="100" r="52" fill="none" stroke={color} strokeWidth="0.5" opacity="0.7" />
      <path d="M100 4V196M4 100H196" stroke={color} strokeWidth="0.5" opacity="0.6" />
      <path d="M44 44L156 156M156 44L44 156" stroke={color} strokeWidth="0.4" opacity="0.4" />
      {ticks}
      <polygon points="100,30 108,100 100,170 92,100" fill={color} opacity="0.18" />
    </svg>
  );
};

// Muted per-category tones (quiet accents; violet stays primary). Keyed by the
// lowercased category name from data.js.
const TONE = {
  browser: '#7E8FD0', gaming: '#CF8BA6', social: '#6FA6CF', dev: '#6FC79C',
  media: '#CFAD78', monitoring: '#6FC7C0', utility: '#A48FD0', drivers: '#8E99AC',
};
const toneOf = (cat) => TONE[(cat || '').toLowerCase()] || PURPLE;

// ============ WINDOW CHROME ============
// Frameless window: these buttons drive the real Electron window via the
// window.onlyOS bridge. The title strip is draggable (CSS -webkit-app-region).
const win = (typeof window !== 'undefined' && window.onlyOS) || null;
const TitleBar = () => (
  <div className="titlebar" style={{ WebkitAppRegion: 'drag' }}>
    <div className="titlebar-title">Log Pose</div>
    <div className="titlebar-controls" style={{ WebkitAppRegion: 'no-drag' }}>
      <button className="tb-btn" aria-label="Minimize" onClick={() => win?.windowMinimize()}>
        <svg width="11" height="11" viewBox="0 0 11 11"><rect x="0" y="5" width="11" height="1.2" fill="currentColor" /></svg>
      </button>
      <button className="tb-btn close" aria-label="Close" onClick={() => win?.windowClose()}>
        <svg width="11" height="11" viewBox="0 0 11 11"><path d="M0 0l11 11M11 0L0 11" stroke="currentColor" strokeWidth="1.2" /></svg>
      </button>
    </div>
  </div>
);

// ============ SIDEBAR ============
const NAV = [
  { id: 'apps',     label: 'Apps',     icon: 'apps' },
  { id: 'features', label: 'Features', icon: 'features' },
  { id: 'system',   label: 'System',   icon: 'system' },
  { id: 'tweaks',   label: 'Tweaks',   icon: 'tweaks' },
  { id: 'options',  label: 'Options',  icon: 'options' },
];
// All nav items live in the top list (Options included).
const PRIMARY_NAV = NAV;

const Sidebar = ({ route, setRoute, counts, edition, version, onOpenSearch }) => {
  const t = useT();
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><Compass size={34} /></span>
        <span className="brand-word">Log Pose</span>
      </div>

      <button className="side-search" onClick={onOpenSearch} title={t('Search everything…')}>
        <span style={{ color: 'var(--text-dim)', display: 'flex' }}><Icon name="search" size={16} /></span>
        <span className="side-search-ph">{t('Search everything…')}</span>
        <span className="side-search-kbd">Ctrl K</span>
      </button>

      <nav className="nav">
        <div className="nav-section-label">{t('MANAGE')}</div>
        {PRIMARY_NAV.map(n => (
          <button
            key={n.id}
            className={'nav-item' + (route === n.id ? ' active' : '')}
            onClick={() => setRoute(n.id)}
            title={t(n.label)}
          >
            <span className="icon"><Icon name={n.icon} size={18} /></span>
            <span className="nav-label">{t(n.label)}</span>
            {counts[n.id] != null && <span className="count">{String(counts[n.id]).padStart(2, '0')}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="edition-pill" title={`${edition || 'Windows'}${version ? ' · v' + version : ''}`}>
          <span className="status-dot" />
          <span className="edition-name">{edition || 'Windows'}</span>
          {version && <span className="edition-ver">v{version}</span>}
        </div>
      </div>
    </aside>
  );
};

// Category filter chips for the Apps header (tone dot + label + count).
const CatChips = ({ cat, setCat }) => {
  const t = useT();
  return (
    <div className="cat-chips">
      {['All', ...window.CATEGORIES].map(c => {
        const num = c === 'All' ? window.APPS.length : window.APPS.filter(a => a.cat === c).length;
        const tone = c === 'All' ? null : toneOf(c);
        return (
          <button
            key={c}
            className={'cat-chip' + (cat === c ? ' active' : '')}
            onClick={() => setCat(c)}
            style={cat === c && tone ? { borderColor: tone + '88', background: tone + '1f' } : undefined}
          >
            <span className="cat-chip-dot" style={{ background: tone || 'var(--text-dim)', color: tone || 'var(--text-dim)' }} />
            <span className="cat-chip-lbl">{t(c)}</span>
            <span className="cat-chip-count">{String(num).padStart(2, '0')}</span>
          </button>
        );
      })}
    </div>
  );
};

// ============ PAGE SCAFFOLD ============
const PageHead = ({ title, desc, children, below }) => (
  <div className="page-head">
    <CompassField />
    <div className="page-head-row">
      <div className="page-head-text">
        <div className="page-title-line">
          <h1 className="page-title">{title}</h1>
        </div>
        <p className="page-desc">{desc}</p>
      </div>
      {children && <div className="page-head-actions">{children}</div>}
    </div>
    {below}
  </div>
);

// ============ APPS SCREEN ============
const AppCard = ({ app, state, onInstall, onUninstall, hasUpdate, onUpgrade }) => {
  const t = useT();
  let btn;
  if (state === 'installed') {
    btn = (
      <div className="installed-actions">
        {hasUpdate ? (
          <button className="action-icon action-icon-update" onClick={() => onUpgrade(app)} title={t('Update')} aria-label={t('Update')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 11.5a8 8 0 1 0-1.6 5.2" /><path d="M20 5.5v5h-5" />
            </svg>
            {t('Update')}
          </button>
        ) : (
          <span className="installed-check" title={t('Installed')} aria-label={t('Installed')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 12 5 5L20 6" />
            </svg>
          </span>
        )}
        <button
          className="uninstall-icon"
          onClick={() => onUninstall(app, true)}
          title="Uninstall and remove all app data and registry traces"
          aria-label="Uninstall"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /><path d="M10 11v5M14 11v5" />
          </svg>
        </button>
      </div>
    );
  } else if (state === 'installing') {
    btn = (
      <span className="action-icon action-icon-busy" title="Installing…" aria-label="Installing">
        <span className="spinner" />
      </span>
    );
  } else if (state === 'uninstalling') {
    btn = (
      <span className="action-icon action-icon-busy" title="Removing…" aria-label="Removing">
        <span className="spinner" />
      </span>
    );
  } else {
    btn = (
      <button className="action-icon action-icon-install" onClick={() => onInstall(app)} title={t('Install')} aria-label={t('Install')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.5v11" /><path d="m7.5 10 4.5 4.5 4.5-4.5" /><path d="M4.5 19.5h15" />
        </svg>
        {t('Install')}
      </button>
    );
  }
  const tone = toneOf(app.cat);
  return (
    <div className="app-row">
      <div className="app-icon" style={{
        background: `linear-gradient(155deg, ${tone}22, ${tone}0D)`,
        border: `1px solid ${tone}2E`,
        color: tone,
      }}>
        {(() => {
          const p = getIconPath(app.id);
          return p
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={p} /></svg>
            : app.icon;
        })()}
      </div>
      <div className="app-meta">
        <div className="app-name-line">
          <h3 className="app-name">{app.name}</h3>
          <span className="tag" style={{ color: tone }}>{t(app.cat)}</span>
        </div>
        <p className="app-desc" title={t(app.desc)}>{t(app.desc)}</p>
      </div>
      <div className="app-foot">
        {btn}
      </div>
    </div>
  );
};

const AppsScreen = ({ cat, installStates, onInstall, onUninstall, upgradable, onUpgrade }) => {
  const t = useT();
  const visibleCats = cat === 'All' ? window.CATEGORIES : [cat];
  const groups = visibleCats
    .map(c => ({ c, items: window.APPS.filter(a => a.cat === c) }))
    .filter(g => g.items.length);

  return (
    <div className="fade-in">
      <div className="apps-list">
        {groups.map(({ c, items }) => {
          const tone = toneOf(c);
          return (
            <section key={c} className="cat-panel">
              <div className="cat-panel-head">
                <span className="cat-dot" style={{ background: tone, boxShadow: `0 0 7px ${tone}99` }} />
                <span className="cat-panel-name">{t(c)}</span>
                <span className="cat-panel-count">{String(items.length).padStart(2, '0')}</span>
              </div>
              <div className="cat-panel-body">
                {items.map(app => (
                  <AppCard
                    key={app.id}
                    app={app}
                    state={installStates[app.id]}
                    onInstall={onInstall}
                    onUninstall={onUninstall}
                    hasUpdate={upgradable && upgradable.has(app.id)}
                    onUpgrade={onUpgrade}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

// ============ FEATURES SCREEN ============
// Debloat tab: each catalog entry's present/removed state is read live from
// the machine (installedAppx). Present packages can be removed; removed ones
// just show their state. No fiction — reflects what's actually installed.
const FeaturesScreen = ({ features, installedAppx, onRemove, onRestore, onRemoveRecommended, batchRemoving, removedSet, removingSet, loading }) => {
  const t = useT();
  const [filter, setFilter] = React.useState('all');
  const [fquery, setFquery] = React.useState('');
  const q = fquery.trim().toLowerCase();
  const isPresent = (f) => installedAppx.has(f.name) && !removedSet.has(f.name);
  const filterLabel = { all: 'All', present: 'Installed', removed: 'Removed' };

  const filtered = features.filter(f => {
    const hay = (f.label || '') + ' ' + f.name;
    if (q && !hay.toLowerCase().includes(q)) return false;
    if (filter === 'present') return isPresent(f);
    if (filter === 'removed') return !isPresent(f);
    return true;
  });
  const presentCount = features.filter(isPresent).length;

  // How many recommended items are actually present (the batch button target).
  const recommendedPresent = features.filter(f => f.recommend && isPresent(f)).length;

  // Group the filtered list by category, in FEATURE_CATEGORIES order, and within
  // each group put installed (actionable) first, then alphabetical by label.
  const catOrder = window.FEATURE_CATEGORIES || [];
  const groups = catOrder
    .map(cat => ({
      cat,
      rows: filtered
        .filter(f => (f.cat || 'Outros') === cat)
        .sort((a, b) => {
          const pa = isPresent(a) ? 0 : 1, pb = isPresent(b) ? 0 : 1;
          if (pa !== pb) return pa - pb;
          return (a.label || a.name).localeCompare(b.label || b.name);
        }),
    }))
    .filter(g => g.rows.length > 0);

  const renderRow = (f) => {
    const present = isPresent(f);
    const removing = removingSet.has(f.name);
    return (
      <div className="list-row" key={f.name}>
        <span className="feat-name" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span>{f.label || f.name}{f.recommend && <span className="recommend" style={{ marginLeft: 8 }}>{t('Recommended')}</span>}</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{f.type}</span>
        <span>
          {present ? (
            <span className="status-chip status-kept"><span className="d" />{t('Installed')}</span>
          ) : (
            <span className="status-chip status-removed"><span className="d" />{t('Removed')}</span>
          )}
        </span>
        <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {present ? (
            <button className="btn btn-sm" disabled={removing || batchRemoving} onClick={() => onRemove(f)}>
              <Icon name="trash" size={12} />
              {removing ? t('Removing…') : t('Remove')}
            </button>
          ) : (
            <button className="btn btn-sm" disabled={removing || batchRemoving} onClick={() => onRestore(f)}>
              <Icon name="refresh" size={12} />
              {removing ? t('Restoring…') : t('Restore')}
            </button>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-mute)' }}>
          {loading ? t('Reading installed apps…') : (
            <>
              <span style={{ color: 'var(--text)' }}>{presentCount}</span> {t('installed')}
              <span style={{ margin: '0 8px', color: 'var(--text-dim)' }}>·</span>
              {features.length - presentCount} {t('removed')}
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {recommendedPresent > 0 && (
            <button className="btn btn-sm" disabled={batchRemoving} onClick={onRemoveRecommended} title={t('Remove all recommended items that are installed')}>
              <Icon name="trash" size={12} />
              {batchRemoving ? t('Removing…') : `${t('Remove recommended')} (${recommendedPresent})`}
            </button>
          )}
          <div className="search" style={{ width: 200 }}>
            <span style={{ color: 'var(--text-dim)', display:'flex' }}><Icon name="search" size={14} /></span>
            <input value={fquery} onChange={e => setFquery(e.target.value)} placeholder={t('Filter features…')} />
          </div>
          <div className="feat-filters">
            {['all', 'present', 'removed'].map(k => (
              <button key={k} className={'feat-filter' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>
                {t(filterLabel[k])}
              </button>
            ))}
          </div>
        </div>
      </div>

      {groups.map(g => (
        <React.Fragment key={g.cat}>
          <div className="section-label" style={{ marginTop: 18 }}>{t(g.cat)}</div>
          <div className="list">
            <div className="list-head">
              <span>{t('Name')}</span>
              <span>{t('Type')}</span>
              <span>{t('Status')}</span>
              <span style={{ textAlign: 'right' }}>{t('Action')}</span>
            </div>
            {g.rows.map(renderRow)}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

// ============ STARTUP MANAGER (boot performance) ============
// Lists the Run-key startup entries and toggles them via the StartupApproved
// store (same mechanism as Task Manager — reversible, no entries deleted).
const StartupManager = () => {
  const bridge = (typeof window !== 'undefined' && window.onlyOS) || null;
  const [items, setItems] = React.useState(null); // null = loading
  const [busy, setBusy] = React.useState({});

  const load = React.useCallback(() => {
    if (!bridge?.listStartup) { setItems([]); return; }
    setItems(null);
    bridge.listStartup().then(r => setItems(r?.ok ? r.items : [])).catch(() => setItems([]));
  }, [bridge]);
  React.useEffect(() => { load(); }, [load]);

  const toggle = async (it) => {
    if (!bridge?.setStartup) return;
    const key = it.hive + '|' + it.name;
    const next = !it.enabled;
    setBusy(b => ({ ...b, [key]: true }));
    const r = await bridge.setStartup(it.name, it.hive, next).catch(() => ({ ok: false }));
    setItems(list => list.map(x => (x.name === it.name && x.hive === it.hive) ? { ...x, enabled: r?.ok ? next : x.enabled } : x));
    setBusy(b => ({ ...b, [key]: false }));
  };

  const enabledCount = items ? items.filter(i => i.enabled).length : 0;
  const t = useT();

  return (
    <>
      <div className="section-label" style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{t('Startup programs')}</span>
        {items && items.length > 0 && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
            {enabledCount} {t('on')} / {items.length}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={load} title={t('Reload')}><Icon name="refresh" size={13} />{t('Reload')}</button>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--text-mid)' }}>
        {t('Disable what you don’t need at boot — fewer entries means a faster, lighter startup. Toggling is reversible.')}
      </p>
      <div className="tweak-card">
        {items === null ? (
          <div className="startup-empty"><span className="spinner" /> {t('Reading startup entries…')}</div>
        ) : items.length === 0 ? (
          <div className="startup-empty">{bridge ? t('No user startup programs found.') : t('No backend (browser preview).')}</div>
        ) : (
          items.map(it => {
            const key = it.hive + '|' + it.name;
            return (
              <div className="tweak-row" key={key}>
                <div className="tweak-text">
                  <h4 className="tweak-name">
                    {it.name}
                    <span className="startup-scope">{it.hive === 'HKLM' ? t('All users') : t('You')}</span>
                  </h4>
                  <p className="tweak-desc startup-cmd" title={it.command}>{it.command}</p>
                </div>
                <button
                  className={'toggle' + (it.enabled ? ' on' : '') + (busy[key] ? ' busy' : '')}
                  aria-pressed={it.enabled}
                  disabled={busy[key]}
                  onClick={() => toggle(it)}
                />
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

// ============ SYSTEM SCREEN ============
const SystemScreen = ({ onAction, rows }) => {
  const t = useT();
  return (
  <div className="fade-in">
    <div className="sys-card">
      {(rows || []).map(row => (
        <div className="sys-row" key={row.key}>
          <span className="sys-key">{row.key}</span>
          <span className="sys-val">
            <span>{row.val}</span>
            {row.usage != null && (
              <span className="sys-bar"><span style={{ width: (row.usage * 100).toFixed(0) + '%' }} /></span>
            )}
            {row.sub && <span className="sub">{row.sub}</span>}
          </span>
        </div>
      ))}
    </div>

    <StartupManager />

    <div className="section-label" style={{ marginTop: 28 }}>{t('Maintenance')}</div>
    <div className="tweak-card">
      {[
        { key: 'Clear temp files',            name: t('Clear temp files'),   desc: t('Free up disk space from the temp folder.') },
        { key: 'Flush DNS',                   name: t('Flush DNS'),          desc: t('Reset the DNS resolver cache.') },
        { key: 'Restart Explorer',            name: t('Restart Explorer'),   desc: t('Reload the desktop, taskbar and tray.') },
        { key: 'Check for updates',           name: t('Check for updates'),  desc: t('Open Windows Update.') },
        { key: 'Repair Windows (SFC + DISM)', name: t('Repair (SFC + DISM)'),desc: t('Scan and repair system files.') },
        { key: 'Create restore point',        name: t('Create restore point'), desc: t('Take a System Restore snapshot before changes.') },
      ].map(a => (
        <div className="tweak-row" key={a.key}>
          <div className="tweak-text">
            <h4 className="tweak-name">{a.name}</h4>
            <p className="tweak-desc">{a.desc}</p>
          </div>
          <button className="btn btn-sm" onClick={() => onAction(a.key)}>{t('Run')}</button>
        </div>
      ))}
    </div>

    <div className="section-label" style={{ marginTop: 28 }}>{t('Components')}</div>
    <div className="tweak-card">
      {[
        { key: 'Add Microsoft Store',    name: t('Add Store'),         desc: t('Re-register the Microsoft Store.') },
        { key: 'Remove Microsoft Store', name: t('Remove Store'),      desc: t('Uninstall the Microsoft Store.') },
        { key: 'Reinstall OneDrive',     name: t('Reinstall OneDrive'),desc: t('Install OneDrive via winget.') },
      ].map(a => (
        <div className="tweak-row" key={a.key}>
          <div className="tweak-text">
            <h4 className="tweak-name">{a.name}</h4>
            <p className="tweak-desc">{a.desc}</p>
          </div>
          <button className="btn btn-sm" onClick={() => onAction(a.key)}>{t('Run')}</button>
        </div>
      ))}
    </div>
  </div>
  );
};

// ============ TWEAKS SCREEN ============
const TweaksScreen = ({ tweaks, onToggle, gameModeOn, gameBusy, onToggleGameMode, services, serviceStatus, onToggleService, coreIso, onOpenCoreIso }) => {
  const t = useT();
  const visibleServices = (services || []).filter(s => serviceStatus[s.name]?.exists);
  return (
  <div className="fade-in">
    <div className={'game-mode' + (gameModeOn ? ' on' : '')}>
      <div className="game-mode-icon"><Icon name="game" size={22} /></div>
      <div className="game-mode-text">
        <h4 className="game-mode-title">{t('Game Mode')} {gameModeOn && <span className="game-mode-live">{t('Active')}</span>}</h4>
        <p className="game-mode-desc">
          {t('One switch for max FPS: Ultimate power plan, GPU scheduling on, Game DVR & VBS off. Reverts to balanced & secure when off. VBS change needs a restart.')}
        </p>
      </div>
      <button
        className={'toggle game-mode-toggle' + (gameModeOn ? ' on' : '') + (gameBusy ? ' busy' : '')}
        aria-pressed={gameModeOn}
        disabled={gameBusy}
        onClick={onToggleGameMode}
      />
    </div>

    {/* Core Isolation / Memory Integrity — read-only posture check. We detect
        and warn (Valorant/Vanguard needs it on); we never force-enable it. */}
    {coreIso && (
      <div className={'game-mode' + (coreIso.hvci ? ' on' : '')}>
        <div className="game-mode-icon"><Icon name={coreIso.hvci ? 'check' : 'game'} size={22} /></div>
        <div className="game-mode-text">
          <h4 className="game-mode-title">
            {t('Memory Integrity (Core Isolation)')}{' '}
            {coreIso.hvci && <span className="game-mode-live">{t('On')}</span>}
          </h4>
          <p className="game-mode-desc">
            {coreIso.hvci
              ? t('On — the Valorant/Vanguard requirement is met.')
              : t('Off — Valorant (Vanguard) requires it on. Open Windows settings to enable it; Windows checks driver compatibility first.')}
          </p>
        </div>
        {!coreIso.hvci && (
          <button className="btn btn-sm" onClick={onOpenCoreIso}>{t('Open settings')}</button>
        )}
      </div>
    )}

    {Object.entries(tweaks).map(([group, rows]) => (
      <React.Fragment key={group}>
        <div className="section-label">{t(group)}</div>
        <div className="tweak-card">
          {/* Recommended first, then the rest — keeps order stable within each tier. */}
          {[...rows].sort((a, b) => (b.recommend ? 1 : 0) - (a.recommend ? 1 : 0)).map(tw => (
            <div className="tweak-row" key={tw.id}>
              <div className="tweak-text">
                <h4 className="tweak-name">
                  {t(tw.name)}
                  {tw.recommend && <span className="recommend">{t('Recommended')}</span>}
                </h4>
                <p className="tweak-desc">{t(tw.desc)}</p>
              </div>
              <button
                className={'toggle' + (tw.on ? ' on' : '') + (tw.busy ? ' busy' : '')}
                aria-pressed={tw.on}
                disabled={tw.busy}
                onClick={() => onToggle(group, tw.id)}
              />
            </div>
          ))}
        </div>
      </React.Fragment>
    ))}

    {/* Service optimization — reversible. Only services present on this machine
        show up. "On" = reduced; off restores the Windows default. */}
    {visibleServices.length > 0 && (
      <>
        <div className="section-label">{t('Services')}</div>
        <div className="tweak-card">
          {visibleServices.map(s => {
            const st = serviceStatus[s.name] || {};
            return (
              <div className="tweak-row" key={s.name}>
                <div className="tweak-text">
                  <h4 className="tweak-name">{t(s.label)}</h4>
                  <p className="tweak-desc">{t(s.desc)}</p>
                </div>
                <button
                  className={'toggle' + (st.optimized ? ' on' : '') + (st.busy ? ' busy' : '')}
                  aria-pressed={!!st.optimized}
                  disabled={st.busy}
                  onClick={() => onToggleService(s.name)}
                />
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
  );
};

// ============ LOG DRAWER ============
const LogDrawer = ({ entry, onClose }) => {
  const t = useT();
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [entry && entry.lines.length]);

  const open = !!entry;
  return (
    <div className={'log-drawer' + (open ? ' open' : '')}>
      {entry && (
        <>
          <div className="log-head">
            {!entry.done
              ? <span className="spinner" />
              : entry.ok === false
                ? <span style={{ color: 'var(--red)', display:'flex' }}><Icon name="close" size={14} /></span>
                : <span style={{ color: 'var(--green)', display:'flex' }}><Icon name="check" size={14} /></span>}
            <div>
              <div className="name">
                {!entry.done ? t('Installing') : entry.ok === false ? t('Failed to install') : t('Installed')} {entry.app.name}
              </div>
              <div className="sub">{entry.app.id}</div>
            </div>
            <button className="close-x" onClick={onClose} aria-label="Close log"><Icon name="close" size={14} /></button>
          </div>
          <div className="log-body" ref={bodyRef}>
            {entry.lines.map((ln, i) => (
              <div key={i} className={'log-line ' + (ln.kind || '')}>
                <span className="prompt">$</span> {ln.text}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============ DOWNLOAD CENTER ============
const DL_LABEL = { queued: 'Na fila', running: 'Instalando…', done: 'Instalado', failed: 'Falhou' };
// For kind:'download' apps we only download and open the vendor installer — we
// can't confirm the user finished it. Don't claim "Instalado"; say the installer
// was opened (downloading shows "Baixando…" instead of "Instalando…").
const dlLabel = (d) => {
  if (d.app.kind === 'download') {
    if (d.status === 'running') return 'Baixando…';
    if (d.status === 'done') return 'Instalador aberto';
  }
  return DL_LABEL[d.status] || d.status;
};
const DownloadCenter = ({ items, onClear }) => {
  const [open, setOpen] = React.useState(null);
  if (!items.length) return null;
  const active = items.filter(d => d.status === 'queued' || d.status === 'running').length;
  return (
    <div className="dl-center">
      <div className="dl-head">
        <span className="spinner" style={{ visibility: active ? 'visible' : 'hidden' }} />
        <div className="dl-title">
          Downloads
          <span className="dl-count">{active ? `${active} em andamento` : `${items.length} concluído${items.length > 1 ? 's' : ''}`}</span>
        </div>
        <button className="dl-clear" onClick={onClear} title="Limpar concluídos"><Icon name="check" size={13} /></button>
      </div>
      <div className="dl-list">
        {items.map(d => {
          const isOpen = open === d.key;
          return (
            <div key={d.key} className={'dl-item ' + d.status}>
              <div className="dl-row" onClick={() => setOpen(o => (o === d.key ? null : d.key))}>
                <span className="dl-app-icon">{d.app.icon}</span>
                <div className="dl-meta">
                  <div className="dl-name">{d.app.name}</div>
                  <div className="dl-sub">{dlLabel(d)}</div>
                </div>
                <span className="dl-glyph">
                  {d.status === 'running' ? <span className="spinner" />
                    : d.status === 'queued' ? <span className="dl-dot" />
                    : d.status === 'failed' ? <span style={{ color: 'var(--red)', display: 'flex' }}><Icon name="close" size={13} /></span>
                    : <span style={{ color: 'var(--green)', display: 'flex' }}><Icon name="check" size={13} /></span>}
                </span>
              </div>
              {isOpen && (
                <div className="dl-log">
                  {d.lines.length === 0
                    ? <div className="log-line dim"><span className="prompt">$</span> aguardando…</div>
                    : d.lines.map((ln, i) => (
                        <div key={i} className={'log-line ' + (ln.kind || '')}><span className="prompt">$</span> {ln.text}</div>
                      ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// (Removed: the simulated MetricsScreen dashboard — fake CPU/RAM/GPU series,
// processes, disk segments. Out of scope; Log Pose is install + tweaks.)

// ============ COMMAND PALETTE ============
const CommandPalette = ({ open, onClose, items }) => {
  const t = useT();
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);

  const ql = q.trim().toLowerCase();
  const filtered = ql
    ? items.filter(it =>
        it.label.toLowerCase().includes(ql) ||
        (it.hint || '').toLowerCase().includes(ql) ||
        (it.keywords || '').toLowerCase().includes(ql))
    : items;

  // Group preserved by source order
  const groups = [];
  const map = new Map();
  filtered.forEach(it => {
    if (!map.has(it.group)) { const arr = []; map.set(it.group, arr); groups.push({ name: it.group, items: arr }); }
    map.get(it.group).push(it);
  });

  React.useEffect(() => { setActive(0); }, [q]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(filtered.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = filtered[active];
      if (it) { it.run(); onClose(); }
    }
  };

  if (!open) return null;

  let runningIdx = -1;
  return (
    <div className="cmdk-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk" onKeyDown={onKey} role="dialog" aria-label="Command palette">
        <div className="cmdk-input-row">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            className="cmdk-input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('Search apps, tweaks, navigate…')}
          />
          <span className="esc">Esc</span>
        </div>
        <div className="cmdk-results">
          {filtered.length === 0 ? (
            <div className="cmdk-empty">{t('No matches for')} “{q}”.</div>
          ) : groups.map(g => (
            <div key={g.name}>
              <div className="cmdk-group-label">{t(g.name)}</div>
              {g.items.map(it => {
                runningIdx++;
                const isActive = runningIdx === active;
                return (
                  <button
                    key={it.id}
                    className={'cmdk-item' + (isActive ? ' active' : '')}
                    onClick={() => { it.run(); onClose(); }}
                    onMouseEnter={() => setActive(runningIdx)}
                  >
                    {it.leading && <span className="leading">{it.leading}</span>}
                    <span className="label">{it.label}</span>
                    {it.hint && <span className="hint">{it.hint}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cmdk-foot">
          <span><span className="k">↑↓</span>{t('navigate')}</span>
          <span><span className="k">↵</span>{t('select')}</span>
          <span><span className="k">esc</span>{t('close')}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)' }}>{filtered.length} {t('results')}</span>
        </div>
      </div>
    </div>
  );
};

// ============ OPTIONS SCREEN ============
const OptionsScreen = ({ version, updateState, onCheckUpdates, onInstallUpdate, behavior, onToggleBehavior, edition, lang, setLang }) => {
  const t = useT();
  return (
  <div className="fade-in">
    {/* Language */}
    <div className="section-label">{t('Language')}</div>
    <div className="tweak-card">
      <div className="tweak-row">
        <div className="tweak-text">
          <h4 className="tweak-name">{t('Language')}</h4>
          <p className="tweak-desc">{t('Interface language. Technical terms stay in English.')}</p>
        </div>
        <div className="lang-seg">
          {LANGS.map(l => (
            <button
              key={l.id}
              className={'lang-opt' + (lang === l.id ? ' active' : '')}
              onClick={() => setLang(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Updates */}
    <div className="section-label">{t('Updates')}</div>
    <div className="tweak-card">
      <div className="tweak-row">
        <div className="tweak-text">
          <h4 className="tweak-name">{t('Current version')} <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-mid)', fontWeight: 400 }}>{version}</span></h4>
          <p className="tweak-desc">
            {updateState === 'available' ? t('An update is available.')
              : updateState === 'checking' ? t('Checking for updates…')
              : t('You are on the latest version.')}
          </p>
        </div>
        {updateState === 'available'
          ? <button className="btn btn-primary" onClick={onInstallUpdate}>{t('Restart & install')}</button>
          : <button className="btn" onClick={onCheckUpdates}><Icon name="refresh" size={13} />{t('Check for updates')}</button>}
      </div>
    </div>

    {/* Behavior */}
    <div className="section-label">{t('Behavior')}</div>
    <div className="tweak-card">
      <div className="tweak-row">
        <div className="tweak-text">
          <h4 className="tweak-name">{t('Start with Windows')}</h4>
          <p className="tweak-desc">{t('Launch Log Pose automatically when you sign in.')}</p>
        </div>
        <button className={'toggle' + (behavior.startup ? ' on' : '')} aria-pressed={behavior.startup} onClick={() => onToggleBehavior('startup')} />
      </div>
      <div className="tweak-row">
        <div className="tweak-text">
          <h4 className="tweak-name">{t('Minimize to tray')}</h4>
          <p className="tweak-desc">{t('Keep running in the system tray when closed.')}</p>
        </div>
        <button className={'toggle' + (behavior.tray ? ' on' : '')} aria-pressed={behavior.tray} onClick={() => onToggleBehavior('tray')} />
      </div>
      <div className="tweak-row">
        <div className="tweak-text">
          <h4 className="tweak-name">{t('Start minimized to tray')}</h4>
          <p className="tweak-desc">{t('Launch hidden in the tray (enables minimize to tray).')}</p>
        </div>
        <button className={'toggle' + (behavior.startMinimized ? ' on' : '')} aria-pressed={behavior.startMinimized} onClick={() => onToggleBehavior('startMinimized')} />
      </div>
    </div>

    {/* About */}
    <div className="section-label">{t('About')}</div>
    <div className="sys-card">
      <div className="sys-row">
        <span className="sys-key">Log Pose</span>
        <span className="sys-val"><span>{t('Windows app installer, debloat and tweaks — in one place.')}</span></span>
      </div>
      <div className="sys-row">
        <span className="sys-key">{t('Edition')}</span>
        <span className="sys-val"><span>{edition}</span></span>
      </div>
      <div className="sys-row">
        <span className="sys-key">GitHub</span>
        <span className="sys-val"><a href="https://github.com/pedruamerico" style={{ color: 'var(--purple)' }}>github.com/pedruamerico</a></span>
      </div>
    </div>
  </div>
  );
};

// ============ UPDATE MODAL ============
// Proactive "new version" prompt. Shows on launch (the main process checks
// GitHub Releases on whenReady) and live while the window is open (main polls
// every 6h). The install button stays disabled until the package finished
// downloading (electron-updater autoDownload), since quitAndInstall needs the
// downloaded file. Dismissing hides it; a later update:ready re-shows it.
const UpdateModal = ({ info, onInstall, onDismiss }) => {
  const t = useT();
  if (!info) return null;
  const name = `Log Pose ${info.version || ''}`.trim();
  return (
    <div className="cmdk-overlay" onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}>
      <div className="update-modal" role="dialog" aria-label={t('New version available')}>
        <div className="update-modal-badge"><Icon name="download" size={22} /></div>
        <h3 className="update-modal-title">{t('New version available')}</h3>
        <p className="update-modal-text">
          {info.ready
            ? `${name} ${t('was downloaded and is ready to install.')}`
            : `${name} ${t('is being downloaded…')}`}
        </p>
        <div className="update-modal-actions">
          <button className="btn btn-ghost" onClick={onDismiss}>{t('Later')}</button>
          <button className="btn btn-primary" onClick={onInstall} disabled={!info.ready}>
            {info.ready ? t('Restart & install') : t('Downloading…')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ APP ROOT ============
const App = () => {
  const [route, setRoute]   = React.useState('apps');
  const [cat, setCat]       = React.useState('All'); // Apps category filter
  const [installStates, setInstallStates] = React.useState({}); // {appId: 'installing' | 'installed'}
  const [upgradable, setUpgradable] = React.useState(() => new Set()); // ids with a winget update
  const [log, setLog]       = React.useState(null); // { app, lines, done }
  const [downloads, setDownloads] = React.useState([]); // {key, app, status:'queued'|'running'|'done'|'failed', lines, ok}
  const dlQueueRef   = React.useRef([]);    // apps waiting to install (FIFO)
  const dlRunningRef = React.useRef(false); // is the queue processor running?
  const dlDismissRef = React.useRef({});    // key -> timer; auto-dismiss settled toasts
  const [installedAppx, setInstalledAppx] = React.useState(() => new Set()); // AppX present on this machine
  const [removedSet, setRemovedSet] = React.useState(() => new Set());       // debloated this session
  const [removingSet, setRemovingSet] = React.useState(() => new Set());     // removal in progress
  const [appxLoading, setAppxLoading] = React.useState(true);
  const [serviceStatus, setServiceStatus] = React.useState({}); // name -> { exists, start, optimized, busy }
  const [coreIso, setCoreIso] = React.useState(null);           // { hvci } once read
  const [tweaks, setTweaks] = React.useState(window.TWEAKS);
  const [cmdkOpen, setCmdkOpen] = React.useState(false);

  // ---- Language (pt-BR default, en-US optional). Persisted in localStorage.
  const [lang, setLangState] = React.useState(initialLang);
  const setLang = React.useCallback((l) => { setLangState(l); persistLang(l); }, []);
  const t = React.useMemo(() => makeT(lang), [lang]);

  // ---- Options state
  const [appVersion, setAppVersion] = React.useState('1.0.0');
  const [updateState, setUpdateState] = React.useState('idle'); // idle | checking | available | uptodate
  const [updateModal, setUpdateModal] = React.useState(null);   // null | { version, ready }
  const [behavior, setBehavior] = React.useState({ startup: false, tray: false, startMinimized: false });
  const [editionLabel, setEditionLabel] = React.useState('Windows');
  const [sysRows, setSysRows] = React.useState(null);
  const [features, setFeatures] = React.useState(window.FEATURES);

  // ---- Backend bridge (real winget/dism) or null when running in a plain browser
  const bridge = (typeof window !== 'undefined' && window.onlyOS) || null;

  // Wire update events.
  React.useEffect(() => {
    if (!bridge) return;
    bridge.onUpdateAvailable?.((info) => {
      setUpdateState('available');
      setUpdateModal({ version: info?.version, ready: false });
    });
    bridge.onUpdateReady?.((info) => {
      setUpdateState('available');
      setUpdateModal({ version: info?.version, ready: true });
    });

    // Read real tweak states so toggles reflect the actual system.
    if (bridge.tweakStatus) {
      const backendIds = Object.values(window.TWEAKS).flat().filter(t => t.backend).map(t => t.backend);
      bridge.tweakStatus(backendIds).then((statuses) => {
        if (!statuses) return;
        setTweaks(prev => {
          const next = {};
          for (const [group, rows] of Object.entries(prev)) {
            next[group] = rows.map(t => t.backend && statuses[t.backend] != null ? { ...t, on: statuses[t.backend] } : t);
          }
          return next;
        });
      }).catch(() => {});
    }

    // Real hardware for the System tab.
    bridge.getHardware?.().then((res) => {
      if (!res?.ok) return;
      const h = res.hw;
      if (h.osCaption) setEditionLabel(h.osCaption); // real Windows edition for the footer pill
      const rows = [
        { key: 'Windows',       val: `${h.osCaption}`,                       sub: `build ${h.osBuild} · ${h.osArch}` },
        { key: 'CPU',           val: h.cpuName,                              sub: `${h.cpuCores}C / ${h.cpuThreads}T` },
        { key: 'GPU',           val: h.gpuName,                              sub: '' },
        { key: 'RAM',           val: `${h.ramTotal} GB`,                     sub: `${h.ramUsed} / ${h.ramTotal} GB used`, usage: h.ramUsed / h.ramTotal },
        { key: 'Storage',       val: h.diskModel || `${h.diskTotal} GB`,     sub: `${h.diskFree} GB free of ${h.diskTotal} GB`, usage: h.diskUsed / h.diskTotal },
        { key: 'Last Boot',     val: h.lastBoot,                             sub: '' },
      ];
      setSysRows(rows);
    }).catch(() => {});
  }, []); // eslint-disable-line

  const onCheckUpdates = async () => {
    setUpdateState('checking');
    // electron-updater checks automatically; here we just reflect state.
    // In packaged build the main process emits update:available if there's one.
    setTimeout(() => setUpdateState(s => s === 'checking' ? 'uptodate' : s), 2500);
  };
  const onInstallUpdate = () => bridge?.installUpdate?.();
  // Real behavior toggles: startup-with-Windows (login item), minimize-to-tray,
  // start-minimized. The main process returns the resolved state (e.g. enabling
  // start-minimized also turns tray on), which we mirror back.
  const onToggleBehavior = async (key) => {
    const next = !behavior[key];
    if (!bridge?.setSetting) { setBehavior(b => ({ ...b, [key]: next })); return; }
    try {
      const s = await bridge.setSetting(key, next);
      if (s) setBehavior(s);
    } catch { /* keep current state on failure */ }
  };

  // Detect which catalog apps are installed via `winget list` (matches winget
  // ids and, for kind:'download' apps, by name via the backend name_fallback).
  // Used on boot and by the Apps "Refresh" button so a freshly-installed vendor
  // app (WhatsApp/NVIDIA/AMD) flips to "installed" once the user re-checks.
  const refreshInstalled = React.useCallback(() => {
    if (!bridge?.listInstalled) return;
    bridge.listInstalled(window.APPS.map(a => a.id)).then((res) => {
      if (!res?.ok) return;
      const installedIds = new Set(res.installed);
      setInstallStates((prev) => {
        const next = { ...prev };
        for (const app of window.APPS) {
          // Don't clobber an in-progress install; only set installed when found.
          if (installedIds.has(app.id)) next[app.id] = 'installed';
        }
        return next;
      });
    }).catch(() => {});
  }, [bridge]);

  // On boot: detect installed apps + behavior settings + live inventories.
  // The backend commands are async (spawn_blocking) so none blocks the IPC
  // thread, but we still STAGGER them so the window paints first and the slow
  // winget/CIM queries don't all contend for CPU/disk at the same instant —
  // that simultaneous burst is what made the window freeze-then-recover.
  React.useEffect(() => {
    if (!bridge) return;
    let cancelled = false;
    const idle = (fn, timeout = 1500) =>
      (window.requestIdleCallback || ((cb) => setTimeout(cb, 0)))(fn, { timeout });

    // Tier 1 (cheap, needed for the default Apps view): app-behavior settings
    // and the AppX inventory. Fire right away.
    bridge.getSettings?.().then((s) => { if (s && !cancelled) setBehavior(s); }).catch(() => {});
    bridge.listAppx?.().then((res) => {
      if (cancelled) return;
      if (res?.ok) setInstalledAppx(new Set(res.installed));
      setAppxLoading(false);
    }).catch(() => { if (!cancelled) setAppxLoading(false); });

    // Tier 2 (registry/CIM, for tabs the user isn't on yet): defer to idle.
    idle(() => {
      if (cancelled) return;
      bridge.listServices?.(window.SERVICES.map(s => s.name)).then((st) => {
        if (st && !cancelled) setServiceStatus(st);
      }).catch(() => {});
      bridge.coreIsolation?.().then((r) => {
        if (r?.ok && !cancelled) setCoreIso({ hvci: !!r.hvci });
      }).catch(() => {});
    });

    // Tier 3 (slow winget list): the heaviest boot query — push it last so the
    // UI is fully interactive before it runs.
    idle(() => { if (!cancelled) refreshInstalled(); }, 3000);

    // Tier 4 (slowest, Get-WindowsCapability ~10-30s): runs on its own and
    // merges into the AppX set whenever it returns. Never on the critical path.
    bridge.listCapabilities?.().then((res) => {
      if (cancelled) return;
      if (res?.ok && res.installed.length) {
        setInstalledAppx(prev => new Set([...prev, ...res.installed]));
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  // Check which installed apps have a winget update available.
  const refreshUpgradable = React.useCallback(() => {
    if (!bridge?.listUpgradable) return;
    bridge.listUpgradable().then((res) => {
      if (res?.ok) setUpgradable(new Set(res.ids));
    }).catch(() => {});
  }, [bridge]);
  // `winget upgrade --include-unknown` is the single slowest boot query, and it
  // only feeds the "update available" badges — not the first paint. Defer it well
  // past the initial render so it never competes with the rest of the boot work.
  React.useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
    const handle = idle(() => refreshUpgradable(), { timeout: 5000 });
    return () => (window.cancelIdleCallback || clearTimeout)(handle);
  }, [refreshUpgradable]);

  // Re-read the live AppX inventory (Features tab refresh button).
  const refreshAppx = React.useCallback(() => {
    if (!bridge?.listAppx) return;
    setAppxLoading(true);
    bridge.listAppx().then((res) => {
      if (res?.ok) setInstalledAppx(new Set(res.installed));
      setAppxLoading(false);
    }).catch(() => setAppxLoading(false));
  }, [bridge]);

  // Append a line to the active LOG drawer (restore / uninstall / actions still
  // use the single drawer; only app installs go through the download center).
  const appendLog = (appId, text, kind = 'dim') => {
    setLog(prev => {
      if (!prev || prev.app.id !== appId) return prev;
      return { ...prev, lines: [...prev.lines, { text, kind }] };
    });
  };

  // ---- Download center helpers (one entry per app, keyed by app id) ----
  const patchDownload = (key, patch) =>
    setDownloads(ds => ds.map(d => (d.key === key ? { ...d, ...patch } : d)));
  const appendDownloadLine = (key, text, kind = 'dim') =>
    setDownloads(ds => ds.map(d => (d.key === key ? { ...d, lines: [...d.lines, { text, kind }] } : d)));

  // Killfeed behaviour: a settled toast (done/failed) auto-dismisses a few seconds
  // after it lands, so notifications don't pile up. New ones prepend at the top and
  // push the older ones down until they fade out. Scheduled once per key.
  React.useEffect(() => {
    downloads.forEach(d => {
      const settled = d.status === 'done' || d.status === 'failed';
      if (settled && !dlDismissRef.current[d.key]) {
        dlDismissRef.current[d.key] = setTimeout(() => {
          setDownloads(ds => ds.filter(x => x.key !== d.key));
          delete dlDismissRef.current[d.key];
        }, 5000);
      }
    });
  }, [downloads]);

  // Install (or upgrade) one app and stream its output into its download entry.
  const runOneInstall = async (app, mode = 'install') => {
    const key = app.id;
    const isDownload = app.kind === 'download';
    const isUpgrade = mode === 'upgrade';
    patchDownload(key, { status: 'running' });
    appendDownloadLine(key, isUpgrade ? `winget upgrade --id ${app.id} -e --silent`
      : (isDownload ? `download ${app.url}` : `winget install --id ${app.id} -e --silent`), '');

    if (!bridge) {
      appendDownloadLine(key, 'No backend (browser preview).', 'dim');
      patchDownload(key, { status: 'done', ok: true });
      setInstallStates(st => ({ ...st, [app.id]: 'installed' }));
      return;
    }
    try {
      if (isUpgrade) {
        const res = await bridge.upgradePackage(app.id, c => appendDownloadLine(key, c.replace(/\s+$/, ''), 'dim'));
        appendDownloadLine(key, res.ok ? 'Successfully updated' : `Failed (exit ${res.exitCode})`, res.ok ? 'ok' : 'err');
        patchDownload(key, { status: res.ok ? 'done' : 'failed', ok: !!res.ok });
        if (res.ok) setUpgradable(prev => { const n = new Set(prev); n.delete(app.id); return n; });
        return;
      }
      if (isDownload) {
        const res = await bridge.downloadRun(app.id, app.url, app.file, c => appendDownloadLine(key, c.replace(/\s+$/, ''), 'dim'), app.referer);
        appendDownloadLine(key, res.ok ? 'Installer opened — follow its steps.' : `Failed: ${res.error || ''}`, res.ok ? 'ok' : 'err');
        patchDownload(key, { status: res.ok ? 'done' : 'failed', ok: !!res.ok });
        setInstallStates(st => ({ ...st, [app.id]: undefined })); // download+run can't confirm final state
        return;
      }
      const res = await bridge.installPackage(app.id, c => appendDownloadLine(key, c.replace(/\s+$/, ''), 'dim'), app.source);
      appendDownloadLine(key, res.ok ? 'Successfully installed' : `Failed (exit ${res.exitCode})`, res.ok ? 'ok' : 'err');
      patchDownload(key, { status: res.ok ? 'done' : 'failed', ok: !!res.ok });
      setInstallStates(st => ({ ...st, [app.id]: res.ok ? 'installed' : undefined }));
    } catch (e) {
      appendDownloadLine(key, `Error: ${e.message}`, 'err');
      patchDownload(key, { status: 'failed', ok: false });
      if (!isUpgrade) setInstallStates(st => ({ ...st, [app.id]: undefined }));
    }
  };

  // Drain the FIFO queue one at a time (winget won't run two at once).
  const runQueue = async () => {
    if (dlRunningRef.current) return;
    dlRunningRef.current = true;
    try {
      while (dlQueueRef.current.length) {
        const item = dlQueueRef.current.shift();
        await runOneInstall(item.app, item.mode);
      }
    } finally {
      dlRunningRef.current = false;
    }
  };

  // Queue an install/upgrade. Each shows in the download center
  // (queued -> running -> done/failed).
  const enqueue = (app, mode) => {
    if (dlQueueRef.current.some(i => i.app.id === app.id)) return;
    setDownloads(ds => [{ key: app.id, app, mode, status: 'queued', lines: [], ok: undefined }, ...ds.filter(d => d.app.id !== app.id)]);
    dlQueueRef.current.push({ app, mode });
    runQueue();
  };
  const onInstall = (app) => {
    if (installStates[app.id] === 'installing' || installStates[app.id] === 'installed') return;
    // kind:'download' apps just open a vendor installer — we can't track their
    // real install, so don't fake an 'installing'/'installed' state for them
    // (that was the WhatsApp bug: it showed installed without being installed).
    // winget apps get the optimistic 'installing' spinner; download apps stay
    // neutral and only flip to 'installed' if winget name-detection finds them.
    if (app.kind !== 'download') {
      setInstallStates(s => ({ ...s, [app.id]: 'installing' }));
    }
    enqueue(app, 'install');
  };
  const onUpgrade = (app) => {
    if (!upgradable.has(app.id)) return;
    enqueue(app, 'upgrade');
  };
  const onUpgradeAll = () => {
    window.APPS.filter(a => upgradable.has(a.id)).forEach(a => onUpgrade(a));
  };

  const onUninstall = async (app, wipe = false) => {
    setInstallStates(s => ({ ...s, [app.id]: 'uninstalling' }));
    const verb = wipe ? 'wipe (uninstall + remove data)' : 'uninstall';
    setLog({ app, lines: [{ text: `${verb}: ${app.id}`, kind: '' }], done: false });

    if (!bridge) {
      appendLog(app.id, 'No backend (browser preview).', 'dim');
      setLog(prev => prev && prev.app.id === app.id ? { ...prev, done: true } : prev);
      setInstallStates(st => ({ ...st, [app.id]: undefined }));
      return;
    }

    try {
      const fn = wipe ? bridge.wipePackage : bridge.uninstallPackage;
      const res = await fn(app.id, (chunk) => appendLog(app.id, chunk.replace(/\s+$/, ''), 'dim'));
      appendLog(app.id, res.ok ? 'Done.' : `Failed (exit ${res.exitCode})`, res.ok ? 'ok' : 'err');
      setLog(prev => prev && prev.app.id === app.id ? { ...prev, done: true } : prev);
      setInstallStates(st => ({ ...st, [app.id]: undefined }));
    } catch (e) {
      appendLog(app.id, `Error: ${e.message}`, 'err');
    }
  };

  // ---- AppX debloat (real Remove-AppxPackage via bridge)
  const onRemoveAppx = async (f) => {
    setRemovingSet(prev => new Set(prev).add(f.name));
    const logApp = { name: f.label || f.name, id: f.name + ' · removing' };
    const cmdLabel = f.type === 'Capability' ? `DISM /Remove-Capability ${f.name}` : `Remove-AppxPackage ${f.name}`;
    setLog({ app: logApp, lines: [{ text: cmdLabel, kind: '' }], done: false });

    const clearRemoving = () => setRemovingSet(prev => { const n = new Set(prev); n.delete(f.name); return n; });

    if (!bridge) {
      setLog(prev => prev ? { ...prev, lines: [...prev.lines, { text: 'No backend (browser preview).', kind: 'dim' }], done: true } : prev);
      clearRemoving();
      return;
    }
    try {
      const onChunk = (chunk) =>
        setLog(prev => (prev && prev.app.id === logApp.id) ? { ...prev, lines: [...prev.lines, { text: chunk.replace(/\s+$/, ''), kind: 'dim' }] } : prev);
      // Capability entries (e.g. Recall) go through DISM /Remove-Capability;
      // AppX entries through Remove-AppxPackage. Default to AppX.
      const res = f.type === 'Capability'
        ? await bridge.removeFeature(f.name, onChunk)
        : await bridge.removeAppx(f.name, onChunk);
      if (res.ok) setRemovedSet(prev => new Set(prev).add(f.name));
      setLog(prev => (prev && prev.app.id === logApp.id)
        ? { ...prev, lines: [...prev.lines, { text: res.ok ? 'Removed.' : `Failed (exit ${res.exitCode})`, kind: res.ok ? 'ok' : 'err' }], done: true }
        : prev);
    } catch (e) {
      setLog(prev => prev ? { ...prev, lines: [...prev.lines, { text: `Error: ${e.message}`, kind: 'err' }], done: true } : prev);
    }
    clearRemoving();
  };

  // ---- Restore a removed item (AppX: re-register/Store; Capability: DISM add).
  const onRestoreAppx = async (f) => {
    setRemovingSet(prev => new Set(prev).add(f.name));
    const logApp = { name: f.label || f.name, id: f.name + ' · restoring' };
    const cmdLabel = f.type === 'Capability' ? `DISM /Add-Capability ${f.name}` : `Restore ${f.name}`;
    setLog({ app: logApp, lines: [{ text: cmdLabel, kind: '' }], done: false });

    const clearRemoving = () => setRemovingSet(prev => { const n = new Set(prev); n.delete(f.name); return n; });

    if (!bridge) {
      setLog(prev => prev ? { ...prev, lines: [...prev.lines, { text: 'No backend (browser preview).', kind: 'dim' }], done: true } : prev);
      clearRemoving();
      return;
    }
    try {
      const onChunk = (chunk) =>
        setLog(prev => (prev && prev.app.id === logApp.id) ? { ...prev, lines: [...prev.lines, { text: chunk.replace(/\s+$/, ''), kind: 'dim' }] } : prev);
      const res = f.type === 'Capability'
        ? await bridge.restoreFeature(f.name, onChunk)
        : await bridge.restoreAppx(f.name, onChunk);
      // On success the item is no longer "removed this session"; drop it from the
      // set and re-add to the live present set so the row flips back to Installed.
      if (res.ok) {
        setRemovedSet(prev => { const n = new Set(prev); n.delete(f.name); return n; });
        setInstalledAppx(prev => new Set(prev).add(f.name));
      }
      setLog(prev => (prev && prev.app.id === logApp.id)
        ? { ...prev, lines: [...prev.lines, { text: res.ok ? 'Restored.' : `Failed (exit ${res.exitCode})`, kind: res.ok ? 'ok' : 'err' }], done: true }
        : prev);
    } catch (e) {
      setLog(prev => prev ? { ...prev, lines: [...prev.lines, { text: `Error: ${e.message}`, kind: 'err' }], done: true } : prev);
    }
    clearRemoving();
  };

  // ---- Batch remove: every "recommended" catalog item that is actually present.
  // Sequential (one streaming log at a time), reusing onRemoveAppx so Capability
  // vs AppX routing and state updates are identical to the manual flow.
  const [batchRemoving, setBatchRemoving] = React.useState(false);
  const onRemoveRecommended = async () => {
    if (batchRemoving) return;
    const targets = features.filter(f =>
      f.recommend && installedAppx.has(f.name) && !removedSet.has(f.name));
    if (targets.length === 0) return;
    setBatchRemoving(true);
    for (const f of targets) {
      // eslint-disable-next-line no-await-in-loop
      await onRemoveAppx(f);
    }
    setBatchRemoving(false);
  };

  // ---- Service optimization toggle (reversible; reboot to apply)
  const onToggleService = async (name) => {
    const cur = !!serviceStatus[name]?.optimized;
    setServiceStatus(p => ({ ...p, [name]: { ...p[name], busy: true } }));
    let res;
    try { res = await bridge?.setService?.(name, !cur); } catch { res = { ok: false }; }
    setServiceStatus(p => ({
      ...p,
      [name]: { ...p[name], busy: false, optimized: res?.ok ? !cur : p[name]?.optimized },
    }));
    if (res?.ok) {
      setLog({ app: { name, id: 'service · ' + name }, done: true,
        lines: [{ text: `${name}: ${!cur ? t('optimized') : t('restored to default')} — ${t('reboot to apply')}`, kind: 'ok' }] });
    } else if (res?.error) {
      setLog({ app: { name, id: 'service · ' + name }, done: true, ok: false,
        lines: [{ text: `${name}: ${res.error}`, kind: 'err' }] });
    }
  };

  const onOpenCoreIso = () => bridge?.openSettings?.('windowsdefender://coreisolation');

  // ---- Tweak toggle
  // Core: drive one tweak to an explicit value. Returns { changed, needsReboot }.
  const setTweakTo = async (group, id, value) => {
    const tweak = tweaks[group]?.find(t => t.id === id);
    if (!tweak) return {};

    if (!tweak.backend || !bridge) {
      setTweaks(prev => ({ ...prev, [group]: prev[group].map(t => t.id === id ? { ...t, on: value } : t) }));
      return { changed: true };
    }
    setTweaks(prev => ({ ...prev, [group]: prev[group].map(t => t.id === id ? { ...t, busy: true } : t) }));
    try {
      const res = await bridge.setTweak(tweak.backend, value);
      setTweaks(prev => ({ ...prev, [group]: prev[group].map(t => t.id === id ? { ...t, on: res.ok ? value : t.on, busy: false } : t) }));
      return { changed: !!res.ok, needsReboot: res.needsReboot, name: tweak.name };
    } catch (e) {
      setTweaks(prev => ({ ...prev, [group]: prev[group].map(t => t.id === id ? { ...t, busy: false } : t) }));
      return {};
    }
  };

  const onToggle = async (group, id) => {
    const tweak = tweaks[group]?.find(t => t.id === id);
    if (!tweak) return;
    const res = await setTweakTo(group, id, !tweak.on);
    if (res.needsReboot) {
      setLog({ app: { name: tweak.name, id: 'tweak · needs reboot' },
               lines: [{ text: `${tweak.name}: ${!tweak.on ? 'enabled' : 'disabled'}`, kind: 'ok' },
                       { text: 'Restart Windows to apply this change.', kind: 'dim' }], done: true });
    }
  };

  // ---- Game Mode: one switch over a known perf set. `perf` = state for max FPS,
  // `safe` = the balanced/secure state restored when turned off. Reuses the real
  // tweak backend. Reverting is conservative (security back on).
  const GAME_MODE = [
    { id: 'ultimate-power', perf: true,  safe: false }, // Ultimate <-> Balanced power plan
    { id: 'hags',           perf: true,  safe: true  }, // GPU scheduling on (kept on)
    { id: 'gamedvr',        perf: false, safe: true  }, // Game DVR off for games
    { id: 'vbs',            perf: false, safe: true  }, // VBS off = ~5-8% FPS (security trade-off)
  ];
  const findTweak = (id) => {
    for (const [group, rows] of Object.entries(tweaks)) {
      const t = rows.find(r => r.id === id);
      if (t) return { group, tweak: t };
    }
    return null;
  };
  const [gameBusy, setGameBusy] = React.useState(false);
  const gameModeOn = GAME_MODE.every(g => { const f = findTweak(g.id); return f && f.tweak.on === g.perf; });

  const onToggleGameMode = async () => {
    if (gameBusy) return;
    const target = !gameModeOn;
    setGameBusy(true);
    let reboot = false;
    for (const g of GAME_MODE) {
      const f = findTweak(g.id);
      if (!f) continue;
      const want = target ? g.perf : g.safe;
      if (f.tweak.on === want) continue;
      const res = await setTweakTo(f.group, g.id, want);
      if (res.needsReboot) reboot = true;
    }
    setGameBusy(false);
    setLog({
      app: { name: 'Game Mode', id: target ? 'performance · enabled' : 'balanced · restored' },
      lines: [
        { text: target ? 'Game Mode enabled — tuned for max FPS.' : 'Game Mode off — balanced & secure restored.', kind: 'ok' },
        ...(reboot ? [{ text: 'Restart Windows to fully apply (VBS / GPU scheduling).', kind: 'dim' }] : []),
      ],
      done: true,
    });
  };

  // ---- Maintenance action (real, mapped to backend action ids)
  const MAINT_MAP = {
    'Clear temp files':  'clear-temp',
    'Flush DNS':         'flush-dns',
    'Restart Explorer':  'restart-explorer',
    'Check for updates': 'check-updates',
    'Repair Windows (SFC + DISM)': 'repair',
    'Add Microsoft Store':         'add-store',
    'Remove Microsoft Store':      'remove-store',
    'Reinstall OneDrive':          'add-onedrive',
    'Create restore point':        'restore-point',
  };
  const onAction = async (label) => {
    const actionId = MAINT_MAP[label];
    const logApp = { name: label, id: 'system · maintenance' };
    setLog({ app: logApp, lines: [{ text: actionId || label, kind: '' }], done: false });

    if (!bridge || !actionId) {
      setLog(prev => prev ? { ...prev, lines: [...prev.lines, { text: bridge ? 'Unknown action.' : 'No backend (browser preview).', kind: 'dim' }], done: true } : prev);
      return;
    }
    try {
      const res = await bridge.runMaintenance(actionId, (chunk) => {
        setLog(prev => (prev && prev.app.id === logApp.id) ? { ...prev, lines: [...prev.lines, { text: chunk.replace(/\s+$/, ''), kind: 'dim' }] } : prev);
      });
      setLog(prev => (prev && prev.app.id === logApp.id)
        ? { ...prev, lines: [...prev.lines, { text: res.ok ? 'Done.' : `Failed (exit ${res.exitCode})`, kind: res.ok ? 'ok' : 'err' }], done: true }
        : prev);
    } catch (e) {
      setLog(prev => prev ? { ...prev, lines: [...prev.lines, { text: `Error: ${e.message}`, kind: 'err' }], done: true } : prev);
    }
  };

  // ---- Counts for sidebar
  // Sidebar badge: how many catalog apps are still present (debloatable).
  const removedCount = features.filter(f => installedAppx.has(f.name) && !removedSet.has(f.name)).length;
  const tweaksOn = Object.values(tweaks).flat().filter(t => t.on).length;
  const counts = {
    apps:     window.APPS.length, // catalogue size (not installed count — that was misleading)
    features: removedCount,
    system:   null,
    tweaks:   tweaksOn,
  };

  // ---- Command palette items
  const cmdkItems = React.useMemo(() => {
    const list = [];
    NAV.forEach((n) => {
      list.push({
        id: 'nav-' + n.id,
        group: 'Navigate',
        leading: '',
        label: t('Go to') + ' ' + t(n.label),
        hint: '',
        keywords: n.label + ' ' + t(n.label),
        run: () => setRoute(n.id),
      });
    });
    window.APPS.forEach(app => {
      const st = installStates[app.id];
      list.push({
        id: 'app-' + app.id,
        group: 'Install app',
        leading: app.icon,
        label: app.name,
        hint: st === 'installed' ? t('installed') : (st === 'installing' ? t('installing…') : t(app.cat)),
        keywords: app.id + ' ' + app.cat + ' ' + app.desc,
        run: () => { setRoute('apps'); if (!st) onInstall(app); },
      });
    });
    Object.entries(tweaks).forEach(([group, rows]) => {
      rows.forEach(tw => {
        list.push({
          id: 'tweak-' + tw.id,
          group: 'Toggle tweak',
          leading: tw.on ? '●' : '○',
          label: t(tw.on ? 'Disable:' : 'Enable:') + ' ' + tw.name,
          hint: t(group),
          keywords: tw.desc + ' ' + group,
          run: () => { setRoute('tweaks'); onToggle(group, tw.id); },
        });
      });
    });
    ['Clear temp files', 'Flush DNS', 'Restart Explorer'].forEach(label => {
      list.push({
        id: 'sys-' + label,
        group: 'Maintenance',
        leading: '⚡',
        label: t(label),
        hint: '',
        keywords: 'maintenance system ' + label,
        run: () => { setRoute('system'); onAction(label); },
      });
    });
    return list;
  }, [installStates, tweaks, t]);

  // ---- Global keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      const tag = (e.target && e.target.tagName) || '';
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen(o => !o);
        return;
      }
      if (e.key === 'Escape') {
        if (cmdkOpen) { setCmdkOpen(false); return; }
        if (log) { setLog(null); return; }
      }
      if (isMod && ['1','2','3','4','5'].includes(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        if (NAV[idx]) setRoute(NAV[idx].id);
        return;
      }
      if (e.key === '/' && !isTyping && !cmdkOpen) {
        e.preventDefault();
        setCmdkOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cmdkOpen, log, route]);

  // ---- Page meta (title + one-line description), localized.
  const pageMeta = {
    apps:     { title: t('Apps'),     desc: t('Curated winget catalogue — install in one click, no bloat.') },
    features: { title: t('Features'), desc: t('Remove pre-installed Windows apps you don\'t use.') },
    system:   { title: t('System'),   desc: t('Hardware, startup programs, and maintenance for this Windows install.') },
    tweaks:   { title: t('Tweaks'),   desc: t('Post-install performance and privacy toggles.') },
    options:  { title: t('Options'),  desc: t('App preferences, updates and behavior.') },
  }[route];

  const onOpenSearch = () => setCmdkOpen(true);
  const catalogUpdateCount = window.APPS.filter(a => upgradable.has(a.id)).length;

  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
    <div className="viewport">
      <div className="window">
        <TitleBar />
        <div className="body">
          <Sidebar
            route={route} setRoute={setRoute} counts={counts} edition={editionLabel}
            version={appVersion} onOpenSearch={onOpenSearch}
          />
          <main className="main">
            <PageHead
              title={pageMeta.title} desc={pageMeta.desc}
              below={route === 'apps' ? <CatChips cat={cat} setCat={setCat} /> : null}
            >
              {route === 'apps' && (
                <>
                  {catalogUpdateCount > 0 && (
                    <button className="btn btn-primary" onClick={onUpgradeAll}>
                      <Icon name="refresh" size={15} />{t('Update all')} ({catalogUpdateCount})
                    </button>
                  )}
                  <button className="btn" onClick={() => { refreshInstalled(); refreshUpgradable(); }}><Icon name="refresh" size={15} />{t('Refresh')}</button>
                </>
              )}
              {route === 'features' && (
                <button className="btn" onClick={refreshAppx}><Icon name="refresh" size={15} />{t('Refresh')}</button>
              )}
              {route === 'system' && (
                <button className="btn"><Icon name="download" size={15} />{t('Export report')}</button>
              )}
              {route === 'tweaks' && (
                <button className="btn">{t('Apply all recommended')}</button>
              )}
            </PageHead>

            <div className="page-body" style={{ position: 'relative' }}>
              {route === 'apps'     && <AppsScreen cat={cat} installStates={installStates} onInstall={onInstall} onUninstall={onUninstall} upgradable={upgradable} onUpgrade={onUpgrade} />}
              {route === 'features' && <FeaturesScreen features={features} installedAppx={installedAppx} onRemove={onRemoveAppx} onRestore={onRestoreAppx} onRemoveRecommended={onRemoveRecommended} batchRemoving={batchRemoving} removedSet={removedSet} removingSet={removingSet} loading={appxLoading} />}
              {route === 'system'   && <SystemScreen onAction={onAction} rows={sysRows} />}
              {route === 'tweaks'   && <TweaksScreen tweaks={tweaks} onToggle={onToggle} gameModeOn={gameModeOn} gameBusy={gameBusy} onToggleGameMode={onToggleGameMode} services={window.SERVICES} serviceStatus={serviceStatus} onToggleService={onToggleService} coreIso={coreIso} onOpenCoreIso={onOpenCoreIso} />}
              {route === 'options'  && <OptionsScreen
                version={appVersion} updateState={updateState}
                onCheckUpdates={onCheckUpdates} onInstallUpdate={onInstallUpdate}
                behavior={behavior} onToggleBehavior={onToggleBehavior}
                edition={editionLabel} lang={lang} setLang={setLang}
              />}
            </div>
          </main>
        </div>

        <LogDrawer entry={log} onClose={() => setLog(null)} />
        <DownloadCenter
          items={downloads}
          onClear={() => setDownloads(ds => ds.filter(d => d.status === 'queued' || d.status === 'running'))}
        />

        <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} items={cmdkItems} />
        <UpdateModal info={updateModal} onInstall={onInstallUpdate} onDismiss={() => setUpdateModal(null)} />
      </div>
    </div>
    </LangCtx.Provider>
  );
};

export default App;
