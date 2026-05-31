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
  { id: 'WhatsApp', name: 'WhatsApp', cat: 'Social', desc: "Meta's messaging app for chats and calls.", icon: 'Wa', kind: 'download', url: 'https://web.whatsapp.com/desktop/windows/release/x64/RELEASE/WhatsAppSetup.exe', file: 'WhatsAppSetup.exe' },
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

// Debloat catalog — AppX packages safe to remove on a normal Windows 11.
// Status is NOT stored here: the Features tab queries Get-AppxPackage live
// (window.onlyOS.listAppx) and shows present vs. removed per machine. Curated
// for a gaming user — Xbox / GameBar deliberately left out.
window.FEATURES = [
  { name: 'Microsoft.BingWeather',                  type: 'AppX', label: 'Weather' },
  { name: 'Microsoft.BingNews',                     type: 'AppX', label: 'News' },
  { name: 'Microsoft.GetHelp',                      type: 'AppX', label: 'Get Help' },
  { name: 'Microsoft.Getstarted',                   type: 'AppX', label: 'Tips' },
  { name: 'Microsoft.MicrosoftSolitaireCollection', type: 'AppX', label: 'Solitaire Collection' },
  { name: 'Microsoft.PowerAutomateDesktop',         type: 'AppX', label: 'Power Automate' },
  { name: 'Microsoft.Todos',                        type: 'AppX', label: 'Microsoft To Do' },
  { name: 'Microsoft.WindowsFeedbackHub',           type: 'AppX', label: 'Feedback Hub' },
  { name: 'Microsoft.YourPhone',                    type: 'AppX', label: 'Phone Link' },
  { name: 'Clipchamp.Clipchamp',                    type: 'AppX', label: 'Clipchamp' },
  { name: 'MicrosoftTeams',                         type: 'AppX', label: 'Teams (personal)' },
  { name: 'Microsoft.WindowsMaps',                  type: 'AppX', label: 'Maps' },
  { name: 'Microsoft.People',                       type: 'AppX', label: 'People' },
  { name: 'Microsoft.MicrosoftOfficeHub',           type: 'AppX', label: 'Office hub' },
  { name: 'Microsoft.SkypeApp',                     type: 'AppX', label: 'Skype' },
  { name: 'Microsoft.MicrosoftStickyNotes',         type: 'AppX', label: 'Sticky Notes' },
  { name: 'Microsoft.WindowsSoundRecorder',         type: 'AppX', label: 'Sound Recorder' },
  { name: 'Microsoft.ZuneMusic',                    type: 'AppX', label: 'Media Player (Groove)' },
  { name: 'Microsoft.ZuneVideo',                    type: 'AppX', label: 'Films & TV' },
  { name: 'Microsoft.OutlookForWindows',            type: 'AppX', label: 'Outlook (new)' },
  { name: 'Microsoft.Windows.DevHome',              type: 'AppX', label: 'Dev Home' },
];

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
    { id: 'uac',         backend: 'uac',          name: 'Prompts do UAC',            desc: 'Avisos do Controle de Conta de Usuário ao elevar. Desligado = "nunca notificar" (sem pop-ups). Não afeta apps da Store.', on: false },
    { id: 'auto-update', backend: 'auto-update',  name: 'Automatic Windows Update',  desc: 'Auto-download de updates/drivers, sem reboot forçado. Desligar volta ao modo manual (você atualiza quando quiser).', on: true },
    { id: 'vbs',         backend: 'vbs',          name: 'Virtualization-Based Security (VBS)', desc: 'Kernel memory-integrity protection. OFF gives ~5-8% more FPS (Gaming mode) and does NOT risk a Vanguard ban (Riot allows it via VAN 9005), but lowers Windows kernel security. Requires reboot.', on: false },
  ],
  Performance: [
    { id: 'ultimate-power', backend: 'ultimate-power', name: 'Ultimate Performance power plan', desc: 'Unlocks the hidden high-performance power scheme.', recommend: true, on: true },
    { id: 'hags',           backend: 'hags',           name: 'Hardware-accelerated GPU scheduling (HAGS)', desc: 'Lets the GPU manage its own memory. Requires reboot.', recommend: true, on: true },
    { id: 'gamedvr',        backend: 'gamedvr',        name: 'Game DVR background recording', desc: 'Background gameplay capture. Off frees resources for games.', on: false },
  ],
  Developer: [
    { id: 'wsl', backend: 'wsl', name: 'Linux & containers (WSL2)', desc: 'Enables WSL2 + Hyper-V platform. Required for Docker Desktop / Podman / Linux dev. Off keeps Hyper-V dormant for max gaming FPS. Requires reboot.', on: false },
  ],
};
