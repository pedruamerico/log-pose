// i18n.js — lightweight localization. Default pt-BR; en-US optional (Options >
// Language). Strategy: t(englishString) returns the pt-BR translation (or the
// english string itself in 'en' mode, or as a fallback when a key is missing).
// Technical terms (winget, VBS, HAGS, GPU, DNS, SFC, DISM, Game DVR, registry
// names, etc.) are intentionally KEPT in English inside the translations.
import React from 'react';

export const LANGS = [
  { id: 'pt', label: 'Português (BR)' },
  { id: 'en', label: 'English (US)' },
];

// english -> português (BR). Whole-string keys so technical terms stay English
// within the sentence. Missing keys fall back to the english source.
const PT = {
  // nav / shell
  'Apps': 'Apps',
  'Features': 'Recursos',
  'System': 'Sistema',
  'Tweaks': 'Tweaks',
  'Options': 'Opções',
  'MANAGE': 'GERENCIAR',
  'Search everything…': 'Buscar tudo…',
  'Only OS': 'Only OS',

  // page descriptions
  'Curated winget catalogue — install in one click, no bloat.':
    'Catálogo curado do winget — instale em um clique, sem bloat.',
  'Remove pre-installed Windows apps you don\'t use.':
    'Remova apps pré-instalados do Windows que você não usa.',
  'Hardware, edition, and runtime info reported to the manifest.':
    'Hardware, edição e informações de runtime reportadas ao manifest.',
  'Post-install performance and privacy toggles.':
    'Ajustes de desempenho e privacidade pós-instalação.',
  'App preferences, updates and behavior.':
    'Preferências do app, atualizações e comportamento.',

  // buttons / actions
  'Refresh': 'Atualizar',
  'Reload manifest': 'Recarregar manifest',
  'Export report': 'Exportar relatório',
  'Apply all recommended': 'Aplicar recomendados',
  'Reload': 'Recarregar',
  'Install': 'Instalar',
  'Update': 'Atualizar',
  'Update all': 'Atualizar tudo',
  'Installed': 'Instalado',
  'Installing': 'Instalando',
  'Failed to install': 'Falha ao instalar',
  'Installing…': 'Instalando…',
  'Removing…': 'Removendo…',
  'Restore': 'Restaurar',
  'Restart & install': 'Reiniciar & instalar',
  'Check for updates': 'Verificar atualizações',

  // categories
  'Browser': 'Navegador',
  'Gaming': 'Jogos',
  'Social': 'Social',
  'Dev': 'Dev',
  'Media': 'Mídia',
  'Monitoring': 'Monitoramento',
  'Utility': 'Utilitários',
  'Drivers': 'Drivers',
  'All': 'Todos',

  // apps empty
  'No apps match': 'Nenhum app corresponde a',

  // features
  'Source:': 'Fonte:',
  'entries': 'entradas',
  'Filter features…': 'Filtrar recursos…',
  'Removed': 'Removido',
  'Kept': 'Mantido',
  'Name': 'Nome',
  'Type': 'Tipo',
  'Status': 'Status',
  'Action': 'Ação',
  'queued for restore': 'na fila p/ restaurar',

  // system
  'Maintenance': 'Manutenção',
  'Components': 'Componentes',
  'Run': 'Executar',
  'Free up disk space from the temp folder.': 'Libera espaço apagando a pasta temp.',
  'Reset the DNS resolver cache.': 'Limpa o cache do resolvedor DNS.',
  'Reload the desktop, taskbar and tray.': 'Recarrega área de trabalho, barra de tarefas e bandeja.',
  'Open Windows Update.': 'Abre o Windows Update.',
  'Scan and repair system files.': 'Verifica e repara arquivos do sistema.',
  'Take a System Restore snapshot before changes.': 'Cria um ponto de restauração do Windows antes de mudanças.',
  'Re-register the Microsoft Store.': 'Re-registra a Microsoft Store.',
  'Uninstall the Microsoft Store.': 'Remove a Microsoft Store.',
  'Install OneDrive via winget.': 'Instala o OneDrive via winget.',
  'Clear temp files': 'Limpar temporários',
  'Flush DNS': 'Limpar DNS',
  'Restart Explorer': 'Reiniciar Explorer',
  'Repair (SFC + DISM)': 'Reparar (SFC + DISM)',
  'Add Store': 'Adicionar Store',
  'Remove Store': 'Remover Store',
  'Reinstall OneDrive': 'Reinstalar OneDrive',
  'Create restore point': 'Criar ponto de restauração',

  // startup manager
  'Startup programs': 'Programas de inicialização',
  'on': 'ligados',
  'Disable what you don’t need at boot — fewer entries means a faster, lighter startup. Toggling is reversible.':
    'Desligue o que não precisa no boot — menos entradas, inicialização mais rápida e leve. É reversível.',
  'Reading startup entries…': 'Lendo entradas de inicialização…',
  'No user startup programs found.': 'Nenhum programa de inicialização encontrado.',
  'No backend (browser preview).': 'Sem backend (preview no navegador).',
  'All users': 'Todos',
  'You': 'Você',

  // tweaks / game mode
  'Security': 'Segurança',
  'Performance': 'Desempenho',
  'Developer': 'Desenvolvedor',
  'Recommended': 'Recomendado',
  'Game Mode': 'Game Mode',
  'Active': 'Ativo',
  'One switch for max FPS: Ultimate power plan, GPU scheduling on, Game DVR & VBS off. Reverts to balanced & secure when off. VBS change needs a restart.':
    'Um botão para FPS máximo: plano Ultimate Performance, GPU scheduling ligado, Game DVR e VBS desligados. Volta ao modo balanceado e seguro quando off. Mudar o VBS exige reiniciar.',

  // options
  'Updates': 'Atualizações',
  'Behavior': 'Comportamento',
  'About': 'Sobre',
  'Language': 'Idioma',
  'Current version': 'Versão atual',
  'An update is available.': 'Uma atualização está disponível.',
  'Checking for updates…': 'Verificando atualizações…',
  'You are on the latest version.': 'Você está na versão mais recente.',
  'Start with Windows': 'Iniciar com o Windows',
  'Launch Log Pose automatically when you sign in.':
    'Abrir o Log Pose automaticamente ao entrar.',
  'Minimize to tray': 'Minimizar para a bandeja',
  'Keep running in the system tray when closed.':
    'Continuar rodando na bandeja do sistema ao fechar.',
  'Start minimized to tray': 'Iniciar minimizado na bandeja',
  'Launch hidden in the tray (enables minimize to tray).':
    'Abrir escondido na bandeja (ativa minimizar para a bandeja).',
  'Companion app for Only OS — a debloated Windows 11 build.':
    'App companheiro do Only OS — um Windows 11 debloated.',
  'Edition': 'Edição',
  'Interface language. Technical terms stay in English.':
    'Idioma da interface. Termos técnicos permanecem em inglês.',

  // command palette
  'Search apps, tweaks, navigate…': 'Buscar apps, tweaks, navegar…',
  'Navigate': 'Navegar',
  'Install app': 'Instalar app',
  'Toggle tweak': 'Alternar tweak',
  'Go to': 'Ir para',
  'Enable:': 'Ligar:',
  'Disable:': 'Desligar:',
  'installed': 'instalado',
  'removed': 'removidos',
  'Remove': 'Remover',
  'Removing…': 'Removendo…',
  'Reading installed apps…': 'Lendo apps instalados…',
  'installing…': 'instalando…',
  'navigate': 'navegar',
  'select': 'selecionar',
  'close': 'fechar',
  'results': 'resultados',
  'No matches for': 'Nenhum resultado para',

  // app catalogue descriptions (technical terms / brand names kept in English)
  'Fast, secure browser built by Google.':
    'Navegador rápido e seguro feito pelo Google.',
  'Chromium browser with built-in tracker and ad blocking.':
    'Navegador Chromium com bloqueio de rastreadores e anúncios embutido.',
  'Gamer-themed Chromium browser with CPU/RAM/network limiters.':
    'Navegador Chromium com tema gamer e limitadores de CPU/RAM/rede.',
  'Riot tactical shooter (BR server). Brings the Riot Client.':
    'Shooter tático da Riot (servidor BR). Traz o Riot Client.',
  'Riot MOBA (BR server). Brings the Riot Client.':
    'MOBA da Riot (servidor BR). Traz o Riot Client.',
  'Largest PC game library, mod tools, and chat.':
    'Maior biblioteca de jogos de PC, ferramentas de mod e chat.',
  'Voice, video, and text chat for communities.':
    'Chat de voz, vídeo e texto para comunidades.',
  "Meta's messaging app for chats and calls.":
    'App de mensagens da Meta para conversas e chamadas.',
  'Work chat, meetings, and calls. New Teams.':
    'Chat de trabalho, reuniões e chamadas. New Teams.',
  'Lightweight, extensible code editor by Microsoft.':
    'Editor de código leve e extensível da Microsoft.',
  'JetBrains Java/Kotlin IDE (Community edition).':
    'IDE Java/Kotlin da JetBrains (edição Community).',
  'JetBrains database IDE and SQL client.':
    'IDE de banco de dados e cliente SQL da JetBrains.',
  'Run containers locally for development and testing.':
    'Rode containers localmente para desenvolvimento e testes.',
  'API client for building and testing requests.':
    'Cliente de API para criar e testar requisições.',
  'Distributed version control system. Command-line.':
    'Controle de versão distribuído. Linha de comando.',
  'JavaScript runtime built on V8. Includes npm.':
    'Runtime JavaScript baseado no V8. Inclui npm.',
  'Python 3.13 interpreter, pip, and standard library.':
    'Interpretador Python 3.13, pip e biblioteca padrão.',
  'Plays virtually any audio/video file or stream.':
    'Reproduz praticamente qualquer arquivo ou stream de áudio/vídeo.',
  'Free streaming and screen recording suite.':
    'Suíte gratuita de streaming e gravação de tela.',
  'Music, podcasts, and playlists. Free tier available.':
    'Música, podcasts e playlists. Tem plano gratuito.',
  'Reports CPU, mainboard, memory, and GPU details.':
    'Mostra detalhes de CPU, placa-mãe, memória e GPU.',
  'GPU overclock, fan control, and on-screen metrics.':
    'Overclock de GPU, controle de fan e métricas na tela.',
  'High-compression archiver supporting many formats.':
    'Compactador de alta compressão com suporte a vários formatos.',
  'Quick screenshot capture and share.':
    'Captura e compartilhamento rápido de screenshots.',
  'Per-app volume control replacement for the Windows mixer. Open-source.':
    'Controle de volume por app no lugar do mixer do Windows. Open-source.',
  'Driver updater with a large database. Watch the installer for bundled offers.':
    'Atualizador de drivers com base grande. Atenção a ofertas no instalador.',
  'NVIDIA driver + control panel (overclock, game optimization, recording). For GeForce GPUs.':
    'Driver NVIDIA + painel de controle (overclock, otimização de jogos, gravação). Para GPUs GeForce.',
  'AMD driver + Adrenalin software (tuning, recording). For Radeon GPUs / APUs.':
    'Driver AMD + software Adrenalin (tuning, gravação). Para GPUs Radeon / APUs.',
};

const KEY = 'logpose.lang';
export const initialLang = () => {
  try { return localStorage.getItem(KEY) || 'pt'; } catch { return 'pt'; }
};
export const persistLang = (l) => { try { localStorage.setItem(KEY, l); } catch {} };

export const makeT = (lang) => (s) => (lang === 'en' ? s : (PT[s] ?? s));

export const LangCtx = React.createContext({ lang: 'pt', setLang: () => {}, t: (s) => s });
export const useLang = () => React.useContext(LangCtx);
export const useT = () => React.useContext(LangCtx).t;
