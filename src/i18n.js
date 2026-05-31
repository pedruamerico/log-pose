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

  // page descriptions
  'Curated winget catalogue — install in one click, no bloat.':
    'Catálogo curado do winget — instale em um clique, sem bloat.',
  'Remove pre-installed Windows apps you don\'t use.':
    'Remova apps pré-instalados do Windows que você não usa.',
  'Hardware, startup programs, and maintenance for this Windows install.':
    'Hardware, programas de inicialização e manutenção deste Windows.',
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
  // (AI/IA section keys defined just below)
  'AI': 'IA',
  'IA': 'IA',
  'Jogos': 'Jogos',
  'Comunicação': 'Comunicação',
  'Produtividade': 'Produtividade',
  'Sistema': 'Sistema',
  'Outros': 'Outros',
  'Remove recommended': 'Remover recomendados',
  'Remove all recommended items that are installed': 'Remove todos os itens recomendados que estão instalados',
  'Disable Windows Copilot': 'Desativar o Windows Copilot',
  'Applies the TurnOffWindowsCopilot policy so Copilot stays off for all users. Off = Windows default (Copilot allowed).':
    'Aplica a policy TurnOffWindowsCopilot para manter o Copilot desligado para todos os usuários. Desligado = padrão do Windows (Copilot permitido).',
  'Disable Recall (AI snapshots)': 'Desativar o Recall (capturas de IA)',
  'Sets DisableAIDataAnalysis / AllowRecallEnablement=0 so Recall cannot capture snapshots. Pairs with removing the Recall capability in Recursos.':
    'Define DisableAIDataAnalysis / AllowRecallEnablement=0 para o Recall não capturar telas. Combine com remover a capability Recall na aba Recursos.',
  'Disable AI in Paint / Notepad': 'Desativar IA no Paint / Bloco de Notas',
  'Turns off Cocreator / generative-AI features in Paint and Notepad via policy. Off = Windows default.':
    'Desliga os recursos de IA generativa (Cocreator) no Paint e no Bloco de Notas via policy. Desligado = padrão do Windows.',
  'Disable Bing/web search in Start': 'Desativar busca Bing/web no menu Iniciar',
  'Stops the Start menu from sending searches to Bing/web (DisableSearchBoxSuggestions). Local search keeps working. Off = Windows default.':
    'Impede o menu Iniciar de enviar buscas para o Bing/web (DisableSearchBoxSuggestions). A busca local continua funcionando. Desligado = padrão do Windows.',
  'Game Mode': 'Game Mode',
  'Active': 'Ativo',
  'One switch for max FPS: Ultimate power plan, GPU scheduling on, Game DVR & VBS off. Reverts to balanced & secure when off. VBS change needs a restart.':
    'Um botão para FPS máximo: plano Ultimate Performance, GPU scheduling ligado, Game DVR e VBS desligados. Volta ao modo balanceado e seguro quando off. Mudar o VBS exige reiniciar.',

  // tweak names + descriptions (technical product names kept in English)
  'UAC prompts': 'Prompts do UAC',
  'User Account Control prompts when elevating. Off = "never notify" (no pop-ups). Does not affect Store apps.':
    'Avisos do Controle de Conta de Usuário ao elevar. Desligado = "nunca notificar" (sem pop-ups). Não afeta apps da Store.',
  'Automatic Windows Update': 'Windows Update automático',
  'Auto-downloads updates/drivers, no forced reboot. Turning it off returns to manual mode (you update when you want).':
    'Baixa updates/drivers automaticamente, sem reboot forçado. Desligar volta ao modo manual (você atualiza quando quiser).',
  'Virtualization-Based Security (VBS)': 'Virtualization-Based Security (VBS)',
  'Kernel memory-integrity protection. Off gives ~5-8% more FPS (gaming mode) and does NOT risk a Vanguard ban (Riot allows it via VAN 9005), but lowers Windows kernel security. Requires reboot.':
    'Proteção de integridade de memória do kernel. Desligada dá ~5-8% mais FPS (modo gaming) e NÃO arrisca ban do Vanguard (a Riot permite via VAN 9005), mas reduz a segurança do kernel do Windows. Requer reiniciar.',
  'Ultimate Performance power plan': 'Plano de energia Ultimate Performance',
  'Unlocks the hidden high-performance power scheme.':
    'Libera o esquema de energia de alto desempenho escondido.',
  'Hardware-accelerated GPU scheduling (HAGS)': 'Agendamento de GPU acelerado por hardware (HAGS)',
  'Lets the GPU manage its own memory. Requires reboot.':
    'Deixa a GPU gerenciar a própria memória. Requer reiniciar.',
  'Game DVR background recording': 'Gravação em segundo plano do Game DVR',
  'Background gameplay capture. Off frees resources for games.':
    'Captura de gameplay em segundo plano. Desligado libera recursos pros jogos.',
  'Linux & containers (WSL2)': 'Linux e containers (WSL2)',
  'Enables WSL2 + Hyper-V platform. Required for Docker Desktop / Podman / Linux dev. Off keeps Hyper-V dormant for max gaming FPS. Requires reboot.':
    'Habilita WSL2 + plataforma Hyper-V. Necessário para Docker Desktop / Podman / dev Linux. Desligado mantém o Hyper-V dormente para FPS máximo. Requer reiniciar.',

  // services + core isolation
  'Services': 'Serviços',
  'Memory Integrity (Core Isolation)': 'Integridade de Memória (Core Isolation)',
  'On': 'Ligada',
  'On — the Valorant/Vanguard requirement is met.':
    'Ligada — o requisito do Valorant/Vanguard está atendido.',
  'Off — Valorant (Vanguard) requires it on. Open Windows settings to enable it; Windows checks driver compatibility first.':
    'Desligada — o Valorant (Vanguard) exige ligada. Abra as Configurações do Windows para ativar; o Windows checa compatibilidade de driver antes.',
  'Open settings': 'Abrir Configurações',
  'optimized': 'otimizado',
  'restored to default': 'revertido ao default',
  'reboot to apply': 'reinicie para aplicar',

  // service labels + descriptions (service names kept in English)
  'Print Spooler': 'Spooler de impressão',
  'Telemetry (DiagTrack)': 'Telemetria (DiagTrack)',
  'WAP Push (telemetry)': 'WAP Push (telemetria)',
  'Preloads apps into RAM. Reducing it frees memory; little effect on SSDs.':
    'Pré-carrega apps na RAM. Reduzir libera memória; pouco efeito em SSD.',
  'Search indexer. Manual cuts background I/O (search still works).':
    'Indexador de busca. Manual reduz I/O em segundo plano (a busca ainda funciona).',
  'Print queue. Manual = starts when you print. Reduce if you do not print.':
    'Fila de impressão. Manual = liga ao imprimir. Reduz se você não imprime.',
  'Per-app network usage tracking. Off frees a little RAM (loses the per-app graph in Task Manager).':
    'Coleta uso de rede por app. Desligar libera um pouco de RAM (perde o gráfico por app no Gerenciador).',
  'Fax service. Disabling affects nothing on a modern PC.':
    'Serviço de fax. Desligar não afeta nada num PC moderno.',
  'GPU power telemetry driver. Disabling reduces overhead.':
    'Driver de telemetria de energia da GPU. Desligar reduz overhead.',
  'Microsoft diagnostics/telemetry collection. Disabling is a privacy win.':
    'Coleta de diagnósticos/telemetria da Microsoft. Desligar é um ganho de privacidade.',
  'Telemetry message routing. Safe to disable.':
    'Roteamento de mensagens de telemetria. Desligar é seguro.',

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
  'Windows app installer, debloat and tweaks — in one place.':
    'Instalador de apps, debloat e tweaks do Windows — num lugar só.',
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
