# Prompt: reorganizar a tela "Recursos" (Features) do Log Pose

Cole numa sessao nova com foco em `d:\code\win\log-pose`.

---

## Contexto

Log Pose, app companion do Only OS (Tauri + React, pt-BR na UI). A tela **Recursos** (rota `features`,
componente `FeaturesScreen` em `src/App.jsx` ~linha 343) lista AppX pre-instalados do Windows que o
usuario pode remover. O estado (Instalado/Removido) ja e lido ao vivo da maquina (`installedAppx`,
`listAppx`) -- nao mexer nessa deteccao, ela esta correta.

Catalogo em `src/data.js` -> `window.FEATURES`: array de `{ name, type, label }`. Hoje NAO tem campo
de categoria, e a lista renderiza corrida (People, Office, Skype, Sticky Notes... em sequencia unica).

## O que JA existe (nao refazer)

- **Filtro** All / Installed / Removed (botoes `feat-filters`, ~linha 381) -- ja funciona.
- **Busca** por nome/label (~linha 379) -- ja funciona.
- **Contador** "X installed · Y removed" (~linha 370) -- ja funciona.
- Deteccao de estado real -- ja funciona.

## O que organizar (o pedido)

1. **Agrupar por categoria.** Adicionar campo `cat` em cada item de `window.FEATURES` (ex:
   Comunicacao, Midia, Produtividade, Sistema, Jogos, Outros). Renderizar a lista com **cabecalho de
   secao por categoria** (igual a aba Apps ja faz com `window.CATEGORIES` -- olhar como Apps agrupa e
   espelhar o padrao pra consistencia visual).

2. **Ordem / prioridade.** Dentro de cada grupo (ou globalmente), **instalados primeiro** (acionaveis),
   removidos depois. Como secundario, alfabetico por label. Hoje e ordem fixa do catalogo.

3. **Filtro Instalado vs Removido** ja existe -- so garantir que continua funcionando junto do
   agrupamento (filtrar E agrupar ao mesmo tempo). Secao vazia apos filtro nao deve renderizar cabecalho.

4. **Layout visual.** Densidade/espacamento das linhas, como o status (chip Removido/Instalado)
   aparece. Conferir contra a aba Apps e manter coerencia. Evitar lista muito "corrida" -- respiro
   entre grupos. Nao inventar design novo; seguir os tokens/estilo ja em `src/styles.css`.

## Restricoes

- pt-BR nos textos de UI, ingles em ids/identificadores (padrao do projeto).
- Sem libs novas sem perguntar.
- Nao tocar na logica de deteccao (`installedAppx`/`listAppx`/`removedSet`) nem no fluxo de remocao
  (`onRemove`).
- Reusar o padrao de agrupamento que a aba **Apps** ja usa (`window.CATEGORIES`) -- olhar e espelhar,
  nao criar um esquema diferente.

## Verificacao

- `npm run build` (ou o script de build Tauri do projeto) passa.
- Rodar o app: a tela Recursos mostra grupos com cabecalho, instalados no topo de cada grupo, filtro e
  busca funcionando junto do agrupamento.
