// app-icons.js — maps winget package ids to simple-icons SVG paths.
// Monochrome icons (single path), colored via currentColor in CSS.
// Falls back to the 2-letter monogram (app.icon) when no match.

import {
    siGooglechrome, siFirefox, siBrave, siOperagx,
    siSteam, siEpicgames, siRiotgames, siDiscord, siTelegram, siWhatsapp,
    siGit, siDocker, siNodedotjs, siPython, siPostman,
    siVlcmediaplayer, siObsstudio, siSpotify,
    siMsi,
    si7zip,
} from 'simple-icons/icons';

// Not in simple-icons (trademark-restricted): VS Code, PowerToys, Everything,
// WinRAR, RivaTuner, Lightshot, Snappy Driver Installer — keep monogram fallback.
const ICON_MAP = {
    'Google.Chrome':                  siGooglechrome,
    'Mozilla.Firefox':                siFirefox,
    'Brave.Brave':                    siBrave,
    'Opera.OperaGX':                  siOperagx,
    'Valve.Steam':                    siSteam,
    'EpicGames.EpicGamesLauncher':    siEpicgames,
    'RiotGames.RiotClient':           siRiotgames,
    'Discord.Discord':                siDiscord,
    'Telegram.TelegramDesktop':       siTelegram,
    'WhatsApp.WhatsApp':              siWhatsapp,
    'Git.Git':                        siGit,
    'Docker.DockerDesktop':           siDocker,
    'OpenJS.NodeJS.LTS':              siNodedotjs,
    'Python.Python.3.13':             siPython,
    'Postman.Postman':                siPostman,
    'VideoLAN.VLC':                   siVlcmediaplayer,
    'OBSProject.OBSStudio':           siObsstudio,
    'Spotify.Spotify':                siSpotify,
    'Guru3D.Afterburner':            siMsi,
    '7zip.7zip':                      si7zip,
};

// Returns the SVG path string (24x24 viewBox) for an app id, or null.
export function getIconPath(appId) {
    const icon = ICON_MAP[appId];
    return icon ? icon.path : null;
}
