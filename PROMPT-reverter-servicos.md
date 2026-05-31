# Prompt: adicionar toggles de reversao dos tweaks do playbook ao Log Pose

Cole isto numa sessao nova com o foco em `d:\code\win\log-pose`.

---

## Contexto

O Log Pose e o app companion do Only OS (Tauri + React). O **playbook** (`d:\code\win\only-os-playbook`)
aplica tweaks de performance/debloat de uma vez, via AME Wizard, **sem reversao**. Quero que cada
servico/tweak que o playbook desativa vire um **toggle reversivel** no Log Pose: o usuario ve o estado
atual e pode religar pro default do Windows.

O catalogo de tweaks ja existe em `src/data.js` (`window.TWEAKS`, agrupado por categoria) e o bridge
ja expoe `setTweak`, `tweakStatus`, `listStartup`, `setStartup` (`src/bridge.js`, backend Rust em
`src-tauri/`). A tarefa e **estender** esse padrao, nao criar do zero.

## O que o playbook aplica hoje (fonte da verdade)

Servicos (`only-os-playbook/Configuration/tweaks/services.yml` + a decisao recente):

| Servico | Playbook poe | Default Windows (valor de reversao) |
|---|---|---|
| SysMain  | Manual (3)   | Automatic (2) |
| WSearch  | Manual (3)   | Automatic (2) |
| Spooler  | Manual (3)   | Automatic (2) |
| Fax      | Disabled (4) | Manual (3) |
| GpuEnergyDrv | Disabled (4) | Manual (3) -- A CONFIRMAR no Windows alvo |
| Ndu      | Disabled (4) | Automatic (2) -- A CONFIRMAR |
| NetBT    | Disabled (4) | Manual (3) -- driver, confirmar |
| Telemetry (Intel) | Disabled (4) | Manual (3) -- A CONFIRMAR |

> IMPORTANTE: os "default Windows" acima sao o esperado, mas devem ser **lidos da maquina** antes de
> cravar. O backend deve capturar o StartType atual ANTES de mudar (pra reverter ao real, nao a um
> chute). Idealmente o playbook/Log Pose grava o valor original em algum lugar (registro proprio do
> Only OS, ex: HKLM\SOFTWARE\OnlyOS\ServiceBackup) pra reversao fiel.

Outros tweaks do playbook que ja TEM toggle no Log Pose (so conferir que o status reflete o estado real):
- VBS, HAGS, Ultimate Power, Game DVR -> ja em `window.TWEAKS`
- Debloat AppX -> ja na aba Features (listAppx/removeAppx/restoreFeature)

Tweaks do playbook que AINDA NAO tem toggle e talvez queira (decidir se entram):
- Nagle off, NTFS last-access/8.3, DisablePagingExecutive/PageCombining, scheduled tasks,
  background apps, shutdown timeouts, Delivery Optimization. Maioria e registro -> reversivel.

## Tarefa

1. **Investigar o backend Rust** (`src-tauri/`): achar como `setTweak`/`tweakStatus`/`setStartup`/
   `listStartup` estao implementados. Entender o contrato (payload, retorno, Channel de log).

2. **Adicionar uma categoria "Servicos"** em `window.TWEAKS` (`src/data.js`), um toggle por servico
   da tabela. `on` = estado "otimizado" (servico reduzido). Religar = voltar ao default.

3. **Backend**: implementar leitura (StartType atual) e escrita (Set-Service / registro) por servico,
   com **backup do valor original** pra reversao fiel. Reusar `setStartup` se ja cobrir isso; senao
   estender. NUNCA hardcodar o default -- ler da maquina ou do backup.

4. **UI**: os toggles aparecem na aba de tweaks como os existentes. Mostrar estado real no load
   (`tweakStatus`). Indicar se requer reboot quando aplicavel.

5. Manter o estilo do projeto (pt-BR nos textos de UI, ingles em ids/identificadores). Sem libs novas
   sem perguntar.

## Tarefa B: VBS / Core Isolation -- DETECTAR e AVISAR (nao toggle)

Contexto critico: o playbook Only OS foi feito 100% anti-ban Vanguard e por isso **NAO toca VBS/Core
Isolation** (nem off nem on). Mas o Vanguard (2025/2026) EXIGE Core Isolation / Memory Integrity ON
para Valorant -- e ela vem OFF em quem fez upgrade do Win10 (vem ON so em instalacao limpa de Win11).

O Log Pose deve preencher esse gap, mas com cuidado:

- **DETECTAR** o estado real de VBS/Memory Integrity. Ler:
  `HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity\Enabled`
  (1 = on) e/ou `Win32_DeviceGuard` via WMI (SecurityServicesRunning contem 2 = HVCI ativo).
- **AVISAR**, nao forcar: se estiver OFF, mostrar um card/aviso "Memory Integrity esta desligada --
  o Valorant exige ligada. Clique para abrir as Configuracoes do Windows."
- O botao abre a tela nativa (`windowsdefender://coreisolation` ou Core Isolation settings) via
  `openExternal`. NAO ligar HVCI via registro direto -- forcar Enabled=1 cego pode causar BSOD/boot
  loop se houver driver incompativel. O Windows precisa fazer a checagem de driver dele.
- Isto e um **indicador read-mostly**, nao um toggle de ida-e-volta. Pode mostrar status (ON/OFF) e,
  se OFF, o aviso + botao. Se ON, so um "OK" verde.

NUNCA implementar "desligar VBS" no Log Pose -- isso quebra Valorant e pode gerar flag de ban.

## Restricoes

- Servicos sensiveis (Defender, Update, audio, rede core) NAO entram. So a lista acima.
- WSearch/Spooler ficam Manual no playbook (nao Disabled) de proposito: nao quebrar busca/impressao.
- Confirmar nomes/defaults numa maquina Win11 real antes de confiar nos valores da tabela.
- Testar: build do Tauri + rodar o app e alternar um toggle de ida e volta, conferindo `services.msc`.

## Resultado esperado

Uma aba/categoria "Servicos" no Log Pose onde cada servico que o playbook tocou pode ser revertido ao
default do Windows, com estado real lido da maquina e backup do valor original.
