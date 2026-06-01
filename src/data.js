// ============ STATIC DATA ============
window.APPS = [
  // Browser
  { id: 'Google.Chrome', name: 'Google Chrome', cat: 'Browser', desc: 'Fast, secure browser built by Google.', icon: 'Ch' },
  { id: 'Brave.Brave', name: 'Brave', cat: 'Browser', desc: 'Chromium browser with built-in tracker and ad blocking.', icon: 'Br' },
  { id: 'Opera.OperaGX', name: 'Opera GX', cat: 'Browser', desc: 'Gamer-themed Chromium browser with CPU/RAM/network limiters.', icon: 'GX' },

  // Gaming
  { id: 'RiotGames.Valorant.BR', name: 'Valorant', cat: 'Gaming', desc: 'Riot tactical shooter (BR server). Brings the Riot Client.', icon: 'Va' },
  { id: 'RiotGames.LeagueOfLegends.BR', name: 'League of Legends', cat: 'Gaming', desc: 'Riot MOBA (BR server). Brings the Riot Client.', icon: 'LoL' },
  { id: 'Valve.Steam', name: 'Steam', cat: 'Gaming', desc: 'Largest PC game library, mod tools, and chat.', icon: 'St' },

  // Social
  { id: 'Discord.Discord', name: 'Discord', cat: 'Social', desc: 'Voice, video, and text chat for communities.', icon: 'Ds' },
  // WhatsApp is distributed only via the Microsoft Store now (the standalone
  // WhatsAppSetup.exe URL was retired — it 302s to web.whatsapp.com). Install it
  // through winget's msstore source by its Store product id.
  { id: '9NKSQGP7F2NH', name: 'WhatsApp', cat: 'Social', desc: "Meta's messaging app for chats and calls.", icon: 'Wa', source: 'msstore' },
  { id: 'Microsoft.Teams', name: 'Microsoft Teams', cat: 'Social', desc: 'Work chat, meetings, and calls. New Teams.', icon: 'Tm' },

  // Dev
  { id: 'Microsoft.VisualStudioCode', name: 'VS Code', cat: 'Dev', desc: 'Lightweight, extensible code editor by Microsoft.', icon: '{}' },
  { id: 'JetBrains.IntelliJIDEA.Community', name: 'IntelliJ IDEA', cat: 'Dev', desc: 'JetBrains Java/Kotlin IDE (Community edition).', icon: 'IJ' },
  { id: 'JetBrains.DataGrip', name: 'DataGrip', cat: 'Dev', desc: 'JetBrains database IDE and SQL client.', icon: 'DG' },
  { id: 'Docker.DockerDesktop', name: 'Docker Desktop', cat: 'Dev', desc: 'Run containers locally for development and testing.', icon: 'Dk' },
  { id: 'Postman.Postman', name: 'Postman', cat: 'Dev', desc: 'API client for building and testing requests.', icon: 'Pm' },
  { id: 'Git.Git', name: 'Git', cat: 'Dev', desc: 'Distributed version control system. Command-line.', icon: 'Gt' },
  { id: 'OpenJS.NodeJS.LTS', name: 'Node.js LTS', cat: 'Dev', desc: 'JavaScript runtime built on V8. Includes npm.', icon: 'Nd' },
  { id: 'Python.Python.3.13', name: 'Python', cat: 'Dev', desc: 'Python 3.13 interpreter, pip, and standard library.', icon: 'Py' },

  // Media
  { id: 'VideoLAN.VLC', name: 'VLC media player', cat: 'Media', desc: 'Plays virtually any audio/video file or stream.', icon: 'VL' },
  { id: 'OBSProject.OBSStudio', name: 'OBS Studio', cat: 'Media', desc: 'Free streaming and screen recording suite.', icon: 'OB' },
  { id: 'Spotify.Spotify', name: 'Spotify', cat: 'Media', desc: 'Music, podcasts, and playlists. Free tier available.', icon: 'Sp' },

  // Monitoring
  { id: 'CPUID.CPU-Z', name: 'CPU-Z', cat: 'Monitoring', desc: 'Reports CPU, mainboard, memory, and GPU details.', icon: 'CZ' },
  { id: 'Guru3D.Afterburner', name: 'MSI Afterburner', cat: 'Monitoring', desc: 'GPU overclock, fan control, and on-screen metrics.', icon: 'AB' },

  // Utility
  { id: '7zip.7zip', name: '7-Zip', cat: 'Utility', desc: 'High-compression archiver supporting many formats.', icon: '7z' },
  { id: 'Skillbrains.Lightshot', name: 'Lightshot', cat: 'Utility', desc: 'Quick screenshot capture and share.', icon: 'Ls' },
  { id: 'File-New-Project.EarTrumpet', name: 'EarTrumpet', cat: 'Utility', desc: 'Per-app volume control replacement for the Windows mixer. Open-source.', icon: 'ET' },

  // Drivers (NVIDIA/AMD not on winget — downloaded straight from the vendor)
  { id: 'IObit.DriverBooster', name: 'IObit Driver Booster', cat: 'Drivers', desc: 'Driver updater with a large database. Watch the installer for bundled offers.', icon: 'IO' },
  { id: 'NvidiaApp', name: 'NVIDIA App', cat: 'Drivers', desc: 'NVIDIA driver + control panel (overclock, game optimization, recording). For GeForce GPUs.', icon: 'NV', kind: 'download', url: 'https://us.download.nvidia.com/nvapp/client/11.0.7.247/NVIDIA_app_v11.0.7.247.exe', file: 'NVIDIA_app.exe' },
  { id: 'AmdAdrenalin', name: 'AMD Adrenalin', cat: 'Drivers', desc: 'AMD driver + Adrenalin software (tuning, recording). For Radeon GPUs / APUs.', icon: 'AMD', kind: 'download', url: 'https://drivers.amd.com/drivers/installer/26.10/whql/amd-software-adrenalin-edition-26.5.2-minimalsetup-260513_web.exe', file: 'amd-adrenalin-setup.exe' },

  // Runtimes (on-demand -- only-os ships NONE baked, like Ghost; install here when
  // a game/app needs them. The Ghost Toolbox [16]/[17] equivalent.)
  { id: 'Microsoft.VCRedist.2015+.x64', name: 'Visual C++ (x64)', cat: 'Runtimes', desc: 'Visual C++ 2015-2022 Redistributable (x64). Needed by most games and native apps.', icon: 'C++' },
  { id: 'Microsoft.VCRedist.2015+.x86', name: 'Visual C++ (x86)', cat: 'Runtimes', desc: 'Visual C++ 2015-2022 Redistributable (x86 / 32-bit). Some older games need it.', icon: 'C++' },
  { id: 'Microsoft.DirectX', name: 'DirectX Runtime', cat: 'Runtimes', desc: 'DirectX End-User Runtime (legacy d3dx / xinput DLLs that some games require).', icon: 'DX', kind: 'download', url: 'https://download.microsoft.com/download/1/7/1/1718CCC4-6315-4D8E-9543-8E28A4E18C4C/dxwebsetup.exe', file: 'dxwebsetup.exe' },
  { id: 'Microsoft.DotNet.DesktopRuntime.8', name: '.NET Desktop Runtime 8', cat: 'Runtimes', desc: 'Runtime for .NET 8 desktop apps (WPF / WinForms).', icon: 'NET' },
];

window.CATEGORIES = ['Browser', 'Gaming', 'Social', 'Dev', 'Media', 'Monitoring', 'Utility', 'Drivers', 'Runtimes'];

// Debloat catalog — packages/capabilities safe to remove. Status is NOT stored
// here: the Features tab queries the machine live (window.onlyOS.listAppx) and
// shows present vs. removed per machine — so entries that Atlas OS already
// stripped just read as "Removed", and names that don't exist on this build are
// harmless. Curated for the new target: Windows 11 25H2 after Atlas OS, where
// AI (Copilot/Recall), Xbox/games and some bloat survive.
//
// Fields: { name, type, label, cat, recommend? }
//   cat        — section header (see FEATURE_CATEGORIES) to group the list.
//   recommend  — true => included in the "Remover recomendados" batch button.
//   type       — 'AppX' (removed via appx_remove) or 'Capability' (DISM, via
//                feature_remove). Recall/Outlook etc. ship as DISM capabilities,
//                not AppX, so Remove-AppxPackage can't touch them.
window.FEATURES = [
  // --- IA (Copilot / Recall / Windows AI) — recommended for the clean target ---
  { name: 'Microsoft.Copilot',                       type: 'AppX',       cat: 'IA', label: 'Copilot', recommend: true },
  { name: 'Microsoft.Windows.Ai.Copilot.Provider',   type: 'AppX',       cat: 'IA', label: 'Copilot provider', recommend: true },
  { name: 'MicrosoftWindows.Client.AIX',             type: 'AppX',       cat: 'IA', label: 'AI experiences (AIX)', recommend: true },
  { name: 'MicrosoftWindows.Client.CoPilot',         type: 'AppX',       cat: 'IA', label: 'Copilot (client)', recommend: true },
  { name: 'Recall',                                  type: 'Capability', cat: 'IA', label: 'Recall (Windows AI)', recommend: true },

  // --- Jogos (Xbox / Game services) — optional; not removed unless you pick them
  { name: 'Microsoft.GamingApp',                     type: 'AppX', cat: 'Jogos', label: 'Xbox app' },
  { name: 'Microsoft.XboxGamingOverlay',             type: 'AppX', cat: 'Jogos', label: 'Xbox Game Bar' },
  { name: 'Microsoft.XboxGameOverlay',               type: 'AppX', cat: 'Jogos', label: 'Xbox Game Overlay' },
  { name: 'Microsoft.Xbox.TCUI',                     type: 'AppX', cat: 'Jogos', label: 'Xbox TCUI' },
  { name: 'Microsoft.XboxSpeechToTextOverlay',       type: 'AppX', cat: 'Jogos', label: 'Xbox Speech-to-Text' },
  { name: 'Microsoft.XboxIdentityProvider',          type: 'AppX', cat: 'Jogos', label: 'Xbox Identity Provider' },
  { name: 'Microsoft.GamingServices',                type: 'AppX', cat: 'Jogos', label: 'Gaming Services' },
  { name: 'Microsoft.MicrosoftSolitaireCollection',  type: 'AppX', cat: 'Jogos', label: 'Solitaire Collection', recommend: true },

  // --- Comunicação ---
  { name: 'Microsoft.YourPhone',                     type: 'AppX', cat: 'Comunicação', label: 'Phone Link' },
  { name: 'MicrosoftTeams',                          type: 'AppX', cat: 'Comunicação', label: 'Teams (personal)', recommend: true },
  { name: 'Microsoft.SkypeApp',                      type: 'AppX', cat: 'Comunicação', label: 'Skype', recommend: true },
  { name: 'Microsoft.People',                        type: 'AppX', cat: 'Comunicação', label: 'People' },
  { name: 'Microsoft.OutlookForWindows',             type: 'AppX', cat: 'Comunicação', label: 'Outlook (new)' },

  // --- Mídia ---
  { name: 'Clipchamp.Clipchamp',                     type: 'AppX', cat: 'Mídia', label: 'Clipchamp', recommend: true },
  { name: 'Microsoft.ZuneMusic',                     type: 'AppX', cat: 'Mídia', label: 'Media Player (Groove)' },
  { name: 'Microsoft.ZuneVideo',                     type: 'AppX', cat: 'Mídia', label: 'Films & TV' },
  { name: 'Microsoft.WindowsSoundRecorder',          type: 'AppX', cat: 'Mídia', label: 'Sound Recorder' },

  // --- Produtividade ---
  { name: 'Microsoft.PowerAutomateDesktop',          type: 'AppX', cat: 'Produtividade', label: 'Power Automate', recommend: true },
  { name: 'Microsoft.Todos',                         type: 'AppX', cat: 'Produtividade', label: 'Microsoft To Do' },
  { name: 'Microsoft.MicrosoftStickyNotes',          type: 'AppX', cat: 'Produtividade', label: 'Sticky Notes' },
  { name: 'Microsoft.MicrosoftOfficeHub',            type: 'AppX', cat: 'Produtividade', label: 'Office hub', recommend: true },
  { name: 'Microsoft.Windows.DevHome',               type: 'AppX', cat: 'Produtividade', label: 'Dev Home' },

  // --- Sistema / Bing / bloat that Atlas may leave behind ---
  { name: 'Microsoft.BingWeather',                   type: 'AppX', cat: 'Sistema', label: 'Weather', recommend: true },
  { name: 'Microsoft.BingNews',                      type: 'AppX', cat: 'Sistema', label: 'News', recommend: true },
  { name: 'Microsoft.BingSearch',                    type: 'AppX', cat: 'Sistema', label: 'Bing Search (web no menu)', recommend: true },
  { name: 'Microsoft.GetHelp',                       type: 'AppX', cat: 'Sistema', label: 'Get Help' },
  { name: 'Microsoft.Getstarted',                    type: 'AppX', cat: 'Sistema', label: 'Tips' },
  { name: 'Microsoft.WindowsFeedbackHub',            type: 'AppX', cat: 'Sistema', label: 'Feedback Hub', recommend: true },
  { name: 'Microsoft.WindowsMaps',                   type: 'AppX', cat: 'Sistema', label: 'Maps' },
  { name: 'Microsoft.Windows.QuickAssist',           type: 'AppX', cat: 'Sistema', label: 'Quick Assist' },
  { name: 'MicrosoftWindows.CrossDevice',            type: 'AppX', cat: 'Sistema', label: 'Cross Device' },
];

// Order of section headers in the Features tab (entries with an unlisted cat
// fall under "Outros" at the end).
window.FEATURE_CATEGORIES = ['IA', 'Jogos', 'Comunicação', 'Mídia', 'Produtividade', 'Sistema', 'Outros'];

// System specs come live from the backend (getHardware). No mock fallback —
// if the query fails the System tab simply shows nothing rather than fiction.

// Tweaks with `backend: <tweakId>` are wired to real registry/powercfg toggles
// via window.onlyOS.setTweak / tweakStatus. The `on` here is a default; the app
// queries the real state on load and overrides it.
window.TWEAKS = {
  Security: [
    // Windows Defender is KEPT ON by default (negligible FPS cost; the FPS win is
    // VBS off). No toggle here on purpose -- turn real-time protection off in
    // Windows Security if you ever want it. Removing/re-adding an AV is not a tweak.
    // name/desc are English keys translated via i18n (window.onlyOS UI is pt-BR
    // by default); the TweaksScreen renders them through t().
    { id: 'uac',         backend: 'uac',          name: 'UAC prompts',            desc: 'User Account Control prompts when elevating. Off = "never notify" (no pop-ups). Does not affect Store apps.', on: false },
    { id: 'auto-update', backend: 'auto-update',  name: 'Automatic Windows Update',  desc: 'Auto-downloads updates/drivers, no forced reboot. Turning it off returns to manual mode (you update when you want).', on: true },
    { id: 'vbs',         backend: 'vbs',          name: 'Virtualization-Based Security (VBS)', desc: 'Kernel memory-integrity protection. Off gives ~5-8% more FPS (gaming mode) and does NOT risk a Vanguard ban (Riot allows it via VAN 9005), but lowers Windows kernel security. Requires reboot.', on: false },
  ],
  Performance: [
    { id: 'ultimate-power', backend: 'ultimate-power', name: 'Ultimate Performance power plan', desc: 'Unlocks the hidden high-performance power scheme.', recommend: true, on: true },
    { id: 'hags',           backend: 'hags',           name: 'Hardware-accelerated GPU scheduling (HAGS)', desc: 'Lets the GPU manage its own memory. Requires reboot.', recommend: true, on: true },
    { id: 'gamedvr',        backend: 'gamedvr',        name: 'Game DVR background recording', desc: 'Background gameplay capture. Off frees resources for games.', on: false },
  ],
  Developer: [
    { id: 'wsl', backend: 'wsl', name: 'Linux & containers (WSL2)', desc: 'Enables WSL2 + Hyper-V platform. Required for Docker Desktop / Podman / Linux dev. Off keeps Hyper-V dormant for max gaming FPS. Requires reboot.', on: false },
  ],
  // AI policies (25H2). These are reversible registry toggles — turning a switch
  // ON applies the policy that DISABLES the AI feature; turning it OFF removes
  // the policy and restores the Windows default. `on: true` is the recommended
  // (disabled-AI) state for the clean target; the app reads the real state on load.
  AI: [
    { id: 'copilot-off', backend: 'copilot-off', name: 'Disable Windows Copilot', desc: 'Applies the TurnOffWindowsCopilot policy so Copilot stays off for all users. Off = Windows default (Copilot allowed).', recommend: true, on: true },
    { id: 'recall-off',  backend: 'recall-off',  name: 'Disable Recall (AI snapshots)', desc: 'Sets DisableAIDataAnalysis / AllowRecallEnablement=0 so Recall cannot capture snapshots. Pairs with removing the Recall capability in Recursos.', recommend: true, on: true },
    { id: 'ai-cocreator-off', backend: 'ai-cocreator-off', name: 'Disable AI in Paint / Notepad', desc: 'Turns off Cocreator / generative-AI features in Paint and Notepad via policy. Off = Windows default.', on: true },
    { id: 'web-search-off',   backend: 'web-search-off',   name: 'Disable Bing/web search in Start', desc: 'Stops the Start menu from sending searches to Bing/web (DisableSearchBoxSuggestions). Local search keeps working. Off = Windows default.', recommend: true, on: true },
  ],
};

// Service-optimization toggles. `on` = optimized (reduced start type); turning a
// toggle off restores the Windows default (the backend backs up the original
// value first, so revert is faithful). Status is read live (service_list); the
// `name` must match the Windows service key. Services absent on the machine are
// hidden. Labels in pt-BR, service names in English (UI convention). Requires a
// reboot to fully take effect. Texts go through t() — see i18n.js.
window.SERVICES = [
  { name: 'SysMain',          label: 'SysMain (Superfetch)',     desc: 'Preloads apps into RAM. Reducing it frees memory; little effect on SSDs.' },
  { name: 'WSearch',          label: 'Windows Search',           desc: 'Search indexer. Manual cuts background I/O (search still works).' },
  { name: 'Spooler',          label: 'Print Spooler',            desc: 'Print queue. Manual = starts when you print. Reduce if you do not print.' },
  { name: 'Ndu',              label: 'Network Data Usage (Ndu)', desc: 'Per-app network usage tracking. Off frees a little RAM (loses the per-app graph in Task Manager).' },
  { name: 'Fax',              label: 'Fax',                      desc: 'Fax service. Disabling affects nothing on a modern PC.' },
  { name: 'GpuEnergyDrv',     label: 'GPU Energy Driver',        desc: 'GPU power telemetry driver. Disabling reduces overhead.' },
  { name: 'DiagTrack',        label: 'Telemetry (DiagTrack)',    desc: 'Microsoft diagnostics/telemetry collection. Disabling is a privacy win.' },
  { name: 'dmwappushservice', label: 'WAP Push (telemetry)',     desc: 'Telemetry message routing. Safe to disable.' },
];
