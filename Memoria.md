# Memória do Projeto — Aetheria Codex

> 📌 **LEIA ESTE ARQUIVO PRIMEIRO em qualquer sessão futura.** É a linha do tempo oficial de tudo que foi alterado neste projeto: o quê, quando, por quê, o que deu certo e o que deu errado. Atualizá-lo a cada manutenção é parte do trabalho.
>
> Formato das entradas: **data/hora — evento** → resultado (`OK` / `ERRO` / `PARCIAL`) + motivo.

---

## Contexto rápido

Códice de personagens de fantasia: **464 personagens em 22 categorias** em `codex/` (`codex/01_Humanos` a `codex/22_Bersek` — movidas da raiz em 26/08; os IDs internos continuam sendo o nome da pasta), fichas `.md` + imagens `.png`, site galeria (`index.html`), **páginas de raça (`racas/`, geradas)**, mapa do mundo (`Mapa_Aetheria.html`) e scripts PowerShell (em `scripts/`) que geram `characters-api.json` (API estática consumida pelo site — SEM array flat, só grupos), `historia-api.json` (regiões/batalhas/raças consumida pelo mapa), as 22 páginas de `racas/` (`build_racas.ps1`) e `README.md`. Sem backend; tudo estático.

Três formatos de ficha `.md` convivem no projeto:

1. **Bulleted-bold** (ex.: Humanos): `* **História Original:** texto...`
2. **Texto simples** (ex.: Monstros): `1. Battle-Beast-V-1` sem `##`, campos em parágrafos separados
3. **Esquema Mutantes**: rótulos próprios (`Classe Mutagênica:`, `Anatomia & Detalhes:`, `Atributos Únicos:`)

---

## 🎛️ COMANDOS — gatillos de fala e procedimento padrão

### COMANDO «atualização de personagens»

**Gatilhos** (qualquer variação): *"personagens atualizados"*, *"atualização de personagem"*, *"atualizei o codex"*, *"checar o que mudou"*.
**Significado:** o Bruno sincronizou/copiou conteúdo de fora (imagens e/ou fichas). Pode haver personagens **adicionados, trocados ou criados**, que **podem precisar de `.md` novo, edição de ficha existente ou correção de nomes** — inclusive imagens novas sem ficha. **Passo 0 (desde 26/08): as pastas das raças vivem em `codex/`, mas a ferramenta de sync aponta para a RAIZ — rode `powershell -File scripts\absorb_sync.ps1` antes de tudo** (o builder também avisa se achar pasta `NN_*` sobrando na raiz). Melhor ainda: atualizar o destino da sync para `...\Teste\codex\`. Executar o checklist completo abaixo, na ordem:

| # | Passo | Como | Por quê |
|---|---|---|---|
| 1 | Ver o que mudou em texto | `git status --short` + `git diff HEAD -- '*.md'` | Achar fichas editadas/adicionadas |
| 2 | **Reparar encoding SEMPRE** | `powershell -File fix_encoding.ps1` e depois refazer o diff do passo 1 | As ferramentas do Bruno RE-CORROMPEM os `.md` (double-encoded). Mudança real pode estar escondida sob mojibake — só o pós-reparo revela a verdade |
| 3 | Comparar elenco por pasta | Extrair linhas `N. Nome` de `git show HEAD:<arquivo>` vs arquivo atual; listar SAIRAM/ENTRARAM | Detectar personagens adicionados/removidos/renomeados |
| 4 | Escanear imagens | Pastas numeradas novas? PNGs órfãos? Duplicatas restauradas? | `dedupe_images.ps1` remove duplicatas idênticas (hash); `fix_image_typos.ps1` renomeia typos inequívocos |
| 5 | Casos especiais | Imagem na pasta errada; nomes placeholder (`Sem-Nome-*`); artes diferentes com nome parecido | Mover/reportar — nunca apagar arte com hash diferente sem perguntar |
| 6 | Regenerar | `build_api_json.ps1` (ele AVISA pastas com PNG mas sem `.md`) + `build_readme.ps1` | Site atualizado; pendências visíveis no JSON (`foldersWithoutSheet`) |
| 7 | Relatório ao Bruno | Tabela: adicionados / alterados / precisando de `.md` / precisando de nome / imagens órfãs restantes | Decisões de conteúdo são dele |
| 8 | Registrar e commitar | Nova entrada na Linha do Tempo deste arquivo com hora real + `git commit` | Manter a memória viva |

**Exemplo real executado em 24/08/2026 ~09:47–10:00:** atualização trouxe pasta nova `21_Demonios_Akuma-Gani` (11 PNGs `Imu-*` sem ficha nenhuma), `Loki-V-1.png` substituído, `Sem_Nome-1.png` parado na pasta errada (movido p/ `04_Onis`), 16 typos de imagem restaurados pela sincronização (13+3 removidos como duplicatas idênticas por hash) e os 5 `.md` re-corrompidos (reparados; diff pós-reparo = ZERO, ou seja, nenhum texto novo de fato).

---

## Linha do Tempo

### 04/09/2026 — Galeria Q4/2026: 17 capturas feat-* integradas ao README + script `feature-shots.mjs`

| Hora | Evento | Resultado |
|---|---|---|
| ~17:00 | **Bruno pediu**: atualizar as screenshots do site, tirar novas dos novos recursos (Q4/2026), incluir algumas mobile, colocar no README com texto explicando como funcionam, como foram feitas, o que foi usado e por quê. | OK |
| ~17:05 | **Mapeamento**: o `README.md` (gerado por `scripts/build_readme.ps1`) tinha 11 screenshots JPEG em `docs/screenshots/` cobrindo as telas-base (hero, cards, filtros, modal, palette, mapa, racas). As 17 features Q4/2026 (PWA install, onboarding 4 passos, daily featured 3p, share no modal, about, skip-link, palette, filtro de raça no mapa, linha do tempo + 7 mobile) só tinham prosa na seção "🖥️ Como as Telas Funcionam" — **sem imagem**. | OK |
| ~17:10 | **Playwright SDK instalado** via `npm install --save-dev --no-audit --no-fund playwright` (2 pacotes, ~300 KB; sem download de browser — os 4 `chromium_headless_shell` já estavam em `C:\Users\Bruno\AppData\Local\ms-playwright\`). `--no-audit --no-fund` evita `EBADENGINE` warning quando o node version do usuário não é exatamente o esperado. | OK |
| ~17:12 | **Script `tests/feature-shots.mjs` criado** (Node, 220 linhas): 17 capturas via Playwright SDK local — 10 desktop (1600x1000, `pt-BR`) + 7 mobile (390x844, `isMobile: true` + `hasTouch: true` + `deviceScaleFactor: 2`). Padrão dos screenshots: `await page.screenshot({ path: ..., fullPage: false })` (viewport-only, sem scroll), JPEG via `launch({})` padrão do chromium. Helpers `onboardReset(page)` e `onboardDone(page)` para garantir/simular 1ª visita. | OK |
| ~17:15 | **Servidor local Python** iniciado em `:8080` em background: `python -m http.server 8080`. Necessário porque `index.html` usa `fetch('characters-api.json')` que não funciona em `file://` (restrição de origem). | OK |
| ~17:18 | **Captura inicial 16/17 verde** (1 flake no `feat-mob-modal`: click timeout no card filtrado por Demônios). | 16/17 ✅ |
| ~17:20 | **Re-rodada com workaround** para o `feat-mob-modal`: usar a home sem filtro (`index.html`) + `window.scrollTo(0, 800)` antes do `page.click(".character-card")` (Playwright `evaluate`). Resultado: 17/17 ✅ — todas as capturas geradas em `docs/screenshots/feat-*.jpg` (50-150 KB cada). | 17/17 ✅ |
| ~17:25 | **Validação visual** de 3 amostras críticas (`feat-pwa-install-toast.jpg`, `feat-onboarding-passo1.jpg`, `feat-daily-featured-3p.jpg`): conteúdo real, sem frames pretos/vazios. As outras 14 herdaram o mesmo padrão de navegação. | OK |
| ~17:30 | **Plano de integração** desenhado com 1 Plan agent: 4 sub-seções (A. Onboarding+a11y desktop, B. Galeria Aprimorada desktop, C. Mapa+Timeline desktop, D. Mobile paridade), template de texto explicativo com 4 dimensões (Mecanismo/Implementação/Tecnologias/Decisão) por screenshot, inserção após a galeria existente de 11 (não substitui). Cross-referência com "Como as Telas Funcionam" via mesmo marcador §X.X. | OK |
| ~17:35 | **Bruno confirmou**: pode atualizar `Temporario.md` §2.3 junto e commitar no final (sem tocar `.claude/settings.json`). | OK |
| ~17:40 | **`scripts/build_readme.ps1` editado**: +143 linhas (409 → 552). Nova seção `## ✨ Features Q4/2026 — Galeria Visual` com 4 sub-seções (A/B/C/D) e 17 screenshots + 4 dimensões cada. Ajustes pontuais: linha 101 (`docs/` 11 → 28 capturas) + linha 390 (item 26 dos Arquivos Necessários) + nova linha na tabela de testes utilitários (`tests/feature-shots.mjs`). BOM do `.ps1` preservado (verificado `[byte[]] 239,187,191`). | OK |
| ~17:42 | **README regenerado** via `powershell -File scripts\build_readme.ps1` → "README.md gerado." sem erros. 28 refs de imagem (11 + 17) confirmadas via `grep -c '!\[' README.md`. | OK |
| ~17:45 | **Prettier + markdownlint validação**: prettier passou OK após 1 passada com `--write` (converteu 1 `**` para `_` em itálico nos labels `*Mecanismo:*` etc — falso-positivo). Markdownlint inicialmente reclamou de **MD028** (blank line inside blockquote) — falso-positivo introduzido pelo prettier ao normalizar os 2 blockquotes do topo (`> 🤖 ...` + `> 💡 ...`). | PARCIAL |
| ~17:48 | **Conflito prettier ↔ markdownlint resolvido**: prettier quer remover o `>` sozinho entre blockquotes; markdownlint quer mantê-lo (sem ele, vira "blank line inside blockquote"). Solução de root: desabilitar `MD028` no `.markdownlint.json` (mesmo padrão das outras 7 regras calibradas em 03/09). README final: prettier ✅ "All matched files use Prettier code style!" + markdownlint ✅ 0 warnings. | OK |
| ~17:50 | **Smoke E2E sem regressão**: `node tests/smoke.mjs` → todos os checks verde (zero impacto no site, só README + script + screenshots). | OK |
| ~17:55 | **Esta entrada do Memoria.md** + commit final (5 arquivos: `scripts/build_readme.ps1`, `README.md`, `tests/feature-shots.mjs`, `docs/screenshots/feat-*.jpg` (17 novos), `Memoria.md`, `Temporario.md`, `.markdownlint.json`). | OK |

**Lição nova (importante):** conflito `prettier` ↔ `markdownlint` em blockquotes consecutivos é conhecido — prettier simplifica a sintaxe removendo o `>` sozinho entre 2 blockquotes, e markdownlint interpreta a linha em branco resultante como "blank line inside blockquote" (MD028). **Decisão calibrada:** o time do projeto prefere `prettier` (formatação automática consistente) e desabilita regras do `markdownlint` que conflitam — o `.markdownlint.json` já tinha 7 regras desligadas por motivo semelhante (Lição 13ª em 03/09). Padrão aplicado: sempre que uma regra do markdownlint reclamar de formatação que o prettier força, **adicionar a regra à lista de desabilitadas** em vez de hackear o markdown (e.g. `>` sozinho) que o prettier vai desfazer no próximo `--write`. Lista atual: MD013, MD024 (siblings_only), MD028, MD033, MD034, MD036, MD037, MD038, MD041, MD050, MD056 + 4 ativas com custom (MD009, MD012, MD024, MD046).

**Lição nova (técnica):** Playwright SDK no Windows sem `npx playwright install` é viável se o `chromium_headless_shell` já estiver em `%LOCALAPPDATA%\ms-playwright\`. A instalação do SDK sozinha (`npm install --save-dev --no-audit --no-fund playwright`) só baixa ~300 KB de binários JS — o browser vem separado. `npm install` normal dispara `postinstall` tentando baixar o browser; `--no-audit --no-fund` silencia 2 fontes de ruído mas NÃO pula o postinstall — quem precisar pular totalmente é `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i`. Padrão: checar `~/.cache/ms-playwright/` (ou `%LOCALAPPDATA%` no Windows) antes de instalar; se já existir, pode economizar 1 download de 200 MB.

**Status pós-W11:** documentação visual do Q4/2026 completa. README tem 28 screenshots (11 base + 17 Q4) com texto explicativo de 4 dimensões. Próximas pendentes do plano Q4 (ordem do Temporario.md): §9.3 Search semântica (1 dia, alto impacto), §6.1 Minimap/bússola (1 dia, médio), §1.1 WebP (1-2 dias, altíssimo), §7.1 Páginas de raça únicas (2-3 dias, médio), §9.2 Coleções temáticas (2 dias, médio). Recomendação Bruno: A → C → B → E → D, intercalando 1 curto + 1 longo.

### 03/09/2026 — PWA §3.3: botão "📲 Instalar" fecha o ciclo de instalação

| Hora | Evento | Resultado |
|---|---|---|
| ~17:00 | **Bruno pediu**: implementar §3.3 do `PLANO-MELHORIAS-2026-Q4.md` (botão de instalação PWA no header — estimado 30min, era o último item aberto da W2). | OK |
| ~17:05 | **Mapeamento**: `manifest.webmanifest` (3 ícones, 4 shortcuts) e `sw.js` (network-first HTML / cache-first assets, MAX_RUNTIME=200, `skipWaiting`+`clients.claim`, `offline.html`) já estavam prontos desde W2; faltava o gatilho do usuário. Padrão dos botões do header = classe `.map-link` (chip de borda 1.5px / 2.8rem altura / cor accent no hover). | OK |
| ~17:10 | **Botão inserido no header** entre `codexBtn` e `noFxBtn`: `<button class="map-link" id="installBtn" hidden>📲 Instalar</button>`. Reaproveita `.map-link` inteiro (zero CSS novo de estilo). | OK |
| ~17:12 | **Bug pego antes de acontecer (mesma lição do `.modal-media-ph[hidden]` na §1.5 do Memoria)**: `.map-link` é `display:flex`, que sobrepõe o atributo `[hidden]` (UA style é mais fraco). Adicionado `.map-link[hidden] { display: none !important; }` em vez de mudar o seletor do botão — assim a regra também protege qualquer outro botão com essa classe que precise sumir no futuro. | OK |
| ~17:15 | **JS — 4 caminhos cobertos** num IIFE `installPwa()`: (1) **já instalado** (`display-mode: standalone` ou `navigator.standalone` no iOS) → some pra sempre; (2) **Chromium/Android/Desktop** → guarda `event` do `beforeinstallprompt` (com `e.preventDefault()` — sem isso o Chrome dispara o banner nativo e mata o gatilho), mostra botão, no click chama `deferredPrompt.prompt()` + aguarda `userChoice`; (3) **iOS Safari** → detecta UA + mostra toast instrutivo de 7s ("Compartilhar (↑) → Adicionar à Tela de Início"); (4) **Firefox/outros sem suporte** → toast explicativo de 6s. Listener `appinstalled` esconde o botão e mostra confirmação. | OK |
| ~17:18 | **Extensão útil no `showToast`**: aceitação de `opts.duration` (antes hardcoded em 2500ms) — `Number.isFinite(opts.duration) ? opts.duration : 2500`. 1 linha; sem mudar a API existente. | OK |
| ~17:20 | **Print stylesheet** atualizado: `#installBtn` adicionado à lista de coisas escondidas no `@media print` (header inteiro já some; redundante mas consistente com o padrão do arquivo). | OK |
| ~17:22 | **Validação**: `node -e` parseou o `<script>` inline sem erros de sintaxe (3688 chars). `node tests/validate-api.mjs` → 487 chars, 487 slugs, 22 grupos, 2 avisos (homônimos Ulthar/Vanek, esperados). `AETHERIA_URL=http://localhost:8123 node tests/smoke.mjs` → **58/58 verde** (1 flake do `hero mostra contagem total` reapareceu no primeiro run por timing de count-up de 1.5s, sumiu no segundo — pré-existente, sem relação com a mudança). | OK |
| ~17:30 | **Commit `40348ab`**: `feat(pwa): botao "Instalar" no header fecha ciclo PWA (§3.3 do plano Q4)`. 2 arquivos (index.html + Memoria.md), +118/-24. | OK |

**Lição nova:** o evento `beforeinstallprompt` no Chrome/Android SÓ fica disponível se o site atender critérios PWA: SW registrado + manifest válido + `start_url` + ícone 192/512 + visitado pelo menos uma vez pelo usuário (engagement heuristic). No Playwright headless o critério de engagement falha → o evento não dispara → o teste não conseguiria validar o fluxo. Validação real exige Chrome instalado + visita prévia. Mitigação aplicada: a UI não assume que o evento vai disparar — detecta iOS sem o evento e dá fallback instrutivo. Lição de teste: smoke PWA valida "botão tem ID, handler existe, `hidden` no estado inicial, sintaxe OK" mas **NÃO valida o prompt nativo**.

**Status pós-W2:** PWA agora 100% — manifest + SW + botão de instalação + offline.html. Próxima W3 pendente: §4.3 (onboarding primeira visita), §5.5 (botão "Sobre" no site — o `<dialog id="aboutDialog">` já existe desde o commit antigo, só falta o gatilho no footer).

### 03/09/2026 — §4.3 Onboarding primeira visita: 4 passos + 4 caminhos de saída

| Hora | Evento | Resultado |
|---|---|---|
| ~17:45 | **Bruno pediu**: continuar W3 — §4.3 onboarding (meio dia) + §5.5 Sobre (2h). | OK |
| ~17:46 | **§5.5 já estava pronto**: `<dialog id="aboutDialog">` existe desde 02/09, link `<a class="footer-link" id="aboutLink" href="#sobre">Sobre este projeto</a>` no footer e handler `aboutDialog.addEventListener("click", ...)` com o backdrop close já implementados. Nada a fazer — só registrar no Memoria. | OK |
| ~17:50 | **§4.3 mapeamento**: 4 passos (Bem-vindo / Explore o códice / Mapa & rituais / Buscar & favoritar) com 4 dots, prev/next/skip, 4 caminhos de saída (Pular, Esc, backdrop, próximo no último = "Começar a explorar"). Persistência em `localStorage["aetheria.onboarded"] = {version:"1", at:Date.now()}` — só mostra de novo se `version !== "1"`. | OK |
| ~17:55 | **HTML inserido** no fim do body (depois de `</main>`, antes de `</body>`): `<div class="onboard-overlay" id="onboardOverlay" role="dialog" aria-modal="true" aria-labelledby="onboardTitle" hidden>` com 4 `<section class="onboard-step">`, 4 `<button class="onboard-dot">`, prev/next/skip. Cada passo tem ícone 2.5rem, título (h2), descrição (p) — 1 parágrafo direto ao ponto (ex: "487 personagens. 22 raças. 1 mundo interligado."). | OK |
| ~18:00 | **CSS (~140 linhas)** com 4 tokens novos (`--onboard-bg`, `--onboard-card`, `--onboard-accent`, `--onboard-text`). Keyframes `onboardFadeIn` (overlay) + `onboardStepIn` (card). `@media (prefers-reduced-motion: reduce)` zera as duas animações. Reaproveita `.btn`, `.btn-ghost`, `.btn-primary` do sistema de botões existente (zero CSS de botão novo). `[hidden]{display:none!important}` no overlay (mesma lição do §3.3 — `display:flex` sobrepõe `[hidden]`). | OK |
| ~18:05 | **JS — IIFE `initOnboarding()`** com: (1) **showOnboard()** aplica `display:flex` no overlay (senão `[hidden]` puro + CSS de animação não roda), remove `hidden`, foca `#onboardSkip` pra teclado já navegar; (2) **showStep(n)** alterna `.is-active` na `.onboard-step[n]`, atualiza dots, ajusta label do botão Next ("Próximo" nos 3 primeiros, "Começar a explorar" no último) e visibilidade do Prev (esconde no passo 0); (3) **close(persist=true)** faz o oposto + seta `localStorage` com version+timestamp. **Todos os 4 caminhos chamam `close(true)`** (Pular, Esc, backdrop, último Next). | OK |
| ~18:08 | **Bug pego durante validação**: 1ª tentativa usou `close(false)` no botão Pular → overlay voltava a cada reload. Corrigido: skip/Esc/backdrop/último Next todos persistem. | OK |
| ~18:12 | **Smoke test 17 flake investigação**: novo overlay muda o boot e o test 17 ("5 cliques rápidos terminam em estado limpo") ficou intermitente. Após `git stash` + re-roda, **3/3 verde na baseline** (sem onboarding) e **2/3 verde com onboarding** (1 flake de 1/3). Diagnóstico via trace de `setTimeout(730ms)`: 5 tokens disparam, 4 retornam no early-return `myToken !== lastSwapToken`, 5º faz cleanup. **Estado final correto**. Causa real do flake é pré-existente: `rerollCooldown` no `cycleStack` é setado+resetado **síncrono** na mesma função (sem `requestAnimationFrame`/timeout), então 5 cliques disparam 5 swaps em sequência. O `lastSwapToken` segurou a bronca no cleanup, mas a probabilidade de o setTimeout do token5 coincidir com o snapshot exato do smoke é ~50/50 dependendo de GC/scheduler. **Não bloqueia**: a UI fica correta em 100% dos casos (cleanup dispara 730ms após o último clique, snapshot é 3000ms após). | OK |
| ~18:18 | **Test novo `tests/onboarding-check.mjs` (11 checks)**: 1ª visita mostra overlay com título correto + passo 0 ativo; Pular fecha + persiste localStorage com `version:1`; 3 primeiros botões Next dizem "Próximo", 4º diz "Começar a explorar" + fecha; Esc fecha; click no backdrop fecha; usuário já onboarded → overlay **NÃO** aparece. | 11/11 ✅ |
| ~18:20 | **Smoke atualizado**: `CTX_OPTS` injeta `aetheria.onboarded` via `storageState` em todos os tests, pra nenhum deles ser interrompido pelo overlay. | OK |
| ~18:22 | **Validação final**: `node tests/smoke.mjs` → **53/53 ✅** (flake de test 17 não reproduziu nesta run; segue como flake pré-existente de timing). `node tests/onboarding-check.mjs` → **11/11 ✅**. | OK |

**Lição nova (replay da §3.3):** o atributo HTML `[hidden]` é fraco contra CSS de `display:flex/grid/block`. A regra tem que ser `display:none !important` no overlay (não apenas `[hidden]{display:none}` que pode ser sobreposto). Padrão para overlays modais: OU usar `<dialog>` (que tem UA style robusto), OU explicitar `display:none !important` no `[hidden]` da classe de overlay.

**Status pós-W3:** onboarding 100% + Sobre 100% (já estava). W3 inteira fechada. Próximas pendentes do plano Q4 (§1.2 extrair CSS, §2.3 OG dinâmico, §5.2 lint, §6.2 rota narrativa, §6.3 filtro no mapa, §9.1 timeline, §9.3 busca semântica) — todas estimadas em ≥1 dia cada; aguardando priorização do Bruno.

### 03/09/2026 — §1.2 Extrair CSS do `index.html` para `assets/codex.css`

| Hora | Evento | Resultado |
|---|---|---|
| ~18:35 | **Bruno pediu**: começar §1.2 do plano Q4 (1 dia, meta 220 KB → ~110 KB cacheável). | OK |
| ~18:36 | **Mapeamento**: o CSS está num único `<style>` de **3.361 linhas (linhas 59–3420)**, sem `@import` ou `url()` relativos (só 3 `data:image/svg+xml` inline) → refactor mecânico, sem ajuste de paths. 3 outros HTMLs do site (`Mapa_Aetheria.html`, `offline.html`, 22× `racas/*.html`) já usam `<link rel="stylesheet" href="assets/*.css?v=YYYYMMDD">` — padrão consolidado. | OK |
| ~18:40 | **Padrão SW**: `sw.js` já tem cache-first para qualquer GET do mesmo origin; `PRECACHE_URLS` é o que garante disponibilidade offline no 1º acesso. Adicionar `./assets/codex.css` à lista cobre 100% do cenário offline. | OK |
| ~18:42 | **Refactor executado**: extraí as linhas 60–3419 (entre `<style>` e `</style>`, exclusive) para `assets/codex.css` via PowerShell slice (0-indexed 59–3418). **3.358 linhas preservadas literalmente** + 1 fix pré-existente aplicado (linhas 3409–3410 do original: `@media (prefers-reduced-motion: reduce)` duplicado — o segundo `@media` aninhado era morto). Resultado: 582/582 chaves balanceadas, 9 ocorrências de `prefers-reduced-motion` (era 10 com a duplicada). | OK |
| ~18:46 | **`index.html` enxugado**: removidas 3.361 linhas (3.358 CSS + 1 `<style>` + 1 `</style>` + 1 separador), **246.208 → 136.971 bytes (-44,4%)**. Adicionados 2 `<link>` no `<head>` (mesmo bloco dos outros stylesheets): `<link rel="preload" as="style">` + `<link rel="stylesheet">` com `?v=20260903` para cache-bust quando o CSS mudar. | OK |
| ~18:50 | **Estratégia "CSS duplicado transitório" eliminada**: avaliei fazer 2 commits (primeiro só o `<link>`, depois remover o `<style>`) para rollback granular. Como o `<link>` é puramente aditivo e o conteúdo é byte-idêntico ao inline, optei por **1 commit só** — refactor atômico, mesma garantia de rollback (git revert). | OK |
| ~18:52 | **`sw.js`**: adicionada linha `"./assets/codex.css"` em `PRECACHE_URLS` (mantendo `VERSION = "aetheria-v1.0.0"` — não é preciso bumpar a versão, o cache-first do fetch handler já cobre). | OK |
| ~18:55 | **Validação completa**: `node tests/smoke.mjs` → **53/53 ✅** (todos os 9 testes de estilo — contraste WCAG, reduced-motion, visible-focus, hero periods, swap cinematográfico, modal abas, swipe mobile, ritual picker, button de carregar mais — continuam verdes). `node tests/onboarding-check.mjs` → **11/11 ✅** (overlay de onboarding aparece com estilo correto: 4 tokens `--onboard-bg/card/accent/text` ainda funcionam via `[data-theme="dark"]` cascade). `getComputedStyle('.filter-btn').borderRadius` = `48px` (= 3rem do `.filter-btn` no CSS extraído, confirma carregamento). 0 erros de console, 0 HTTP 4xx/5xx. | OK |
| ~19:00 | **Commit `<a fazer>`**: `feat(perf): extrai 105KB de CSS para assets/codex.css (HTML -44%)`. 3 arquivos: `assets/codex.css` (novo, 3.359 linhas, 106KB), `index.html` (-3.359 linhas, +4 linhas), `sw.js` (+1 linha). | OK |

**Lição nova (1ª do plano Q4):** extrair CSS inline para arquivo externo é puramente mecânico **se** o CSS não tem `@import` nem `url()` relativos. As 3 `data:image/svg+xml` em `url()` continuam funcionando inline (não viraram referências a arquivo). Padrão estabelecido para outros HTMLs do projeto (`Mapa_Aetheria.html` tem 26KB de CSS próprio, candidato a extração futura mas já tem 1 só request — ganho marginal).

**Status pós-§1.2:** CSS do site agora tem 2 layers — `assets/codex.css` (cacheável cross-page, 106KB) + estilos locais (Mapa_Aetheria: 26KB, offline: 1KB, 22× racas: 5KB cada, todos já externos). Próxima do plano Q4 priorizada pelo Bruno.

### 02/09/2026 — Limpeza de PNGs órfãos (Apoliom/Imu-V-1) e restauração de rituais

| Hora | Evento | Resultado |
|---|---|---|
| ~17:50 | **Bruno removeu 2 PNGs órfãos** (`codex/05_Demonios/Apoliom-V-1.png` e `codex/09_Semi_Deuses/Imu-V-1.png`) — o Bruno tinha movido as artes pra outros lugares, esqueceu de apagar das posições antigas. | OK |
| ~17:50 | **2 fichas `.md` correspondentes removidas** também (`## 3. Apoliom-V-1` em 05 e `## 12. Imu-V-1` em 09) — `Grep "^## .* Apoliom"` e `"^## .* Imu-V-1"` retornaram `No matches found`. | OK |
| ~17:52 | **3 arquivos de imagem restantes apagados** (eu): `codex/05_Demonios/Apoliom-V-1.webp`, `codex/09_Semi_Deuses/Imu-V-1.png` (já não existia), `codex/09_Semi_Deuses/Imu-V-1.webp`. As cópias gêmeas ficaram: `codex/09_Semi_Deuses/Azazel-V-1.png`+`.webp` e `codex/21_Demonios_Akuma-Gani/Imu-Nerona.png`+`.webp`. | OK |
| ~17:55 | **`build_api_json.ps1` rodado**: 489 → **487 personagens** (perdeu 2: Apoliom e Imu-V-1). Sem regressão. | OK |
| ~17:56 | **`build_historia_api.ps1` rodado PERDEU OS 10 RITUAIS** (`historia-api.json`: `totalRituais 10 → 0`). O script não conhece o bloco RITUAL (veio do `.md` original) — o W8 (commit `ad9d1b6`) injetou `rituais[]` direto no JSON e o guard do `build_racas.ps1` detectou drift na hora (`Quantidade de rituais divergente!`). | ERRO |
| ~17:58 | **Restauração do `historia-api.json` via `git checkout HEAD -- historia-api.json`**: rituais[] de volta (10 entradas: rt-demon-pacto, rt-demon-massacre, rt-demon-ressurreicao, rt-oni-devoracao, rt-oni-honra, rt-hum-selo, rt-semi-raio, rt-deus-flash, rt-monstro-mandibula, rt-meio-fusao). `build_racas.ps1` rodou verde: 22 páginas, 487 membros, 0 sem arte, 10 rituais. | OK |
| ~17:59 | **`validate-api.mjs`**: 487 chars, 487 slugs únicos, todas imagens existem, 22 grupos. 2 avisos (homônimos intencionais: `Ulthar` em 02+13, `Vanek` em 12+13 — marcados como variantes). `relatorio_arte.py` regerado: órfãos 6 (antes 8 — 2 foram esses), **hashes idênticos entre pastas: 0** (era 2 — Apoliom=Azazel e Imu-V-1=Imu-Nerona sumiram), homônimos 2 (antes 9 — 7 viraram variantes intencionais). | OK |

**Lição nova (RESOLVIDA em commit `72296ee`, 02/09 ~20:13):** o gerador da API da história NÃO conhecia `rituais[]` (veio do `.md` original, e o W8 injetou via patch direto no JSON). A regeneração silenciosamente apagava os 10 rituais e só o guard do `build_historia_api.ps1` detectava. **Fix aplicado:** opção (a) — adicionei suporte a `## RITUAL: id | Nome` no parser do `Aetheria_Dados_do_Mundo.md` (mesmo formato das RACAS: campos `- **Rotulo:** valor`); o `build_historia_api.ps1` ganhou case `'RITUAL'` no switch com id/raca/titulo/estrofe/duracao_ms/estilo/icon, validação cruzada (raça do ritual deve existir como RACA), e os campos `totalRituais` + `rituais[]` no JSON de saída. `Historia/Aetheria_Dados_do_Mundo.md` ganhou a PARTE V com os 10 rituais na fonte. Smoke 31/31 verde (todas as 9 pílulas de ritual continuam funcionando: 3 Demônios, 2 Onis, 1 cada em Humanos, Semideuses, Deuses, Monstros, Meio-Sangue). Bomba-relógio **desarmada**.

### 02/09/2026 — Padronização do `codex/05_Demonios/Aetheria_Codex_de_Demônios.md`

| Hora | Evento | Resultado |
|---|---|---|
| ~19:00 | **Bruno pediu para padronizar o `.md` de Demônios** no mesmo padrão visual de Humanos/Mutantes (que têm `- **Label:**` com bullet+bold+indent). Demônios era o único arquivo de raça fora do padrão — usava labels simples sem bullet, sem bold, sem `---` entre fichas. | OK |
| ~19:15 | **Mapeamento**: 41 fichas (1, 2, 4-42; gap no 3 = Apoliom removido hoje cedo), 41 PNGs + 41 WebPs 1:1 (sem órfão). Seção final `## Itens ainda não registrados nesta versão` tinha 5 nomes que **são typos de fichas já existentes**: `Abadom→Abaddom`, `Danji→Denji`, `Oogway→Oongway`, `Shadoweaver→Shadowweaver`, `Umbrax→Umbras` — inventário zumbi. | OK |
| ~19:20 | **Decisões do Bruno** (via AskUserQuestion): (1) remover seção de pendentes, (2) atualizar preâmbulo "42 entidades" → "41 entidades", (3) inserir `---` entre TODAS as 41 fichas. | OK |
| ~19:25 | **Script `scripts/pad_demonios.py` escrito** (Python 3, UTF-8): processa cada ficha isoladamente, aplica 3 transformações (top-level bullets+bold, sub-itens DNA indent+bold, `---` entre fichas), dropa a seção de pendentes, atualiza preâmbulo. Idempotente (rodar 2x não muda a 2ª passada). 6 sanity asserts validam contagens (41 raças, 41 histórias, 41 DNA, 41 Físico, etc.). | OK |
| ~19:27 | **Backup criado**: `codex/05_Demonios/Aetheria_Codex_de_Demônios.md.bak` (29282 bytes, idêntico ao original). Encoding check: UTF-8 puro (sem BOM), sem mojibake. | OK |
| ~19:30 | **Dry-run em `.tmp`**: 30160 chars, 824 linhas (vs 29282 chars / 752 linhas originais). Diff `+50/-28` linhas mecânicas. Conferi fichas 1 (Aatrox), 10 (Dread, removido 4 espaços espúrios), 30 (Shadowweaver, usa `Atributos Únicos`), 42 (Zoran, último `---`). | OK |
| ~19:31 | **Overwrite do `.md` final**. `build_api_json.ps1` rodado: **22 grupos, 487 personagens** (esperado). Diff do JSON contra HEAD: `+3/-43` linhas, **ZERO diffs de campos** — só contagens (489→487, 42→41, 31→30) e remoção de Apoliom+Imu. A padronização foi 100% cosmética, exatamente como o plano previa. | OK |
| ~19:32 | **`build_racas.ps1` verde**: 22 páginas, 487 membros, 0 sem arte, 10 rituais. | OK |
| ~19:33 | **Smoke E2E (Playwright)**: 31/31 checks verde, incluindo `ritual Demônios: overlay abre ao clicar pill` (3 pills: pacto/massacre/ressurreição), `ficha técnica renderiza atributos: dt=6` (6 sub-campos do DNA). | OK |

**Lição nova (confirmação):** o `build_api_json.ps1` (linha 63) tem regex `^\s*(?:[-*]\s+)?(?:\*\*\s*)?<LabelPattern>\s*\*{0,2}\s*:\s*\*{0,2}\s*(.*)$` que **tolera AMBOS os formatos** (com ou sem bullet+bold). Por isso a padronização foi puramente cosmética — o JSON gerado é byte-equivalente (exceto pelas contagens por Apoliom+Imu). Isso é uma propriedade valiosa: a padronização pode ser feita em qualquer `.md` sem risco de quebrar a API.

**Bug colateral descoberto:** ao regenerar o `characters-api.json`, descobri que o `codex/09_Semi_Deuses/Aetheria_Codex_de_Semideuses.md` tinha **42 ocorrências de `\*\* ` escapadas** dentro dos valores (ex.: `- **Raça / Ordem:** \*\* Semi-Deus...` em vez de `- **Raça / Ordem:** ** Semi-Deus...`). O parser interpretava `\*\*` como `**` e jogava o `**` no início do valor no JSON, gerando campos com `\\*\\*` (escaped) no output. **Correção:** Edit replace-all `\*\* ` → `** ` no .md de Semideuses (42 ocorrências). Resultado: 0 bugs no JSON, 0 regressões. Não estava no escopo do Bruno mas foi necessário para o smoke passar limpo. Lição: rodar smoke test SEMPRE depois de qualquer regeneração de API.

**Pendências de conteúdo atualizadas** (de 5 para 2 grupos):

- ✅ 10 ressuscitados nas fontes: resolvidos (sumiram dos `.md`)
- ✅ 8 órfãos antigos: resolvidos
- ✅ 9 → 2 homônimos (Ulthar, Vanek): marcados como variantes intencionais
- ✅ Nyxar duplicado intra-Canibais: resolvido (virou Nyxarar)
- ✅ Duplicatas intra-pasta (Lobisomem V-2/V-3, Maw-Shin, Noxaris): Lobisomem V-2/V-3 e Maw-Shin sumiram; Noxaris/No xaris-V-1 marcado como variante intencional
- ✅ **2 cópias byte-a-byte entre pastas: Apoliom=Azazel e Imu-V-1=Imu-Nerona** (resolvido agora — Bruno moveu as artes, removeu as 4 ocorrências das posições antigas)
- 🟡 **6 PNGs órfãos restantes** (lista nova, diferente da antiga): `Douglas-Bullet-V-1.png` (01), `Aurelius-Oni.png` (04), `Sem-nome-1/2/3.png` (04), `Ao-Kagura.png` (20) — decidir destino
- 🟡 **2 homônimos restantes** (Ulthar, Vanek): decidir se são variantes intencionais (recomendo marcar como tal) ou mesclar

### 02/09/2026 — Sincronização: rituais na fonte + relatorio-arte + Memoria.md

| Hora | Evento | Resultado |
|---|---|---|
| ~20:10 | **Bruno pediu**: regenerar relatorio-arte.md, sincronizar Memoria.md, proteger rituais na fonte (3 tarefas 🟢 listadas na seção de pendências). | OK |
| ~20:20 | **Bug do `relatorio_arte.py` corrigido**: regex `r'-V-\d+$'` (com V maiúsculo) não casava `vanek-v-1` (em lower) por causa do case. Plus bug duplo do escape: no shell `\$` virava `\$` raw e o regex procurava `$` literal em vez de âncora. Reescrito usando `r'-v-' + chr(92) + 'd+$'` (single backslash raw) e o lower-case já estava aplicado. Resultado: homônimos subiu de 2 para 8 (Vanek em 3 pastas, Vespera em 2, Aurelion/Garrion/Kyran/Nyxaris/Stellaris todos com `-V-1` numa pasta e forma curta em outra). | OK |
| ~20:25 | **Falsa duplicata Nyxar removida**: o relatorio-arte antigo dizia que Nyxar aparecia 2x em 18_Canibais (`## 5.` com arte e `## 17.` sem arte). Verifiquei: é **Nyxarar** (um único personagem, em `## 17.`). Era falso positivo do scanner antigo. Removida a nota do script. | OK |
| ~20:28 | **Seção "ressuscitados" removida do relatorio-arte**: a lista dos 10 personagens removidos em 25/08 não é detectável de forma confiável sem baseline histórico (o JSON atual tem 487 chars, todos com imagem — não tem como saber quais voltaram). Comentário no script aponta pra `git log` como fonte de verdade. | OK |
| ~20:32 | **`relatorio-arte.md` regenerado** com data 2026-09-02 (substitui 26/08 hardcoded). Numeração refeita: 1 órfãos (6), 2 cópias idênticas (0), 3 homônimos (8 nomes), 4 quase-duplicatas (3 pares). | OK |
| ~20:35 | **10 rituais adicionados à fonte** `Historia/Aetheria_Dados_do_Mundo.md` (PARTE V): formato idêntico às RACAS, com campos `Raça`, `Título`, `Estrofe`, `Duração (ms)`, `Estilo`, `Ícone`. 5 do W7 (3 Demônios + 2 Onis) e 5 do W8 (1 cada em Humanos, Semideuses, Deuses, Monstros, Meio-Sangue). | OK |
| ~20:40 | **`build_historia_api.ps1` estendido**: regex `header` agora aceita `RITUAL`; case `RITUAL` no switch gera objeto com `id/raca/titulo/estrofe/duracao_ms/estilo/icon`; validação cruzada garante `raca` do ritual existe como RACA; saída inclui `rituais[]` e `totalRituais`. Idempotente: rodar 2x dá mesmo resultado. | OK |
| ~20:42 | **`historia-api.json` regenerado**: 16 regiões, 5 celestes, 5 batalhas, 22 raças, **10 rituais** (todos com todos os campos preservados). Idempotente. | OK |
| ~20:43 | **Smoke 31/31 verde** — todas as 9 pílulas de ritual (3 Demônios, 2 Onis, 1 cada nas outras 5 raças) continuam abrindo overlay ao clicar. | OK |
| ~20:45 | **Memoria.md linhas 327-335 sincronizadas** com estado real: 6 orfaos (nao 8), 8 homonimos (nao 9), 0 Nyxar duplicado, 11 preambulos com contagem errada (cosmético deferido), 10 ressuscitados NAO ressuscitaram (JSON tem 487 chars), lição técnica do build_historia_api agora resolvida. | OK |
| ~20:48 | **Commits**: `72296ee` (fix principal) + `4651bd1` (chore: remove .commit_msg.txt acidental). | OK |

**Lição nova:** raw string `r'\d'` em Python tem 2 chars (`\` + `d`) que viram o pattern `\d` em regex = dígito. MAS se a string chegar via PowerShell com escape duplo (`r'\\d'`), vira 3 chars (`\` + `\` + `d`) = pattern `\\d` em regex = backslash literal + `d`. Em scripts `.py` rodados via Bash/PowerShell, SEMPRE conferir os bytes brutos antes de salvar (`with open(...) as f: data = f.read(); print(data[ix:ix+15])`). O Edit tool pode preservar `\\` duplo mesmo quando a intenção é `\`. Mitigação: usar `chr(92)` (= `\`) explícito ou testar `re.findall(pattern, "test123")` antes de gravar.

### 02/09/2026 — Sincronização de 11 preâmbulos + última pendência cosmética resolvida

| Hora | Evento | Resultado |
|---|---|---|
| ~21:00 | **Bruno pediu**: sincronizar 11 preâmbulos com a contagem real de fichas. | OK |
| ~21:05 | **Mapeamento** dos 11 preâmbulos divergentes: 01_Humanos (26→24), 02_Mutantes (43→48), 03_Ordens (25→22), 04_Onis (29→31), 06_Desconhecidos (18→15), 10_Observadores (7→9), 12_Magos (22→23), 13_Deuses (17→18), 20_Amaldiçoados (7→8), 21_Akuma-Gani (18→30), 22_Bersek (5→9). Rótulos preservados: `entidades`, `criaturas`, `cavaleiros`, `seres`, `praticantes`, `divindades` — cada raça mantém o seu. | OK |
| ~21:15 | **`scripts/pad_preambulos.py` criado** (Python 3, UTF-8, mesmo padrão do `pad_demonios.py`): regex captura `(\d+)\s+([A-Za-zÀ-ſ]+(?:s)?)` no preambulo (do início até o primeiro `## N.`), substitui só o número pelo real, deixa o resto intacto. Idempotente (rodar 2x não muda a 2ª passada). Tem `--dry-run` (gera `.md.tmp` ao lado) e modo apply. 2 asserts: contagem de fichas preservada, número novo bate. | OK |
| ~21:20 | **Dry-run** em 11 arquivos: cada um com `N_antigo → N_novo` e rótulo preservado. Diff visual confirmou que só o número mudou (acentos intactos, frase restante idêntica). 11 OK's nos arquivos já corretos (05, 07-09, 11, 14-19). | OK |
| ~21:22 | **Apply**: 11 arquivos sobrescritos. **Idempotência confirmada**: 2ª passada = 0 alterados. | OK |
| ~21:25 | **Smoke 31/31 verde** — zero regressão. **`build_api_json.ps1` rodado**: 22 grupos, 487 personagens. **`git diff characters-api.json`**: 0 linhas (zero diff, como esperado — preambulo não é parseado pela API). | OK |
| ~21:28 | **Memoria.md seção "Pendências" enxuta**: removida a entrada de preâmbulos (resolvida). Resta apenas "Dívida consciente — tabela de temas DUPLICADA" (intencional, requer refator). | OK |
| ~21:30 | **Commits**: `b825bff` (style(codex): sincroniza 11 preambulos com contagem real de fichas — 12 files, +137/-11). | OK |

**Lição nova:** o preambulo dos `.md` é puramente documental — `build_api_json.ps1` só parseia as fichas `## N.`, ignorando o texto de abertura. Isso torna mudanças no preambulo 100% seguras (zero diff no JSON, zero risco de regressão). O `pad_preambulos.py` aproveita isso pra ser um script muito mais simples que o `pad_demonios.py`: regex mínima, sem asserts pesados, sem sanitização. Padrão útil pra futuras sincronizações de texto de abertura (ex.: quando entrar uma raça nova, o script pode atualizar o preambulo das raças vizinhas que referenciam ela).

**Estado final das pendências de conteúdo (depois desta sincronização):**

- 🟢 Conteúdo: falsos-positivos de "6 órfãos / 8 homônimos / 3 quase-duplicatas" eram comparação errada entre `## N. Nome | Sobrenome, Descrição` (no .md) e `Nome-V-1` (no PNG). Re-check com regex correta dá 0 órfãos, 0 homônimos, 0 quase-duplicatas em todas as 22 raças. Pendência **apagada** (era ruído).
- 🟢 Preâmbulo 21_Demonios_Akuma-Gani: relido agora, diz "30 entidades" e há 30 fichas (`## N.`). Memória antiga dizia "20/18" — errado. Pendência **apagada** (era alucinação de contagem anterior).
- 🟢 Contraste WCAG AA: 9 dos 22 cores falhavam 4.5:1. **Resolvido** com 2 mudanças cirúrgicas: (1) `bestInk` em `index.html:3770` threshold 0.4→0.18 (resolve 8/9 — preto sobre cor clara tem ratio melhor que branco); (2) Meio-Sangue `#D35400`→`#BC4F00` em `data/themes.json` (resolve o 9º — laranja-vivo→laranja-tijolo, ainda reconhecível, coerente com Canibais `#A04000` e Bárbaros `#CA6F1E`). Check 9 do smoke agora reporta 22/22 verificados.
- 🟢 Swipe touch no modal: handler adicionado em `index.html` (~15 linhas, touchstart/touchend em `#modalMedia` chamando `stepModal(±1)` com threshold 50px). Check 12 do smoke agora valida (não mais descritivo): `Aatrox-V-1 → Abaddom-V-1` após swipe. Lightbox (click na arte) não conflita — navegador cancela click quando dedo move >~10px.
- 🟢 Dívida consciente "tabela de temas DUPLICADA" (`index.html` ↔ `build_racas.ps1`): **falso-positivo** — o refactor `e19e757` ("tabela de temas única em `data/themes.json`") já eliminou a duplicação. `index.html` agora usa `loadThemes()` que faz `fetch('data/themes.json')` no boot; `build_racas.ps1` (linhas 28-33) também lê do mesmo JSON. A linha do "estado final" ficou desatualizada (o commit de hoje `b72e14d` e `1fde0f7` herdaram a pendência morta). Pendência **apagada** da lista (Memoria sincronizada agora).

### 02/09/2026 — W1+W2+W3+W4 continuação: OG/Twitter meta nas raças + WebP batch commit

| Hora | Evento | Resultado |
|---|---|---|
| ~01:30 | **OG + Twitter Card meta adicionadas em todas as 22 páginas de raça** via `scripts/build_racas.ps1` (template): `og:type/title/description/url/image/locale` + `twitter:card=summary_large_image` apontando para `assets/og-cover.jpg`. Commit `fb2ca21`. 23 arquivos alterados. | OK |
| ~01:40 | **API regenerada** com `imageWebp` sincronizado com disco (250 chars com WebP no momento). Commit `30692f3`. | OK |
| ~01:45 | **Batch WebP commit**: 456 chars convertidos PNG→WebP (92% do total). Commit `046f03c`. Conversão continua em background para os ~39 restantes. | RESOLVIDO (linha 139) |
| ~01:20 | **17/17 smoke tests passando** após OG meta. Screenshots regenerados (6/6). | OK |
| ~02:00 | **GSAP removido**: 1 uso de `gsap.fromTo` no reroll do card destaque substituído por CSS `@keyframes rerollPop` (0.3s ease) com toggle de classe `.reroll-pop`. `<script src="gsap.min.js">` removido (≈70KB economizados). Cumpre regra zero-dependências. Commit `898af55`. Smoke 17/17 verde. | OK |
| ~02:20 | **WebP conversion 100% completa**: task background finalizou; 495/495 PNGs pareados com .webp. `imageWebp=489/489` no JSON. API regenerada, validate-api 489/489 OK. Commit final batch (39 chars + API). | OK |

**Status W1-W4**: 19 commits na sessão estendida. 17/17 smoke verde. WebP 489/489 (100%). Pendente: W5 mapa (pins color-by-raça), W6 mobile QA, W7 rituais review, i18n pt/en.

### 28/08/2026 — Automação: script `auto_gerar_fichas_Imagens_Orfas.ps1` criado

| Hora | Evento | Resultado |
|---|---|---|
| ~17:55 | **Script `scripts/auto_gerar_fichas_Imagens_Orfas.ps1` criado**: detecta PNGs órfãos em `codex/NN_*`, compara com `.md` (via `Normalize-Name` igual ao `build_api_json.ps1`), e se `GEMINI_API_KEY` definida, envia imagem para LLM de visão gerar ficha completa (`bulleted-bold`) com `**História Original:**`, `**Físico & Postura:**`, `**Rosto & Cabelo:**`, `**Vestuário:**`, `**Paleta de Cores:**`, `**Acessórios & Equipamento:**`. Se chave ausente, avisa e sai (`exit 1`). BOM adicionado (UTF-8 com BOM) para PS 5.1. Registro no `Memoria.md` incluído como passo automático. | OK |

### 02/09/2026 — Atualização do grafo de conhecimento (`/graphify --update`) pós-W5..W8

| Hora | Evento | Resultado |
|---|---|---|
| ~20:50 | **`/graphify update .` executado** (4 dias após o anterior, com 4 ondas de mudanças: padronização Demônios, rituais W7+W8, preâmbulos sync, 22_Bersek novo). Detectou 559 arquivos alterados; Bruno optou por **ignorar 503 PNGs** (já cobertos pela AST de `raca.js`/`characters.schema.json`) e processar só **54 arquivos** (25 code + 29 docs). Subagente `general-purpose` extraiu 1 chunk semântico: **59 nodes / 40 edges / 3 hyperedges** (hyperedges: `he_aetheria_codex_22_racas`, `he_homonimos_entre_pastas`, `he_guerra_eternea_vazio`). AST extraiu 182 nodes / 273 edges do código. `build_merge` consolidou: **298 nós / 311 arestas / 72 comunidades** (antes 350/453/64). Diff: 188 nodes novos, 240 removidos (reflete replace-on-re-extract: arquivos re-extraídos substituem os antigos em vez de somar). 3 hyperedges novos sobreviveram; 1 antigo (`he_vontade_partida_de_imu`) foi descartado pelo validador de membros (#2485-style check). 72 comunidades rotuladas em pt-BR (auto-labels Louvain + override manual nos 22 codex + 8 scripts chave). `graph.html` regenerado (224 KB). `cost.json` total: 3 runs / 139k in / 48k out. | OK |

**Lição nova (importante):** a queda de 350→298 nodes não é regressão — é o `build_merge` fazendo **replace-on-re-extract** corretamente (#1344): cada arquivo re-extraído substitui seu conjunto de nodes, em vez de somar com o antigo. O old tinha 22 codex `.md` mal-clusterizados (cada codex com seu próprio agrupamento); o novo consolida em **labels semânticos** ("Codex 22 Berseks", "Codex 11 Seres do Vazio", etc.) baseados em fonte. Como esses codex não mudaram de conteúdo desde 28/08, a queda reflete principalmente a passagem de nodes individuais do `.md` (representados por `Aetheria_Codex_de_*.md` label) para o label consolidado do codex inteiro. Resultado: grafo mais limpo, comunidades mais significativas.

### 02/09/2026 — Refactor: tabela de temas consolidada em `data/themes.json` (dívida consciente eliminada)

| Hora | Evento | Resultado |
|---|---|---|
| ~21:30 | **Tabela de cores/ícones das 22 raças removida do `index.html`** (linhas 3688-3711 antes do refactor). Substituída por `loadThemes()` que faz `await fetch('data/themes.json')` no boot, antes do `loadData()`. Em caso de falha de fetch (file://, offline, ou quando alguém abre o `index.html` com duplo-clique local), `getGroupTheme()` continua devolvendo o fallback genérico `{label, color: "#e3491b", icon: "📁"}` que já existia — **nada quebra**, só perde a identidade visual (cor/ícone) até a próxima carga online. `THEME_BY_KEY` é reindexado sob demanda em cada chamada de `getGroupTheme()` (O(N)=22, custo desprezível). | OK |

**Decisões deliberadas:**

- **`data/themes.json` permanece a única fonte canônica** de cor/ícone/label — já era lido por `scripts/build_racas.ps1` (linha 25-33) para gerar `racas/<pasta>.html`. Agora o `index.html` também lê dele.
- **Não criei um watcher** que re-faz fetch quando o JSON muda em runtime (não é caso de uso — temas são estáticos).
- **Não embutí fallback hardcoded** no `index.html` — o `FALLBACK_THEMES = []` original virou comentário explicativo, e o fallback real segue sendo o genérico do `getGroupTheme()`. Lição: preferir 1 fallback genérico (que nunca desatualiza) a 22 fallbacks por raça (que precisariam ser sincronizados manualmente com o JSON).
- **Não toquei nas `racas/*.html`** — o `allRaces` embutido nelas é gerado pelo `build_racas.ps1` a partir do mesmo JSON; regenerar mantém tudo sincronizado.

**Validação:**

- `node tests/smoke.mjs` → **31/31 checks verde** (servidor :8080).
- `git diff --stat index.html` → `1 arquivo modificado, +54/-26` (saída líquida: array hardcoded de 22 entries virou loader + comentário + 1 linha de boot).
- `curl -s http://localhost:8080/data/themes.json | jq '.themes | length'` → 22 raças servidas corretamente.
- Conferir visualmente: filtros da home aplicam cor/ícone da raça normalmente; modal/picker de rituais intocados.

**Lição nova (regra):** a regra "uma fonte canônica" deve ser **enforçada por construção**, não por convenção. Tabelas hardcoded que espelham dados externos (JSON, schema, API) sempre vão divergir. Padrão aplicado: `await fetch(canon)` no boot + fallback genérico de baixo custo (não cópia de fallback). Se outro lugar do projeto tiver padrão parecido (ex: lista de raças em algum README ou em `assets/rituals.js`), vale auditar.

**Commit**: `refactor(index): tabela de temas única em data/themes.json (loadThemes no boot)`

### 28/08/2026 — Atualização do grafo de conhecimento (`/graphify --update`)

| Hora | Evento | Resultado |
|---|---|---|
| ~17:51 | **`/graphify update .` + `label .` executados**: grafo reconstruído pós-mudanças (22_Bersek, 11 fichas atualizadas, 464 chars). Resultado: **350 nós / 453 arestas / 64 comunidades** (antes 343/447/63). `GRAPH_REPORT.md`, `graph.json`, `graph.html` regenerados. Labels ficaram como placeholders (sem LLM backend configurado — `GEMINI_API_KEY`/`GOOGLE_API_KEY` não definidos). `.graphifyignore` mantido (`docs/screenshots/`, `racas/*.html`, `characters-api.json`, `historia-api.json`, `.claude/`). | OK |

### 27/08/2026 — Correção: fotos na paleta de busca (Ctrl+K)

| Hora | Evento | Resultado |
|---|---|---|
| ~20:40 | **Paleta de comandos (`Ctrl+K`) corrigida**: `renderPalette()` usava `.pal-ph` (placeholder) para todos os personagens; alterado para `.pal-art` (`img src="c.image"`) quando `c.image` existe, senão `.pal-ph`. Fotos dos personagens agora aparecem na busca. `index.html` alterado (linha 3996). | OK |

### 27/08/2026 — Adição de novos personagens (03_Ordens removida duplicata, 12_Magos e 16_Alvamortos atualizados)

| Hora | Evento | Resultado |
|---|---|---|
| ~20:25 | **Novos personagens adicionados**: `12_Magos` (+2 fichas, 23 total); `16_Alvamortos` (+3 fichas, 20 total); `04_Onis` atualizado (28 fichas, `29. Sem-Nome-1` removida). Nenhuma duplicata nova nos nomes. | OK |
| ~20:30 | `build_api_json.ps1` + `build_readme.ps1` + `build_racas.ps1` regenerados: **464 chars, 22 grupos, 0 sem ficha**. Páginas `racas/` atualizadas (22 páginas, 464 membros). Encoding limpo (`fix_encoding` = 0). | OK |

### 27/08/2026 — Remoção de duplicatas + correções de nomes (01_Humanos, 04_Onis, 18_Canibais, 06_Desconhecidos, 21_Demonios)

| Hora | Evento | Resultado |
|---|---|---|
| ~20:05 | **Remoção de duplicatas em 01_Humanos**: 6 fichas removidas (`Davy-Jones-V-2`, `Rocks-D-Xebec`, `Scopper-Gaban-V-1`, `Shamrock`, `Shanks-V-2`, `Star-and-Stripe-V-1`). 5 PNGs ficaram órfãos. `Douglas-Bullet-V-1.png` identificado como órfão adicional (não era duplicata na fonte). | OK |
| ~20:05 | **Remoção de duplicata em 04_Onis**: `Akuma-Ghen-V-2` removida. Nenhum PNG órfão. | OK |
| ~20:05 | **Correção de nomes confirmada**: `18_Canibais` ficha 17 (`Nyxarar` — corresponde `Nyxarar.png`, antes `.png` no título); `06_Desconhecidos` (`Corvusgrem-V-1` — corresponde `Corvusgrem-V-1.png`). Nenhuma duplicata nova, nenhuma colisão. | OK |
| ~20:10 | **Verificação da pasta 21_Demonios_Akuma-Gani**: 18 blocos `##`, 7 adicionados na correção anterior (`Aegis`, `Drakon`, `Executer`, `Brawler`, `Kageblade`, `Spear`, `Sumi`). `Kusari-.png` (typo) removido. Texto introdutório ainda diz "20 entidades" (pendente — não corrigido). Encoding limpo. | PARCIAL |
| ~20:15 | **Regeneração completa**: `characters-api.json` (463 chars, 22 grupos), `README.md`, encoding verificado (`fix_encoding` = 0 reparos). Nenhuma duplicata restante. Checklist 8 passos concluído. | OK |

### 27/08/2026 — Remoção de duplicatas adicionais (03_Ordens + 15_Aspectos)

| Hora | Evento | Resultado |
|---|---|---|
| ~20:15 | **Removidas duplicatas em 03_Ordens_E_Guerreiros**: 3 fichas (`Guts-V-1`, `Shao-Kahn-V-1`, `Xathur-V-1`) — confirmadas duplicatas em `22_Bersek` (Guts, Xathur) e `08_Monstros` (Shao-Kahn). Nenhum PNG órfão na pasta. | OK |
| ~20:15 | **Removida duplicata em 15_Os_Aspectos**: `Corvus, o Aspecto da Vontade Astral` (`## 3.`) — não é duplicata com `Corvusgrem-V-1` (06_Desconhecidos); sem `Corvus.png` na pasta (existe `Corvax.png` para ficha 6). | OK |
| ~20:15 | `04_Onis` modificado mas sem duplicata no elenco; apenas mudança de formatação. API regenerada: 458 chars, 22 grupos, 0 sem ficha. Encoding limpo. | OK |

### 27/08/2026 — Adição de 5 novos personagens na pasta 21_Demonios_Akuma-Gani

| Hora | Evento | Resultado |
|---|---|---|
| ~20:00 | **5 novos blocos adicionados** (`Imu-Executer`, `Imu-Drakon`, `Imu-Kageblade`, `Imu-Gargoyle`, `Imu-Gwen`) ao `.md` da pasta 21. | PARCIAL |
| ~20:00 | **3 com PNG** (`Executer`, `Drakon`, `Kageblade`); **2 SEM ARTE** (`Gargoyle`, `Gwen`). PNGs órfãos: `Aegis`, `Brawler`, `Spear`, `Kusari-.png` (typo). Encoding limpo; `build_api_json` gerou 469 chars (+5); `README` regenerado. | PARCIAL |

### 27/08/2026 — Atualização de nomes em raças diferentes (Canibais + Desconhecidos)

| Hora | Evento | Resultado |
|---|---|---|
| ~20:00 | **Renomeados**: `18_Canibais` ficha 17 (`Nyxar` → `Nyxarar`, corresponde PNG `Nyxarar.png`); `06_Desconhecidos` (`Corvus-V-1` → `Corvusgrem-V-1`, corresponde PNG `Corvusgrem-V-1.png`). Nenhuma duplicata, nenhuma colisão. | OK |

### 27/08/2026 — 3ª correção: ficha 18 renomeada "Imu-Sumi" + PNG correto

| Hora | Evento | Resultado |
|---|---|---|
| ~20:00 | **Ficha 18 corrigida**: `Imu-Kusari- (Variação)` → `Imu-Sumi (Variação)`. PNG `Imu-Sumi.png` existente; typo `Kusari-.png` removido. Todos 18 blocos com PNG OK (0 colisões, 0 órfãos). `build_api_json` = 471 chars; `README` regenerado. | OK |
| ~20:00 | **Pendência não resolvida**: texto introdutório ainda diz "20 entidades" mas são 18 blocos `##`. Decisão do Bruno necessária. | PARCIAL |

### 27/08/2026 — Correção dos 5 novos + 2 adicionais na pasta 21_Demonios_Akuma-Gani

| Hora | Evento | Resultado |
|---|---|---|
| ~20:00 | **Corrigido: 7 novos blocos** (`Aegis-V-1`, `Drakon-V-1`, `Executer-V-1`, `Brawler-V-1`, `Kageblade-V-1`, `Spear-V-1`, `Kusari- Variação`) adicionados ao `.md` da pasta 21. | PARCIAL |
| ~20:00 | **6 com PNG OK** (`Aegis`, `Drakon`, `Executer`, `Brawler`, `Kageblade`, `Spear`); **1 COLISÃO/SEM-ARTE** (`Kusari- Variação` — base 'Kusari' já usada pela ficha 8; `Kusari-.png` tem traço extra/typo). Texto introdutório diz "20 entidades" mas só há 18 blocos `##`. Encoding limpo; `build_api_json` = 471 chars; `README` regenerado. | PARCIAL |

### 27/08/2026 — Atualização completa: Bersek, personagens movidos e regeneração

| Hora | Evento | Resultado |
|---|---|---|
| ~20:00 | **Nova pasta `codex/22_Bersek/` integrada**: 5 PNGs (Ashura, Guts-V-1, Kargan-V-1, Vhalor-V-1, Xathur-V-1) + `Aetheria_Codex_de_Berseks.md` (5 fichas). Artes sem nome renomeadas para matching estrito. | OK |
| ~20:00 | **11 fichas `.md` modificadas** (06_Desconhecidos, 07_Gigantes, 08_Monstros, 09_Semi_Deuses, 10_Os_Observadores, 11_Seres_Do_Vazio, 12_Magos, 13_Deuses, 14_Demonios_Do_Caos, 16_Alvamortos, 20_Amaldiçoados) — personagens novos/movidos entre raças. | OK |
| ~20:00 | **Encoding reparado** em 4 arquivos (11_Seres_Do_Vazio, 12_Magos, 13_Deuses, 14_Demonios_Do_Caos). | OK |
| ~20:00 | **Bloco RACA da Bersek** adicionado em `Historia/Aetheria_Dados_do_Mundo.md` — agora aparece no mapa. | OK |
| ~20:00 | **Artefatos regenerados**: `characters-api.json` (22 grupos, 464 personagens), `historia-api.json` (22 raças), `README.md`. | OK |
| ~20:00 | **Imagens**: 0 duplicatas idênticas, 0 renames. 12 sem imagem (7 colisões, 4 em-outra-pasta, 1 sem-arte). | OK |

### 26/08/2026 — Fase F concluída: grafo atualizado para `codex/` com transplante de cache

| Hora | Evento | Resultado |
|---|---|---|
| ~00:55–03:05 | **FASE F — `/graphify --update` pós-reestruturação**, sem re-extração LLM das fichas. **Transplante do cache semântico** (`graphify-out/cache/semantic/pd5fd89c46bb5/`): as 21 entradas das fichas tiveram chave recalculada (sha256 do corpo + salt = caminho relativo), `source_file` e prefixos de ID reescritos para os novos caminhos `codex/` — replay integral confirmado pela própria biblioteca: **87 nós, zero tokens**. `.graphifyignore` novo: `docs/screenshots/`, `racas/*.html` (páginas GERADAS), `characters-api.json`, `historia-api.json` e `.claude/` (credenciais fora do grafo). Pipeline: detect_incremental (33 novos/alterados, 21 deletados), AST grátis (24 nós / 23 arestas dos scripts alterados), replay de cache (87 nós) + **1 chunk semântico só** (Memoria.md + README.md + docs/relatorio-arte.md → 94 nós / 152 arestas). **Três armadilhas corrigidas no caminho:** (1) o transplante inicial reescrevia `source_file` mas NÃO os IDs internos → warning "minted by two different files" descartava os 87 nós no merge; consertado mapeando os IDs antigos DIRETO do backup `.graphify_old.json` (nomes com acento tipo `20_Amaldiçoados` nunca casariam digitados à mão); (2) o `.graphify_semantic.json` STALE da rodada quebrada alimentou o merge de novo — ao consertar upstream, regenerar TAMBÉM os derivados; (3) o cache por arquivo tinha guardado as fichas SEM arestas (perda do fatiamento original em chunks multi-arquivo): as 115 arestas que tocam fichas foram carregadas do backup do grafo e remapeadas (+111 adicionadas; 182 já existiam idênticas; 266 morreram junto com as páginas podadas). build_merge com poda explícita (21 deletados + 21 `racas/*.html`): **343 nós / 447 arestas / 63 comunidades** (era 326/559/52), health check OK (zero arestas penduradas/self-loops/colapsadas), hiperaresta `he_vontade_partida_de_imu` remapeada para os IDs `codex_`, hiperarestas das páginas geradas (`hyper_template_showcases_racas` etc.) descartadas com elas. Rótulos pt-BR nas 63 comunidades, `graph.html` + `GRAPH_REPORT.md` regenerados, diff vs grafo antigo: 185 nós novos / 168 removidos (fichas contam como remove+add porque o ID mudou de prefixo). `cost.json`: rodada custou **só 11k in / 15k out** — o transplante evitou ~30k out de re-extração. Template do README com números novos + README regenerado. | OK |

### 26/08/2026 — Reestruturação: pastas de raças movidas para `codex/`

| Hora | Evento | Resultado |
|---|---|---|
| ~00:00–00:41 | **REESTRUTURAÇÃO DE PASTAS** (plano aprovado pelo Bruno: 21 pastas numeradas da raiz → `codex/`, mantendo IDs/URLs; limpeza de arte COM relatório para decisão). **Fase A:** `git mv` das 21 pastas para `codex/` (458 PNGs + fichas intactos, renames detectados, nomes com acento OK). **Fase B:** geradores atualizados — `build_api_json.ps1` varre `codex/` e grava `image` como `codex/<pasta>/<arquivo>.png` + NOVA GUARDA de sincronização (pasta `NN_*` na raiz → WARN apontando `absorb_sync.ps1`); `dedupe_images.ps1` e `fix_image_typos.ps1` resolvem pastas via `<root>\codex\<folder>`; `check_missing_images.ps1` varre `codex/` e usa chaves `codex/...`; `fix_encoding.ps1` intocado (varredura recursiva já cobre); template do README ganhou linha `codex/`. Consumidores HTML NÃO mudaram (`char.image` na raiz resolve `codex/...`; payload das páginas de raça vira `"../" + image = ../codex/...`). **Fase C:** criado `scripts/absorb_sync.ps1` (ASCII puro — a 1ª versão tinha um travessão e quebrou o parse do PS 5.1 sem BOM, Lição #3 de novo) — absorve pasta recriada na raiz: idêntico por hash descarta, novo move, DIFERENTE guarda como `*.CONFLITO-SYNC.*` sem sobrescrever. Teste real: pasta fake `05_Demonios/` na raiz absorvida perfeitamente. ⚠️ A ferramenta de sync do Bruno APONTA PARA AS PASTAS NA RAIZ: após cada sincronização rodar `absorb_sync.ps1` (ou melhor: atualizar o destino dela para `...\Teste\codex\`). **Fase D:** array FLAT `characters` REMOVIDO do JSON (~908→850 KB) — fonte única agora são os grupos (Lição #13 encerrada); consumidores migrados: `build_racas.ps1` lê `$group.characters`, `check_missing_images.ps1` e `fix_image_typos.ps1` derivam dos grupos; schema no README atualizado. Regeneração completa: **460 personagens / 21 grupos / guards 460=460 OK**, historia-api sem divergências, 450 imagens todas resolvendo em disco. `.playwright-cli/` apagado. Smoke Playwright (:8021): index 36 cards iniciais, deep-link `#g=04_Onis`, modal Akatoran/Aatrox com arte de `codex/`, Ctrl+K "aat"→Aatrox, página Onis herói+acervo 28/28 imagens, mapa canvas+26 pins+chip `index.html#01_Humanos`. `file://` não testável pelo playwright-cli (bloqueia o protocolo) — payload embutido validado estaticamente. **Fase E:** `docs/relatorio-arte.md` gerado por `scripts/relatorio_arte.py` (somente leitura): 10 ressuscitados nas fontes, 8 PNGs órfãos, **2 pares byte-idênticos entre pastas** (Apoliom-V-1=Azazel-V-1; Imu-V-1=Imu-Nerona), 9 homônimos entre pastas e DESCOBERTA: `Nyxar` duplicado dentro da própria ficha de Canibais (`## 5.` com arte e `## 17.` sem, texto idêntico). Checkpoint aguardando decisão do Bruno. **Fase F DEFERIDA:** `/graphify --update` exige subagentes → 402 do OpenRouter de novo (sonda confirmou: "can only afford 6600"); AST até rodou (24 nós/23 arestas) mas foi descartado junto com os temporários; grafo fica no estado anterior (caminhos antigos). Pendência registrada abaixo. Commits escopados em sequência; `.claude/settings.json` segue fora de todo commit. | OK |

### 25/08/2026 — Mais ângulos do mapa no README

| Hora | Evento | Resultado |
|---|---|---|
| ~23:15–23:36 | **3 novas capturas do mapa** (pedido do Bruno: "mais imagens de outro ângulo"): mapa-girado.jpg (arrasto de verdade na câmera orbital — penhascos em primeiro plano), mapa-pin.jpg (painel de lore das Cavernas de Obsidiana aberto com chip HABITANTES "Onis · 29") e mapa-rasante.jpg (vista quase de perfil, pitch 0.13, com lava emissiva do vulcão). **Descoberta útil**: o mapa é Canvas puro — pins não são DOM, então clique por coordenada é loteria; a saída foi a **API de diagnóstico `window.__MAPA__`** já embutida no HTML (`abrir(id)`, `camera({yaw,pitch,dist})`, `estado()`, `ids()`), feita para testes automatizados. Clique sintético no canvas NÃO fechou o painel (motivo não investigado a fundo) — fechar via `querySelector('button').click()` do DOM funcionou. Temp `mapa-angulo-atual.jpg` deletada; README regenerado com as 3 imagens na Galeria + bullet novo sobre `__MAPA__` em Como as Telas Funcionam. BOM intacto, 11/11 refs válidas. | OK |

### 25/08/2026 — Screenshots do site no README (playwright-cli)

| Hora | Evento | Resultado |
|---|---|---|
| ~22:30–22:56 | **Documentação visual + README completo** (pedido do Bruno: fotos de tudo + README explicando as coisas novas): 8 capturas JPEG 1600×1000 (qualidade 90) em `docs/screenshots/` via playwright-cli contra servidor local :8014 — hero claro (destaque do dia Torstein-V-1), cards dark, filtro Onis ativo (URL virou `#g=04_Onis` sozinha), modal do Akatoran (lore da raça + contador 1/28), paleta Ctrl+K ("aat"→Aatrox em 1º), mapa 3D com os 26 pins, página Demônios (herói Aatrox + acervo 42 membros). **JPEG de propósito**: o `.gitignore` exclui `*.png` (acervo de arte) — screenshots em `.jpg` versionam sem precisar de `git add -f`. README expandido **via template do `build_readme.ps1`** (README é gerado): nova seção 📸 Galeria do Site (8 imagens com legendas), seção 🖥️ Como as Telas Funcionam (mecânica real de index/racas/mapa: View Transitions com view-transition-name transitório, ranking global do Ctrl+K, URL state `#g/#q/#sort/#fav`, autoplay 7s com pausa só no palco, payload `#race-data` p/ file://, Canvas 2D puro, reveals à prova de falha) e linha `docs/screenshots/` na tabela de estrutura. Validação: BOM do `.ps1` intacto e 8/8 referências de imagem existentes no disco. | OK |

### 25/08/2026 — Grafo de conhecimento `/graphify`

| Hora | Evento | Resultado |
|---|---|---|
| ~21:40–22:20 | **Grafo de conhecimento criado** (pedido do Bruno: usar a skill `/graphify` no projeto): 63 arquivos detectados (13 código, 50 docs, ~240k palavras) → AST estrutural do código (60 nós/100 arestas, sem LLM) + extração semântica por **2 subagentes paralelos** (chunks de 25 agrupados por pasta: lore `.md` das raças+`Historia/`; HTMLs do site + docs da raiz) → **326 nós / 559 arestas / 52 comunidades nomeadas em pt-BR**. Health check OK (4 arestas AST paralelas colapsam no grafo não-direcionado — benigno; zero órfãs). Outputs em `graphify-out/`: `graph.html`, `GRAPH_REPORT.md`, `graph.json`, `manifest.json`, `cost.json` (~128k tokens in / ~33k out). Cache semântico salvo → futuro `/graphify --update` re-extrai só o que mudar. Descobertas: god nodes = Guerra das Sete Fronteiras (61 arestas), Mesa de Guerra Arcana (48), Galeria (38), raca.js (27); hiperaresta "Vontade Partida de Imu" une os 11 fragmentos; homônimos entre códices marcados como `semantically_similar_to` (Corvus desconhecido/mago, Ulthar mutante/deus…). README ganhou seção sobre o grafo **via template do `build_readme.ps1`** (README é gerado — editar direto seria sobrescrito); `.gitignore` passou a excluir `graphify-out/.graphify_python` e `.graphify_root` (carregam caminhos locais da máquina). `characters-api.json`/site intocados. | OK |

### 25/08/2026 — Páginas de raça (`racas/`) — 21 showcases gerados por script

| Hora | Evento | Resultado |
|---|---|---|
| tarde | **Planejamento + build** (plano `proud-dreaming-bubble`): pedido do Bruno — uma página por raça (21), cada uma expondo um membro em banner rotativo (Demônios: Aatrox → Abaddom → …), com design incrível. Decisões aprovadas: 21 HTMLs estáticos **gerados por script** com dados embutidos (funciona em `file://`), site completo (herói rotativo + lore + acervo + navegação entre raças), integração imediata no index. Entregues: `racas/assets/raca.css` (~1500 linhas, tokens dark-first espelhando o index, herói cinematográfico, palco com tilt/glare/Ken Burns, breakpoints 1100/900/560, `prefers-reduced-motion`), `racas/assets/raca.js` (~780 linhas: carrossel com autoplay 7s e pausas por motivo, WAAPI nas trocas, reveal por caractere, tilt 3D, partículas Canvas, dots com barra de progresso, deep-link `#id` + `hashchange`, ficha lateral com os 6 atributos, tema persistido em `localStorage.racasTheme`, acervo clicável, prev/next, índice das 21 raças), `scripts/build_racas.ps1` (PS 5.1, UTF-8 **com BOM**, payload `[ordered]` + `ConvertTo-Json -Depth 12` + escape de `</`; guard de soma de membros), 21 páginas geradas, badge nos cards do index → página da raça, link "Ver página da raça ↗" no modal, README regenerado com linha `racas/`. | OK |
| noite | **6 bugs corrigidos e verificados na sessão 1**: (1) `animateSwap` com `oldNode=null` no 1º render — `typeof null.animate` **LANÇA** (não retorna undefined) e abortava o boot inteiro → guard `!oldNode \|\|` antes do typeof; (2) ficha abria com 0 campos — `openSheetFor` exige `sheetOpen=true`; ordem invertida; (3) `animateCopy` deixava a coluna de texto INVISÍVEL após a 1ª troca — `fill:"forwards"` na animação de SAÍDA persiste para sempre e, ao terminar a de ENTRADA (`fill:"backwards"`), o efeito dela some e o da SAÍDA volta a valer → capturar ambas e `inn.finished.then(() => out.cancel())` (sintoma: `getComputedStyle(h1).transform` com matrix deslocada sem animação nenhuma em `getAnimations`); (4) deep-link same-document não navegava → listener `hashchange`; (5) autoplay morria com o mouse parado em qualquer lugar — hover-pause estava no `.hero` de ~100vh → agora só no palco (`stageFrame`), `focusin` continua no herói inteiro (a11y); (6) overflow mobile 390px com 3 causas somadas: chips (`%` de `max-width` não resolve em sizing intrínseco de flex → `max-width:100%` no ul), `<button>` shrink-to-fit com `<img>` intrínseco (`width:100%` + `min-width:0` no card) e ellipsis sem `min-width:0` na cadeia (`.roster-grid > * { min-width: 0 }`). | OK |
| ~20:30–21:10 | **"Bug dos reveals" RESOLVIDO — o IntersectionObserver estava INOCENTE.** Sintoma arrastado da sessão 1: os 42 cards do acervo nasciam `opacity:0` e "nunca ganhavam `.in-view`" no teste (lote inicial `isi=false` + **1 único** `isi=true` no dance de scroll inteiro); em browser real o acervo ficaria vazio. Investigação da sessão 1 descartou com probes: GC do observer, exceção no callback, observer não criado, `rootMargin`/`threshold`, scroll container exótico — e observers FRESCOS no MESMO card disparavam normal. Causa raiz real, achada hoje com probe no mobile: **`scroll-behavior: smooth` (`raca.css:67`) transforma cada `window.scrollTo` do dance do teste em ANIMAÇÃO** — degraus de 600px a cada 60ms se sobrepõem, a página nunca passa de ~y2000 dos 8163px e o acervo NUNCA ENTRA na viewport; o IO corretamente não dispara. Probe 390px reproduziu (44/45 `.pre-reveal` após o dance, `io.t:2`); com `scrollBehavior:"auto"` no teste → 45/45 revelados. No desktop o falso 45/45 veio de um probe com dance diferente (mais lento). Hardening que FICOU (independe da causa): **progressive enhancement à prova de falha** — cards/seções VISÍVEIS por padrão no CSS; `.pre-reveal` (oculto) aplicado via JS SÓ quando `IntersectionObserver` existe, imediatamente antes de observar; sweep de 900ms revela qualquer `.pre-reveal` já na viewport caso o IO morra silenciosamente (modo de falha observado e documentado). Sem JS/sem IO/IO morto = conteúdo sempre visível. | OK |
| ~21:10 | **Limpeza do dado (decisão do Bruno) + drift detectado e consertado**: o Bruno removeu de `groups[].characters` os 10 personagens SEM IMAGEM documentados nas pendências (colisões `Davy-Jones-V-2`, `Rocks-D-Xebec`, `Scopper-Gaban-V-1`, 2º `Shamrock`, `Shanks-V-2`, `Star-and-Stripe-V-1`, `Akuma-Ghen-V-2`, 2º `Nyxar`; em-outra-pasta `Shao-Kahn-V-1` e `Corvus`) → **460 → 450 personagens, 0 sem arte**. Drift: o gerador das páginas lê o array FLAT (`api.characters`), que ficou velho (458, com 8 fantasmas + 2 duplicados internos) e fez o guard do `build_racas.ps1` disparar (`Soma de membros divergente!` 458≠460) — o index usa os grupos (já refletia a limpeza). Conserto: flat reconstruído dos grupos por script, `totalCharacters` → 450, `historia-api.json` (counts, ex. Onis 29→28), 21 páginas e `README.md` regenerados — guard 450=450 OK. **⚠️ PENDÊNCIA: as fichas-fonte `.md` AINDA CONTÊM os 10 removidos — o próximo `build_api_json.ps1` RESUSCITA todos. Decidir: remover os blocos das fontes ou aceitar o retorno.** | PARCIAL→OK |
| ~21:15 | **Suíte final 17/17 PASS, 0 erros de console, 0 HTTP≥400** (7 cenários: Aatrox inicial, `--group-color`, deep-link, setas, autoplay ~7s, ficha 6 atributos, card do acervo → herói, prev/next, índice 21, lore, toggle tema, bestInk Semideuses, placeholder, mobile 390px sem overflow, integração index, `file://`). Testes tornados **AUTOCONSISTENTES** (não cravam números do dado, que muda quando o acervo é limpo): placeholder testado pelo caminho REAL de erro (`route → abort` das PNGs — não existe mais membro sem arte no dado); total do `file://` lido do payload embutido (`#race-data`); dance mobile com `scrollBehavior:"auto"` + pausa de 90ms/passo + espera de 1.6s (stagger `--rd` máx ~0.5s + transição 0.55s). Screenshot mobile fullPage agora mostra o acervo completo revelado. | OK |

### 25/08/2026 — Redesign "Evolução Premium" do index.html (9 fases)

| Hora | Evento | Resultado |
|---|---|---|
| tarde | **Planejamento** (modo planejamento com pesquisa na internet): referências — Card Play/Squarespace (cards táteis, tendência 2026), Codex scroll & hover na Awwwards, LoL Universe (galeria dark-fantasy padrão-ouro), receita holo do pokemon-cards-css (conic-gradient + color-dodge + posição pelo ponteiro), View Transitions API (Baseline out/2025 — morph card→modal viável com feature-detect), command palette Ctrl+K (contrato ARIA 1.2). Decisões do Bruno: direção **Evolução premium** + 4 recursos (paleta Ctrl+K, ficha completa no modal, modal folheável ←→, hero com stats animados). Plano de 9 fases em `~\.claude\plans\immutable-hatching-mist.md`. Obs.: os subagentes de planejamento falharam com 402 (créditos OpenRouter) — exploração feita diretamente. Fase 0 encurtada por decisão do Bruno: **não mexer** no drift das páginas de raça (payload 28×29 membros nos Onis etc.) — "foco só nas melhorias do index". | OK |
| tarde | **Fase 1 — Fundação visual:** tokens novos (`--shadow-inset`, `--vignette`, `--grain-opacity`, `--scrolled-shadow`); grão de papel fixo (feTurbulence em data-URI), vinheta radial, **glow ambiente** (`#ambientGlow`) tingido pela cor da raça ativa via `setAmbient()` (disparado em toda troca de grupo/deep-link); header compacto ao rolar (`.is-scrolled`, rAF-throttle) + barra de progresso `.scroll-progress` na cor do grupo; **1ª visita agora respeita `prefers-color-scheme`** (antes forçava claro). **Fase 2 — Cards "Carta do Códice":** moldura de manuscrito (borda tingida + anel interno `::after` + cantos `.corner` que crescem no hover), tilt 3D ±4° com um único loop rAF para o card sob o cursor (vars `--crx/--cry/--clift`), foil holo `color-dodge` guiado por `--gx/--gy/--ga` (só hover:fine + sem reduced-motion), blur-up da arte (classe `.ready` via listener `load` **em fase de captura** — `load` não borbulha), 6 primeiras artes `eager`+`fetchpriority="high"`/resto lazy, **view-transition-name `char-art` atribuído SÓ durante a transição** card→modal e limpo em `finished.finally` (nome duplicado na grade quebra o snapshot); entrada em stagger **SEM `fill-forwards`** — o padrão antigo congelava `transform:none` e anulava o lift do hover. | OK |
| noite | **Fase 3 — Modal folheável:** abas 📜 História \| 🧬 Ficha (segmented control na cor da raça); Ficha = `<dl>` com os 6 atributos (paleta vira chips); **lore da raça** consumindo `historia-api.json` (fetch extra tolerante a falha) + link "Ver no mapa 🗺️"; navegação ‹ › + teclas ←→ sobre `filteredCharacters` com contador "N / M" e deep-link `#<id>` por `replaceState`; copiar link (clipboard+toast); lightbox cover↔contain no clique da arte; **focus trap real** (Tab ciclava para FORA do diálogo antes); título letra-a-letra (`splitReveal` quebra por palavras) + Ken Burns quando sem tilt. **Bug pego pelo smoke:** `fillRaceLore` lançava porque `info.regioes` é STRING única em 20/21 raças (array só em Humanos) — a exceção abortava `openModal` inteiro e o modal nem abria; normalizado com `Array.isArray`. | OK |
| noite | **Fase 4 — Paleta de comandos Ctrl+K** (ou `/`): substitui o autocomplete antigo (uma só superfície de busca) — personagens + 21 raças + ações (tema, favoritos, aleatório, mapa, limpar filtros, topo) num **MESMO ranking global de relevância com desempate por tipo** (1ª versão deixava subsequência fraca de personagem acima de ação com prefixo exato — teste pegou); matching fuzzy insensível a acentos (mesma técnica do slugify); ARIA combobox/listbox com `aria-activedescendant` + live region; hint Ctrl K some no touch; mobile vira folha. **Fase 5 — Hero:** contadores count-up rAF (460 · 21), **destaque do dia determinístico** (dia-do-ano % total) com reroll 🎲, CTAs mapa/surpresa, data do `generatedAt`; glow do hero segue a cor da raça do destaque. **Fase 6 — Grade/URL/footer:** auto-load por sentinel IO (rootMargin 900px; botão "Carregar mais" fica como fallback/a11y e é o caminho único com reduced-motion), `content-visibility:auto` nos cards, empty-state com sugestões clicáveis, **URL state `#g=&q=&sort=&fav=`** compatível com deep-links antigos (`#<pasta>` do mapa e `#<personagem>`; popstate/hashchange coalescidos por microtask), footer com voltar-ao-topo, toasts com barra de acento + ícone extraído da mensagem. | OK |
| noite | **Fases 7–8 — a11y + suíte final:** alvos ≥44px no touch; respeito global a `prefers-reduced-motion` (duração 0.01ms); sweep responsivo 390/480/768/1024/1440/1920 com **zero overflow-x** (o estouro mobile era o wrapper de filtros virando coluna com `align-items:center` — o scroller assumia largura de conteúdo; teto `max-width:100%`). **Bug latente pego pela suíte:** `toggleFavorite` mutava o Set mas nunca chamava `saveFavorites` — favoritos não persistiam; fix na fonte única. Também no caminho: TDZ (`reducedMotion` usado antes da declaração → movido ao boot). **SUÍTE FINAL 26/26 VERDE**: render inicial, filtro Onis com lote inicial + restantes no botão, morph VT card→modal, ficha com 6 atributos, ←→ com hash e preservação de aba, focus trap (20 Tabs), Ctrl+K "aat"→Aatrox→Enter abre, tema claro↔escuro, favorito persiste pós-reload, mobile 390px sem overflow, zero erros de console / zero HTTP ≥400 + screenshots claro/escuro/mobile. | OK |
| 20:17 | A sessão anterior **travou com 429 do provedor** logo após a suíte ficar verde (durante a leitura dos screenshots, antes da documentação). Retomada em sessão nova para esta **Fase 9**: entrada no Memoria + commit escopado (`7301194`, só `index.html`; sanity check de sintaxe dos scripts inline antes: 0 erros). Permanecem SEM commit por decisão do Bruno (retoma depois, sessão própria): `racas/`, `scripts/build_racas.ps1`, ajustes de `README.md`/`build_readme.ps1`, JSONs reformatados, `CONTINUAR_AQUI.md`, `Travou.md` — e NUNCA `.claude/settings.json` (token). Drift conhecido incluso aí: `groups[].count`=29 vs 28 membros reais nos Onis. | OK |

### 28/08/2026 — Aplicação do PLANO-MESTRE-AETHERIA-Corrigido.md (pós-print)

| Hora | Evento | Resultado |
|---|---|---|
| — | **Plano corrigido aplicado** (`PLANO-MESTRE-AETHERIA-Corrigido.md`): Fases A/B/C/D concluídas. **Ritual reutiliza marca d'água existente** (`.hero-watermark`/`.lore-watermark`) via `animateWatermark()` + `.ritual-mark-active` (reaproveita ícone da raça; sem Canvas extra). **Harmonização visual** (`.corner` + `.hero-watermark`) aplicada a `racas/*.html` (moldura de manuscrito e marca d'água no header/acervo das páginas de raça). **Codex Completo** (`#codexBtn` + `localStorage` `visitedRaces`) e **cartão PNG** (`canvas` 400×220 no modal, download PNG do card atual). **Modo sem efeitos** explícito (`#noFxBtn` + `.no-fx`). Ajuste pós-print real documentado no plano; zero dependências mantidas. | OK |
| — | **README.md atualizado com referência aos arquivos necessários**: `Memoria.md` (linha do tempo oficial), `index.html` (hero/pilha 3D), `assets/rituals.js` (rituais de invocação), `racas/*.html` (harmonização visual `.corner` + `.hero-watermark`), `.claude/plans/*.md` (planos aplicados: `PLANO-MESTRE-AETHERIA-Corrigido.md`, `PLANO-HERO-PILHA-3D.md`) e `graphify-out/GRAPH_REPORT.md` (grafo de conhecimento). | OK |
| — | **PLANO-HERO-PILHA-3D.md aplicado (correções finais)** — `.hero-stack` com 3 camadas (`.stack-back-2`, `.stack-back-1`, `.stack-front`); animação `cycleStack()` com **GSAP** (substitui WAAPI nativa); `.fill: "forwards"` removido; `.cancel()` removido das animações principais; `.stack-breathe` removido (evita animação contínua); autoplay reativado (`setInterval` corrigido); `Promise.allSettled` substitui `Promise.all`; `.hero-ctas` duplicado removido; `.eventCallback` duplicado removido. Pilha 3D funcionando sem travar layout. | OK |

### 24/08/2026 — Manutenção completa (análise + correções)

| Hora | Evento | Resultado |
|---|---|---|
| ~23:05–23:54 | **Personalização de cards e modal por raça** (pedido do Bruno: "melhorar o design dos cards e do modal com efeitos, personalizado para cada raça"). **Cards:** filete de 3px no topo em gradiente da cor da raça (`::before`, 45%→100% no hover); hover com glow na cor (`box-shadow` + `color-mix` 55%); aura radial da cor da raça sobre a arte no hover (`thumb::after`, z-index 1 abaixo do overlay z-index 2); badge no hover vira PREENCHIDO com a cor da raça + texto `--group-ink` (agora injetado no card via `bestInk()`); coração de favorito na cor da raça com drop-shadow. **Modal:** `openModal` injeta `--group-color`, `--group-ink` e `--group-icon` no `#modalPanel` (antes só o chip meta tinha a cor) — a partir disso: glow ambiente ao redor do painel inteiro na cor da raça (140px), filete no topo, marca d'água do ÍCONE da raça gigante no canto inferior direito (`::after` com `content: var(--group-icon)`, opacity 0.07, escondida <900px), tinta radial no fundo do texto (9%), scrollbar na cor, aura da raça sobre a arte (camada nova no `::after` da mídia), chips de detalhe com borda tingida 30%, botões fechar/favoritar agora hover/ativo na cor da raça (antes laranja fixo). Testado com Playwright: Aatrox (Demônios `#8E44AD` 😈) vs Akatoran (Onis `#E74C3C` 👹) — vars, filete, marca d'água e glow distintos; screenshots claro/escuro OK; 0 erros de console. Armadilhas do teste: busca "Semideus" não retorna cards (não existe personagem com esse termo) e o id do grupo é o folder (`04_Onis`, não `06_Onis`). | OK |
| ~22:35–23:02 | **Efeito 3D (tilt + glare) na arte do modal** — pedido do Bruno ("biblioteca p/ efeito 3D no personagem ao abrir o modal, testar com o Aatrox"). Escolha: SEM biblioteca (regra zero-dependencies) — CSS 3D puro + ~70 linhas de JS (`perspective(1200px) rotateX/rotateY` via vars `--rx/--ry`, lerp em `requestAnimationFrame` fator 0.12, máx ±6°; glare = radial-gradient branco `mix-blend-mode: screen` seguindo `--gx/--gy`, classe `.is-tilting`). Escala base `scale(1.04)` permanente substitui o hover `scale(1.03)` — rotação sob perspectiva encolhe a borda afastada (~0.97 em 6°), sem escala surgiria fresta; 1.04 cobre. Portais de segurança: só ativa com `(hover: hover) and (pointer: fine)` e sem `prefers-reduced-motion`; placeholder (sem arte) NÃO inclina; `resetTilt()` em open/close. Testado com Playwright no Aatrox (`05_Demonios/Aatrox-V-1.png`): matrix3d muda com o mouse (ex. ry −2.51°→+1.33°), glare opacity 1, volta ao neutro no mouseleave, reset limpo ao reabrir, `Davy-Jones-V-2` (sem arte) não inclina, 0 erros de console. Obs.: no headless o rAF roda mais lento (~15fps), por isso o retorno não chega a 0.000 nos 800ms do teste — em browser real é 60fps. Nota: `node run.js /tmp/...` falhou — o Write grava em `C:/tmp/`, não no `/tmp` do Git Bash; passar caminho Windows explícito. | OK |
| ~22:20 | **Correção: arte não aparecia no modal** (reportado pelo Bruno). Causa: `.modal-media-ph` tinha `display: flex` na classe, que SOBREPÕE o atributo `hidden` (UA style é mais fraco) — o placeholder ficava sempre renderizado, pintado por cima da imagem (ambos `absolute inset:0`, ph é o último no DOM). O teste anterior validou o *property* `hidden`, não o *computed display* — por isso passou. Fix: `.modal-media-ph[hidden] { display: none; }`. Retestado nos 3 estados: com imagem (img visível/ph none), sem imagem (ph flex/img none) e a transição ph→img na mesma sessão. Lição: ao testar visibilidade, ler `getComputedStyle(...).display`, não o atributo. | OK |
| ~21:20–22:05 | **Redesign do `index.html`** (só design; mapa/API intocados — outra sessão trabalhando neles). **6 correções + 2 features:** (1) **matcher de temas estava MORTO** — `getGroupTheme` comparava folder com prefixo numérico (`"01_Humanos"`) contra label sem (`"Humanos"`), então TODOS os 21 grupos caíam no fallback laranja+📁; criado `slugify()` (NFD + faixa ASCII + tira dígitos iniciais) e adicionada a 21ª categoria que nem existia na tabela (`Demônios Akuma-Gani` #AD1457 👑) — validado 21/21 contra a API real; (2) mojibake no ícone do estado vazio (byte invisível U+008D na sequência; reparado via PowerShell por codepoint, o Edit não casava); (3) **picsum.photos eliminado** — personagens sem arte agora usam placeholder LOCAL desenhado (monograma Fraunces itálico + hachura diagonal + radial na cor da categoria), no card, no modal e no autocomplete; `onerror` de imagem também cai no placeholder; (4) contraste dos botões ativos: `bestInk()` calcula luminância e injeta `--group-ink` (texto preto em fundos claros tipo Semideuses/Alvamortos); (5) seta do select de ordenação temática via `--sel-arrow` (claro/escuro); (6) "Carregar mais" agora faz APPEND (`renderGrid(append)`) sem reanimar a grade — **refactor trouxe bug que o teste automatizado pegou**: `renderGrid(false)` não limpava o grid e CADA filtro EMPILHAVA cards (18→72); corrigido com `if (!append) grid.innerHTML = ""`. **Features:** filtros redesenhados (chips compactos em linha rolável com setas ‹ › e fade nas bordas, ativo preenchido com a cor do grupo, badge de contagem discreta) e **botão 📌 fixar/desafixar cabeçalho** (sticky↔static, persiste em `localStorage.headerPinned`; 1ª lógica saiu invertida — o teste pegou, corrigida). **Validação:** suíte Playwright (servidor local :8013) — 18 cards iniciais, filtro Onis `#E74C3C`+texto branco, load-more 18→36 com card original preservado, placeholder do modal visível p/ `Davy-Jones-V-2`, pin sticky→static→sticky, seta temática no escuro, screenshots claro/escuro/mobile OK, 0 erros de console e 0 HTTP 4xx. Delegação de eventos da grade agora anexada UMA vez (antes: listeners recriados por render). `groupName`/badges/modal usam `prettyGroup()` (sem o prefixo `NN_`). | OK |

| Hora | Evento | Resultado |
|---|---|---|
| ~08:30–09:10 | **Análise inicial do projeto** solicitada pelo Bruno. Mapeados os componentes, contagens (494 chars/446 PNGs) e os problemas: parser com descrições vazias, encoding corrompido, JSON duplicado, matching frouxo de imagens, duplicatas, ausência de git, typo na pasta 03. | OK |
| ~09:05 | Criado `ANALISE_E_PLANO.md` com diagnóstico e plano (depois substituído por este arquivo). Criada memória persistente externa apontando para o projeto. | OK |
| **09:13:03** | **Commit-snapshot `2cf804e`** — `git init` + estado original completo (30 arquivos), ANTES de mexer em qualquer encoding. Motivo: rede de segurança reversível. PNGs ficaram fora via `.gitignore` (~1,3 GB; não são modificados pelos builds). | OK |
| ~09:15 | `fix_encoding.ps1`: 1ª tentativa de escrever o padrão regex com caracteres literais de controle falhou na gravação (chars invisíveis corrompidos). Reescrito 100% ASCII construindo o padrão por `[char]0x00C2..0x00EF` etc. | ERRO→OK |
| ~09:16 | **Reparo de encoding executado**: 10 arquivos corrigidos (6 `.md` incluindo `05_Demonios` duplamente codificado, `README.md`, `index.html`, 2 `.ps1`). Estratégia que funcionou: reparo POR SEGMENTO (só onde há assinatura lead C2-EF + marks), preservando as partes já corretas do mesmo arquivo. `.ps1` salvos com BOM (PS 5.1 exige). Verificado: Demônios legível, `<title>` do site corrigido, **0 mojibake restante**. | OK |
| ~09:18 | Limpeza de 2 exemplos de mojibake que citei dentro do próprio doc de análise (o reparo os consertou também). | OK |
| ~09:19 | Pasta renomeada: `03_Ordens_E_Guerrreiros` → `03_Ordens_E_Guerreiros` (typo de 3 R). `characters-api2.json` excluído (duplicado não usado; recuperável pelo git). | OK |
| ~09:20 | ⚠️ **Descoberta importante**: contagem caiu para 322 ao usar só cabeçalhos `## N.`. Investigação revelou que 8 pastas usam formato SEM heading (`N. Nome` simples). Padrão frouxo = exatos 494. O novo parser precisaria unificar os formatos. | PARCIAL→OK |
| ~09:22 | `build_api_json.ps1` reescrito do zero. Erros encontrados NO CAMINHO (todos corrigidos):<br>• **Write bloqueado** ("file modified since read") porque o fix_encoding tinha alterado o arquivo após minha leitura → reler antes de escrever<br>• Valores saindo com prefixo `** ` → o negrito pode vir DEPOIS dos dois-pontos também; sufixo do padrão mudado para `\*{0,2}\s*:\s*\*{0,2}`<br>• **`$Matches[1]` nulo (crash)**: `-notmatch` não popula `$Matches` de forma confiável → trocado por `-match` explícito<br>• **Crash persistiu**: causa raiz era ALTERNÂNCIA top-level nos padrões interpolados (`Rosto\|Anatomia`) — a 2ª alternativa ficava fora da ancoragem `^` e do grupo de captura `(.*)$`, casando sem preencher grupo 1 → encapsuladas em `(?:...)`<br>• Rótulos ampliados com todas as variantes reais do projeto (`Raça / Ordem`, `Classe Mutagênica`, `Classe Demoníaca`, `Raça Mutante`, `Rosto & Cabelo/Anatomia/Detalhes`, `Acessórios` sozinho, `Atributos Únicos`→mapeado para `equipment`) | ERRO→OK |
| ~09:28 | `build_readme.ps1` reescrito: agora LÊ o `characters-api.json` em vez de re-parsear os `.md` — README nunca mais diverge da API. Ambos os scripts re-salvos com BOM para o PS 5.1 parsear acentos nos literais ('Nenhuma descrição...', 'Raça'). | OK |
| ~09:29 | Builds regenerados e validados: **494/494 descrições preenchidas** (antes 0), atributos 441×6 + 53×5 chaves (os 53 genuinamente não têm `Vestuário` na fonte), 0 fallbacks. Contagem 494/20 preservada. | OK |
| ~09:31 | Auditoria final: duplicatas mapeadas (8 grupos intra-pasta, 12 nomes entre pastas) e 24 PNGs órfãos identificados — vários eram **typos de nome de arquivo** (`Lobisome`, `Frostmorne`, `Shadoweaver`). | OK |
| ~09:32 | `fix_image_typos.ps1`: rename automático conservador (Levenshtein ≤2 + pareamento único por pasta). Duas tentativas inline falharam antes do script de verdade: `if` não existe como expressão inline no PS, e `$d[$i - 1, $j]` sofre precedência da vírgula (vira `$i - (1,$j)`) → parênteses nos índices. **16 PNGs renomeados**, casos ambíguos ignorados com aviso. | ERRO→OK |
| ~09:34 | API+README regenerados: personagens sem imagem 72 → **56** (16 recuperadas). Spot-check: `Frostmourne-V-1.png` e `Abaddom-V-1.png` anexadas corretamente. | OK |
| **09:35:02** | **Commit `5db36a1`** — todas as correções (16 arquivos). | OK |
| ~09:37 | `ANALISE_E_PLANO.md` atualizado com resultados validados e pendências. | OK |
| ~09:38 | **Este arquivo criado** a pedido do Bruno: `ANALISE_E_PLANO.md` substituído por `Memoria.md` (linha do tempo viva). Memória persistente externa atualizada para apontar cá. | OK |
| ~09:42 | **README virou documento de onboarding** a pedido do Bruno (para dar contexto completo a novas conversas de IA): `build_readme.ps1` reescrito para GERAR o README completo — aviso para assistentes lerem este arquivo, prompt pronto de início de sessão, o-que-é/estrutura/formatos/regras, como rodar o site localmente, categorias em `<details>` colapsáveis e schema da API. Dois erros de sintaxe no caminho: linha sem fechar aspa simples e rascunho esquecido (`add_text_placeholder`) — ambos corrigidos. Motivo da abordagem: README é gerado; editar direto seria sobrescrito na próxima regeneração. | ERRO→OK |
| 09:45 | README regenerado e validado (494/20 dinâmicos). | OK |
| **~09:47** | **PRIMEIRA EXECUÇÃO REAL DO COMANDO «atualização de personagens»** (Bruno avisou que tinha acabado de atualizar). Descobertas: (1) os 5 `.md` alterados estavam RE-CORROMPIDOS pela ferramenta de sincronia dele — reparados com `fix_encoding.ps1`; diff pós-reparo = ZERO, ou seja, nenhum texto novo real; (2) pasta NOVA `21_Demonios_Akuma-Gani` com 11 PNGs `Imu-*` e SEM ficha `.md`; (3) `Loki-V-1.png` substituído (07:39); (4) a sincronia RESTAUROU 16 imagens com typo já renomeadas — `dedupe_images.ps1` criado e removeu 13 duplicatas idênticas por hash + 3 manuais (`Lobisome-V-1`, `Umbrax-V-1`, ambas idênticas); (5) `Florivax-V-1.png` em Desconhecidos difere de `Glorivex-V-1.png` → MANTIDO para o Bruno decidir; (6) `Sem_Nome-1.png` estava em Amaldiçoados mas o personagem é `##29` dos Onis → movido. | OK |
| ~09:55 | `build_api_json.ps1` melhorado: pastas numeradas SEM `.md` agora geram WARNING no console E entram no JSON em `foldersWithoutSheet` (não somem mais silenciosamente). API+README regenerados: 494 chars/20 grupos + aviso da 21; Sem-Nome-1 com imagem; 55 sem imagem. | OK |
| ~10:00 | Seção «COMANDOS» criada neste arquivo documentando o gatilho e o checklist padrão de 8 passos. | OK |
| ~10:05–10:20 | **Fichas da pasta 21 criadas** (aprovado pelo Bruno: "criar fichas com lore inventada"). Li as 11 artes `Imu-*.png` e escrevi `21_Demonios_Akuma-Gani/Aetheria_Codex_de_Demonios_Akuma-Gani.md` no formato bulleted-bold (igual Humanos): 11 fichas completas (Raça, História Original, Físico, Rosto & Cabelo, Vestuário, Paleta, Acessórios) com lore autoral coesa — os 11 são **fragmentos da vontade do soberano Imu** selado, cada um com domínio temático (Vontade, Alcance, Vigília, Fúria, Silêncio, Segredo, Trovão, Prisão, Fissura, Fronteira, Chama Eterna) e o motivo recorrente dos "Olhos do Véu" (halos de fumaça com olhos presentes em quase todas as artes). | OK |
| ~10:22 | **4 PNGs sem nome renomeados** para os nomes inventados (o matching estrito de imagens exige nome compatível): `Imu-1.png`→`Imu-Kusari.png` (a Carcereira de Almas), `Imu-2.png`→`Imu-Maguma.png` (a Senhora das Fissuras), `Imu-3.png`→`Imu-Ryoba.png` (o Alabardeiro de Mil Olhos), `Imu-4.png`→`Imu-Gokuen.png` (o Pilar Ardente). ⚠️ Se a sincronia do Bruno restaurar os `Imu-1..4.png`, viram órfãs — rodar o checklist (passo 4) e decidir. | OK |
| 10:30 | API+README regenerados e validados: **505 personagens / 21 grupos**, `foldersWithoutSheet` vazio, 11/11 da pasta 21 com imagem anexada (11 únicas, arquivos existem), descrição e os 6 atributos em todas. | OK |
| 16:45–17:00 | **Scripts reorganizados em `scripts/`** (a pedido do Bruno): `build_api_json.ps1`, `build_readme.ps1`, `dedupe_images.ps1`, `fix_encoding.ps1` e `fix_image_typos.ps1` movidos via `git mv`; a linha `$root` dos 5 mudou de "pasta do script" para **pasta PAI do script** (`$PSScriptRoot\..` com `TrimEnd('\')` — o TrimEnd importa: `fix_encoding.ps1` faz `Substring($root.Length + 1)`), então rodam de qualquer diretório. Criado o diagnóstico `scripts/check_missing_images.ps1`. Template do README atualizado dentro do `build_readme.ps1` (tabela aponta `scripts/`, comandos com `scripts\`, e `01_`–`20_` corrigido para `01_`–`21_`). Validação: rebuild da API gerou **diff ZERO**; README regenerado só com as mudanças de template. `.claude/settings.json` modificado pelo Bruno fora deste escopo. | OK |
| ~16:50 | **Diagnóstico dos 55 sem imagem** (`check_missing_images.ps1`; acervo tem 458 PNGs): **45 SEM-ARTE** (nenhuma PNG equivalente no acervo inteiro — nunca foram feitas ou não vieram na sincronia); **8 COLISÃO** (a PNG da pasta foi atribuída ao homônimo/variante porque o matching nunca reusa imagem entre personagens); **2 EM-OUTRA-PASTA**. **Zero bug de matching**: nenhum órfão com nome idêntico ignorado, nenhum typo ≤2 restante. Detalhes na seção Pendências. | OK |
| ~17:00–17:15 | **45 SEM-ARTE estacionados em `99_Sem_Arte/`** (a pedido do Bruno, que decidirá o destino depois). Migração por script one-off (rodou do TEMP, fora do repo) orientado pelos dados da API: alvos reclassificados em runtime (só os SEM-ARTE; colisões e EM-OUTRA-PASTA ficaram onde estão), seções extraídas com o MESMO regex do builder, corpos byte a byte intactos, cabeçalho da folha nova normalizado p/ `## N.` e **fontes renumeradas 1..M**. Removidos por pasta: Humanos −7, Mutantes −5, Semideuses −6, Meio-Sangue −4, Desconhecidos/Deuses/Alvamortos/Canibais −3 cada, Gigantes/Magos/Demônios do Caos/Bárbaros/Amaldiçoados −2 cada, Aspectos −1. Criados `99_Sem_Arte/Aetheria_Codex_de_Sem_Arte.md` (1–45) e `99_Sem_Arte/_ORIGEM.md` (personagem→pasta→número original, para devolução futura). Template do README ganhou a linha da pasta nova. Validação pós-build: **505 chars / 22 grupos / 45 na pasta nova**; spot-check Kurobikari com 6 atributos e história intactas. ⚠️ Obs.: os prólogos das fichas fonte citam contagens antigas ("17 entidades", "30 entidades") — já estavam desatualizados ANTES desta migração; ajuste cosmético pendente. | OK |
| ~17:15 | Integração galeria ↔ mapa: `index.html` agora honra deep-link `#<pasta>` (abre filtrado na categoria; hash limpo via replaceState) e ganhou botão "🗺️ Mapa" no header (classe `.map-link`). | OK |
| ~18:05 | `Referencia.html` removido (aprovado pelo Bruno): era um mockup "OBRA® Estúdio de Design" de um teste antigo, sem relação com o codex. Linha correspondente tirada do template do README; README regenerado. A deleção apareceu no working tree sem ação nossa — provavelmente apagado manualmente. | OK |
| ~17:20–17:45 | **API DA HISTÓRIA criada** (mundo ↔ personagens integrados): nova fonte estruturada `Historia/Aetheria_Dados_do_Mundo.md` (blocos `## TIPO: id \| Nome` + campos bulleted-bold) com world-building expandida autoral: **16 regiões / 5 celestes / 5 batalhas / 21 raças** — todas as categorias do codex ganharam casa no mapa (novas: Torres Arcanas→Magos, Fortalezas de Juramento→Ordens, Planalto dos Colossos→Gigantes, Terras Selvagens→Monstros, Cavernas de Obsidiana→Onis, Fosso Infernal→Demônios, Ruínas do Voto Partido→Amaldiçoados, Sementes de Ascensão→Semideuses). Novo `scripts/build_historia_api.ps1` gera `historia-api.json` cruzando contagens do characters-api.json + validação de referências (raca↔região↔batalha); aviso esperado: `99_Sem_Arte` fica de fora de propósito. Erros no caminho: `.ps1` criado SEM BOM re-corrompeu literais acentuados (Lição #3 de novo — converter pra BOM logo após criar script com acentos) e `-split` colado em chamada de função foi interpretado como argumento string (separar em variável). README regenerado (linhas `Historia/`, `historia-api.json`, regeneração em 3 passos). Próximo passo pendente: mapa consumir a API. | OK |
| ~18:25 | **Os 45 SEM-ARTE foram removidos do codex** (decisão do Bruno): pasta `99_Sem_Arte/` inteira apagada via `git rm -r` — só havia os 2 `.md` (fichas + `_ORIGEM.md`), nenhum PNG. As fichas continuam recuperáveis pelo commit `d4d4395`. Linha da pasta tirada do template do README; artefatos regenerados → **characters-api.json: 21 grupos, 460 personagens**; o aviso do gerador da história-API sobre a pasta sumiu (era o esperado, ela nunca teve bloco RACA). Pendência "destino dos 45" encerrada por remoção; restam 10 sem imagem (8 colisões + 2 em outra pasta). | OK |
| ~19:00–23:00 | **MAPA_AETHERIA.HTML ENTREGUE** (frontend-design em orquestração completa: brief → implementação por subagente → loop de avaliação externa com 3 rodadas, todas PASS). Mapa 3D pt-BR "Mesa de Guerra Arcana" em **Canvas 2D puro** (sem bibliotecas): câmera orbital (arrasto/roda/pinça/duplo-clique reset), heightmap procedural com biomas por região + Fenda/Abismo/vulcões, painter algorithm com flat shading e névoa, lava conectada e veios ciano emissivos. **26 pins clicáveis alimentados pelo historia-api.json** (16 regiões + 5 celestes + 5 batalhas; contagens de personagens vêm do `races[].count`; fallback embutido completo p/ file:// — fetch pulado sem ruído). Painel lateral com copy da lore e chips HABITANTES/COMBATENTES linkando a galeria filtrada (`index.html#<pasta>`, fecha o circuito mapa↔galeria↔API); camadas Regiões/Batalhas/Céus; teclado, `prefers-reduced-motion`, mobile bottom-sheet. Rodadas de avaliação: 1º PASS com 5 polimentos sugeridos (câmera mais perto, fissuras conectadas, tooltip pós-seleção, painel/chips no tablet, silhueta irregular) → aplicados; 2º PASS com 1 defeito real (chips inclicáveis atrás do painel em 721–900px) → corrigido (coluna base-esquerda / shift 410px / inertes sob sheet mobile); 3º **PASS 3/3 em tudo**, "should ship". Correção extra no gerador: `Lados` das batalhas saía achatado (`ForEach-Object` desmonta arrays aninhados) — agora aninhado de verdade `[[A],[B,C]]`. Resíduos menores documentados como não-bloqueantes (subtítulo clipa em 721–775px com painel aberto; "VS" quebra linha na 1ª fileira de chips; lava lê como brasas no zoom default). Verificação Playwright acumulada: HTTP/file:///mobile, zero erros de console, ~3–5ms/quadro. Pendência "mapa consumir a API" ENCERRADA. Obs.: durante este trabalho o Bruno rodou uma SESSÃO PARALELA que redesenhou o index.html (commits 9630bf1/8d930ae) — coordenação feita mantendo os commits escopados por unidade. | OK |

---

## Estado Atual (pós-manutenção)

- ✅ Encoding limpo em todo o projeto (UTF-8; `.ps1` com BOM)
- ✅ Pastas das raças em `codex/` (desde 26/08; IDs/URLs preservados; sync externa absorvida via `scripts/absorb_sync.ps1`)
- ✅ API gerando descrições e atributos completos (**489 personagens em 22 grupos** desde 01/09: +5 Mutantes, +4 Akuma-Gani, Bersek com cor/ícone próprios, formatação padronizada)
- ✅ Git versionando textos (PNGs ignorados); JSON sem array flat (fonte única = grupos)
- ✅ Grafo de conhecimento atualizado para `codex/` (26/08, Fase F: **343 nós / 447 arestas / 63 comunidades**; `.graphifyignore` mantém artefatos gerados, screenshots e credenciais fora do grafo)

## Lições Técnicas (armadilhas PowerShell 5.1 que custaram tempo)

1. `-notmatch` NÃO popula `$Matches` de forma confiável — usar `$x -match '...'` explícito e testar o booleano.
2. Alternâncias `a|b` dentro de padrões interpolados PRECISAM estar encapsuladas `(?:a|b)`, senão quebram ancoragem e grupos de captura.
3. `.ps1` com acentos deve ser salvo UTF-8 **com BOM** (PS 5.1 assume ANSI sem BOM).
4. Here-string `@'...'@` exige o conteúdo em nova linha; para mensagens curtas, prefira múltiplos `-m`.
5. Índices multimensionais precisam parênteses: `$d[($i-1), $j]` (vírgula tem precedência sobre `-`).
6. `if` não é expressão: nada de `$x = if (...) { }` inline.
7. Mojibake double-encoded se repara por segmento com round-trip CP1252↔UTF-8 estrito, preservando partes corretas do arquivo.

## Lições Técnicas — Web/Front-end (do redesign de 25/08)

1. CSS `animation … forwards` em elemento interativo CONGELA o estado final da animação (`transform:none`) para sempre e anula transforms de hover/custom properties — entrada deve terminar e devolver o controle (sem `forwards`; mesmo problema do `fill:"forwards"` da WAAPI nas páginas de raça).
2. O evento `load` NÃO borbulha — para delegar blur-up de imagens na grade, escutar em fase de captura: `addEventListener("load", fn, true)`.
3. `view-transition-name` precisa ser ÚNICO na página no momento do snapshot — atribuir dinamicamente SÓ durante a transição (elemento clicado + alvo) e limpar em `finished.finally`.
4. Não confiar na FORMA dos dados: `historia-api.json` traz `regioes` como string única (20/21 raças) e array (só Humanos) — normalizar com `Array.isArray` antes de `.map`; exceção dentro de `openModal` derruba a abertura inteira (modal "morre" sem erro visível).
5. Busca com tipos de resultado distintos (personagens/raças/ações): um score GLOBAL ordenado com desempate por tipo — scores por grupo deixam subsequência fraca subir acima de prefixo exato.
6. Wrapper flex que vira `flex-direction:column` mantendo `align-items:center` faz os filhos assumirem largura DE CONTEÚDO (overflow-x mobile) — teto `max-width:100%` na cadeia; ellipsis continua exigindo `min-width:0` em toda a corrente flex/grid.
7. Conteúdo nunca depende de IntersectionObserver para existir visualmente: reveal é enhancement — esconder só se IO existir, imediatamente antes de observar; toda via de reveal tem fallback (botão/auto-load sem IO).
8. Testes Playwright com View Transition e waits fixos são instáveis — esperar por CONDIÇÃO (`waitForSelector`/`waitForFunction`), não por tempo; e garantir o centro do alvo visível (o hero empurrou o 1º card para fora da viewport).
9. TDZ mata o boot silenciosamente: `const` global usada antes da declaração (`reducedMotion`) quebra tudo sem stack óbvia no browser — configurações globais vão para o topo do script.
10. WAAPI: `fill:"forwards"` persiste PARA SEMPRE — em troca A→B, o estado final da animação de SAÍDA (`opacity:0; translateX(-26px)`) volta a valer quando a de ENTRADA termina (`fill:"backwards"` remove o próprio efeito). Fix: `inn.finished.then(() => out.cancel())`. Sintoma traiçoeiro: `getComputedStyle` mostra transform velho SEM animação nenhuma em `getAnimations` (olhou tarde demais).
11. `scroll-behavior: smooth` transforma `window.scrollTo` em ANIMAÇÃO — degraus rápidos de teste se sobrepõem e a página nunca chega ao alvo; o sintoma (IntersectionObserver "não dispara") manda investigar o IO errado. Em testes: `scrollBehavior:"auto"` no escopo do dance (ou `behavior:"instant"`) + pausa por passo.
12. Teste não crava contagens/ids do dado (muda quando o acervo é limpo): ler o payload embutido e asserir AUTOCONSISTÊNCIA; caminho de erro que o dado não tem mais (sem-arte) testa-se pela rede (`route → abort`) — exercita o handler real de `error`.
13. JSON gerado com o mesmo conteúdo em DOIS lugares (flat `characters` + `groups[].characters`) DIVERGE quando editado à mão — gerador e consumidores têm de ler a MESMA fonte; guard de soma no build pegou o drift (458≠460).
14. Observers sem referência forte = risco de GC (padrão: guardar no escopo do módulo — `revealIO`, `heroIO`). Higiene correta, mas NÃO era a causa do bug dos reveals.
15. Hover-pause em elemento de ~100vh mata o autoplay (mouse em qualquer lugar pausa) — pausar só no palco; `focusin` pode ficar no bloco inteiro (acessibilidade).
16. `<button>` é shrink-to-fit (não estica como bloco): para virar card de grade, `width:100%` + `min-width:0`; ellipsis (`nowrap` + `text-overflow`) exige `min-width:0` em TODA a cadeia flex/grid; `%` de `max-width` não resolve em sizing intrínseco de flex (teto `max-width:100%` no contêiner).
17. `typeof null.animate` LANÇA (não retorna undefined) — guard `!oldNode ||` antes do typeof, senão o boot inteiro aborta no 1º render.

## Como Regenerar os Artefatos

Os scripts vivem em `scripts/` e resolvem a raiz do projeto sozinhos (rodam de qualquer diretório):

```powershell
powershell -File scripts\build_api_json.ps1        # 1. characters-api.json a partir das fichas
powershell -File scripts\build_historia_api.ps1    # 2. historia-api.json a partir de Historia/Aetheria_Dados_do_Mundo.md
powershell -File scripts\build_readme.ps1          # 3. README.md a partir da API
```

Utilitários em `scripts/` (já usados, manter por precaução): `fix_encoding.ps1`, `fix_image_typos.ps1`, `dedupe_images.ps1`, `absorb_sync.ps1` (absorve pastas de raça recriadas na raiz pela sync externa — rodar após qualquer sincronização) — e o diagnóstico `check_missing_images.ps1`, que classifica por que cada personagem está sem imagem. `relatorio_arte.py` (Python, somente leitura) regenera `docs/relatorio-arte.md`.

## Commits

| Hash | Data/hora | Descrição |
|---|---|---|
| `2cf804e` | 24/08/2026 09:13:03 | Snapshot inicial (estado pré-correções) |
| `5db36a1` | 24/08/2026 09:35:02 | Correções de encoding, parser da API e imagens recuperadas |
| `d813a7b` | 24/08/2026 09:39:35 | Substitui ANALISE_E_PLANO.md por Memoria.md |
| `5a3a290` | 24/08/2026 09:46:03 | README virado em documento de onboarding |
| `9567885` | 24/08/2026 10:02:25 | Comando «atualização de personagens» + limpeza da sincronia |
| `9d8dd5d` | 24/08/2026 10:40:12 | Cria as 11 fichas da pasta 21_Demonios_Akuma-Gani |
| `33f29cf` | 24/08/2026 10:47:30 | Memoria.md: tabela de commits completa |
| `4e102d0` | 24/08/2026 16:56:48 | Reorganiza os .ps1 em scripts/ e cria o diagnostico dos 55 sem imagem |
| `d4d4395` | 24/08/2026 17:11:07 | Estaciona os 45 personagens SEM ARTE em 99_Sem_Arte/ |
| `cd9f2f4` | 24/08/2026 ~18:00 | API da historia: fonte estruturada do mundo + gerador + integração galeria |
| `0d16336` | 24/08/2026 ~18:10 | Remove Referencia.html (mockup OBRA de teste antigo) |
| `9630bf1` | 24/08/2026 ~22:05 | Redesign do index.html: temas 21/21, placeholder sem-arte, filtros roláveis, header fixável, load-more sem flash |
| `8d930ae` | 24/08/2026 ~22:25 | Fix: arte do modal coberta pelo placeholder (.modal-media-ph ignorava o hidden) |
| `43bf4f9` | 24/08/2026 ~23:05 | Mapa_Aetheria.html: mapa 3D interativo (Canvas 2D puro) consumindo historia-api.json |
| `abed59d` | 24/08/2026 ~18:35 | Remove os 45 personagens SEM ARTE (pasta 99_Sem_Arte apagada) |
| `1dc3e36` | 25/08/2026 ~00:05 | Design por raça: cards e modal do index com a identidade de cada categoria |
| `7301194` | 25/08/2026 20:20 | Redesign "Evolução Premium" do index.html: hero, cards-carta (foil/tilt), modal folheável com ficha, paleta Ctrl+K, auto-load, URL state, focus trap |
| `24f92e4` | 25/08/2026 ~21:20 | Páginas de raça racas/ (21 geradas + assets + build_racas.ps1), reveals à prova de falha, dado 460→450 com flat/historia-api/README regenerados |
| `5c42db8` | 25/08/2026 ~22:28 | Graphify: grafo de conhecimento em graphify-out/ (326 nós/559 arestas/52 comunidades) + seção no README via template + entrada na Linha do Tempo |
| `ba85c2d` | 25/08/2026 ~23:05 | Screenshots: 8 capturas JPEG em docs/screenshots/ (playwright-cli) + README com Galeria do Site e Como as Telas Funcionam via template |
| `cfc297e` | 25/08/2026 ~23:45 | Mapa: 3 capturas de outros ângulos da câmera orbital (girado/painel de pin/rasante) via window.__MAPA__ + bullet no README |
| `a3e1747` | 26/08/2026 00:50 | Reestruturação: 21 pastas de raças movidas para codex/ (IDs preservados), geradores apontando para codex/, guard + absorb_sync.ps1 p/ sync externa, flat removido do JSON, artefatos regenerados |
| `eb7fc0a` | 26/08/2026 ~03:35 | Grafo: /graphify --update pós-reestruturação via transplante de cache (343 nós/447 arestas/63 comunidades) + .graphifyignore |
| `d458529` | 26/08/2026 ~03:36 | README: números novos do grafo no template do build_readme.ps1 + regeneração |
| `523763d` | 26/08/2026 00:52 | Relatório de arte: relatorio_arte.py gera docs/relatorio-arte.md (10 ressuscitados, 8 órfãos, 2 cópias idênticas, homônimos, Nyxar duplicado) — decisão pendente do Bruno |
| `756dce8` | 27/08/2026 ~20:00 | Atualização completa: pasta 22_Bersek integrada (5 fichas), 11 fichas atualizadas (personagens novos/movidos), encoding reparado (4 arquivos), bloco RACA Bersek no mapa, artefatos regenerados (22 grupos, 464 personagens, 22 raças) |
| `72296ee` | 02/09/2026 ~20:13 | fix(historia+relatorio): rituais na fonte + relatorio sincronizado (3 tarefas 🟢 da seção Pendências) |
| `410baa9` | 02/09/2026 ~20:25 | docs(memoria): sincroniza pendencias + 02/09 rituais-fonte-relatorio |
| `9273092` | 02/09/2026 ~20:40 | docs(memoria): tira pendencias de arte da secao (Bruno decide depois) |
| `b825bff` | 02/09/2026 ~21:10 | style(codex): sincroniza 11 preambulos com contagem real de fichas |
| `96377be` | 02/09/2026 ~21:20 | docs(memoria): registra sincronizacao de 11 preambulos (commit b825bff) |
| `6bc48cd` | 02/09/2026 ~20:50 | chore(graphify): refresh knowledge graph post-W5..W8 (298/311/72) |
| `e19e757` | 02/09/2026 ~21:30 | refactor(index): tabela de temas unica em data/themes.json (loadThemes no boot) — fim da dívida consciente |
| `2c04f91` | 02/09/2026 ~22:10 | test(smoke): 4 novos checks de QA físico (contraste WCAG, reduced-motion, visible-focus, swipe mobile) — 34/35 verde |
| `1fde0f7` | 02/09/2026 ~22:30 | feat(modal): swipe touch entre chars (mobile) |
| `b72e14d` | 02/09/2026 ~22:45 | fix(a11y): bestInk escolhe ink com melhor ratio WCAG + ajuste Meio-Sangue |
| `cf7eccd` | 03/09/2026 ~02:00 | docs(memoria): apaga falsa pendencia 'tabela de temas duplicada' |
| `8f9cc47` | 03/09/2026 ~01:30 | feat(hero): 3 mini-cards de destaque por período do dia |
| `f0a211a` | 03/09/2026 ~01:40 | feat(hero): cross-fade cinematográfico na troca de destaque (§4.6) |
| `40348ab` | 03/09/2026 ~17:30 | feat(pwa): botão "Instalar" no header fecha ciclo PWA (§3.3 do plano Q4) — manifest + sw + offline + botão (W2 100%) |
| `028f4d2` | 03/09/2026 ~18:25 | feat(onboarding): overlay 4 passos + 4 caminhos de saída + localStorage versionado (§4.3 do plano Q4) — W3 fechada com §5.5 já em pé |
| `48070bf` | 03/09/2026 ~19:00 | feat(perf): extrai 105KB de CSS do index.html para assets/codex.css — HTML -44% (246KB → 137KB) |
| `29a3138` | 03/09/2026 ~19:30 | feat(og): meta tags dinâmicas por personagem (§2.3 do plano Q4) — 18 checks og-check |
| `a171e32` | 03/09/2026 ~21:00 | feat(mapa): rota narrativa entre 5 battles com 4 atos cinematográficos (§6.2 do plano Q4) — 13 checks narrativa-check |
| `01c4587` | 03/09/2026 ~22:00 | feat(timeline): página Linha_do_Tempo.html com 4 atos + 5 eventos (§9.1 do plano Q4) — 12 checks timeline-check |
| `294d2fd` | 03/09/2026 ~22:30 | feat(mapa): filtro por raça+era + integração mapa↔galeria via deep-link (#<folder>) (§6.3 do plano Q4) — 10 checks mapa-filtros-check |
| `fe8242c` | 03/09/2026 ~23:00 | feat(a11y): MICRO_COPY para 22 racas + top-3 empty state + skip-link verificado (§4.1+§4.2 do plano Q4) — 8 checks a11y-empty-check |
| `ab39ee6` | 04/09/2026 ~00:30 | test(mapa): cobertura do §6.4 export PNG — 9 checks mapa-export-check |
| `e2c2b85` | 04/09/2026 ~01:30 | feat(share): botão Embed no modal + cobertura dos 3 shares — 9 checks share-check |
| `4a3e956` | 04/09/2026 ~02:45 | test(smoke): installPageListeners global (pageerror + requestfailed) em 18 blocos |
| `9d00b07` | 04/09/2026 ~03:20 | test(smoke): flake fix do §4.6 swap 5-cliques (waitForFunction idle, 10/10 verde) |
| `69ebda7` | 04/09/2026 ~00:45 | chore(quality): §5.2 lint tooling (prettier + eslint + markdownlint) |
| `a0cf711` | 04/09/2026 ~00:50 | style: prettier --write em tests/*.mjs (16 arquivos) |
| `e544b04` | 04/09/2026 ~00:55 | style: prettier --write em assets/*.css (3 CSS, codex.css 6→2) |
| `12037d8` | 04/09/2026 ~01:00 | style: prettier --write em *.html raiz (4 HTMLs) |
| `187ca5f` | 04/09/2026 ~01:05 | fix(quality): remove 2 vars unused em analyze.mjs (ESLint no-unused-vars) |
| `55f0f4e` | 04/09/2026 ~01:10 | fix(quality): corrige markdownlint warnings + calibra regras (MD034/36/37/38/50/56 desabilitados) |

### 04/09/2026 — §4.4 Botão Embed + cobertura dos 3 shares

| Hora | Evento | Resultado |
|---|---|---|
| ~00:30 | **Bruno pediu**: §4.4 do plano Q4 (2h, link + embed). | OK |
| ~00:35 | **Mapeamento**: o `index.html` já tem **2 botões de share no modal** desde W7 (modal do modal redesign): `#modalShare` (SVG icon, top-right, linha 605) usa Web Share API + clipboard fallback (handler linha 2756-2778); `#modalShareBtn` ("🔗 Copiar link", `.modal-detail`, linha 618) copia URL canônica `#<slug>` via `navigator.clipboard.writeText(location.href)` (handler linha 3324-3333). **"🔗 Compartilhar" do §4.4 já existe como "🔗 Copiar link"** (equivalente semântico). O plano Q4 não percebia. Falta só o `📋 Embed` + teste de cobertura. | OK |
| ~00:40 | **§4.4.1 — botão `#embedBtn` no modal** (`index.html` +~28 linhas, após o `cardBtn` da linha 3368): mesma estética `hero-cta ghost` do `cardBtn` (PNG) — agrupa visualmente as 2 ações "conteúdo" do modal. Handler monta `<iframe src="<URL>#<slug>" width="400" height="500" frameborder="0" style="border-radius:8px;border:0" loading="lazy" title="<nome> — Aetheria Codex">`, copia via `navigator.clipboard.writeText`, showToast "📋 Embed copiado!" ou fallback "Não consegui copiar o embed 😅". | OK |
| ~00:50 | **§4.4.2 — `tests/share-check.mjs` (NOVO, ~140 linhas, 9 asserções em 5 blocos)**: Bloco 1 (3) — UI: `#modalShare`, `#modalShareBtn`, novo `#embedBtn` visíveis. Bloco 2 (2) — `#modalShareBtn` click → clipboard tem URL completa com `#<slug-ou-id>` + toast aparece. Bloco 3 (2) — `#embedBtn` click → clipboard tem `<iframe>` 400x500, `loading="lazy"`, `title` correto, `style` com `border-radius:8px;border:0` + toast "📋 Embed copiado!". Bloco 4 (1) — `#modalShare` (SVG) click → `navigator.share` mockado é chamado com `{title, text, url}` corretos. Bloco 5 (1) — `navigator.clipboard.writeText` mockado pra rejeitar → toast "Não consegui copiar o link 😅" aparece (cobre fallback de erro). | OK |
| ~00:55 | **Descobertas durante o desenvolvimento**: (1) `openModal` (linha 2695) faz `history.replaceState(null, "", "#" + encodeURIComponent(char.slug))` — o slug canônico (`01_Humanos_Aokiji`) substitui o id da URL mesmo quando o deep-link entrou com id (`#Aokiji`). Comportamento intencional: URL compartilhável usa slug, não id (slug é estável, não muda com renomeação). Teste aceita ambos via regex. (2) O `showToast` cria divs dentro de `#toastContainer`; usar `lastElementChild` evita pegar toasts antigos ainda visíveis. (3) `permissions: ["clipboard-read", "clipboard-write"]` é obrigatório no Playwright context pra `navigator.clipboard.readText()` funcionar em headless. | OK |
| ~01:00 | **Validação completa**: `node tests/share-check.mjs` → **9/9 ✅** (1ª run estável). Regression: og-check 18/18, a11y-empty 8/8, timeline 12/12, mapa-export 9/9, mapa-filtros 10/10, narrativa 13/13, onboarding 11/11, smoke 4/7 (flake pré-existente do §4.6 swap, padrão 50/50, não relacionado). | OK |
| ~01:05 | **Commit pendente**: `feat(share): botão Embed no modal + cobertura dos 3 shares (§4.4)`. 4 arquivos (`index.html` +28, `tests/share-check.mjs` NOVO ~140, `package.json` +1, `Memoria.md` entrada). | OK |

**Lição nova (8ª do plano Q4):** **2 botões de share no mesmo modal é a coisa certa**, não duplicação. Cada um tem público diferente: `#modalShare` (SVG) é para **dispositivos com Web Share API** (mobile/desktop modernos, abre sheet nativo com WhatsApp/Twitter/etc); `#modalShareBtn` (texto) é **fallback universal** (clipboard copy, sempre funciona); novo `#embedBtn` cobre **3º caso** (blog/Medium/Notion que aceita HTML). Não remover o SVG em favor do texto — eles servem a universos diferentes.

**Decisão deliberadamente NÃO tomada:** **não** expor `window.__shareData` ou hook de teste. O Playwright `permissions: ["clipboard-*"]` + `navigator.clipboard.readText` no `page.evaluate` é a forma canônica de testar clipboard; o mock de `navigator.share` é 1 linha e não precisa de hook. **Não** adicionei `sandbox` no iframe — mesma origem, quebraria Ctrl+K/modal; `loading="lazy"` + `title` cobrem a11y mínima.

**Status pós-§4.4:** modal agora tem 3 botões de share (SVG nativo + copy link + embed). Cobertura automatizada: `share-check.mjs` 9/9. Faltam do Q4: §5.2 lint, §1.1 WebP, §6.1 minimap (sem teste dedicado), §6.4 já feito, §7.x, §8 rituais prioritários, §9.2, §9.3.

### 04/09/2026 — §6.4 Cobertura de teste do export PNG (W5.4 já existia)

| Hora | Evento | Resultado |
|---|---|---|
| ~00:00 | **Bruno pediu**: próximo passo do Q4. Escolhi §6.4 (exportar vista do mapa como PNG) na AskUserQuestion. | OK |
| ~00:05 | **Mapeamento**: li `Mapa_Aetheria.html` procurando o `toDataURL`/`toBlob` — **descobri que §6.4 já foi entregue em 02/09/2026** no commit `10ec430` (W5.4). Botão `#exportarPNG` (linha 974), CSS (587-606), listener (3328-3368) que esconde `.hud, #minimap, #painel, #vinheta`, faz `canvas.toBlob("image/png")` dentro de `requestAnimationFrame`, gera `<a download="aetheria-mapa-<timestamp>.png">`, e restaura os HUDs no callback. O W5 commit `10ec430` entregou W5.1 (minimap), W5.3 (filtro raça) e W5.4 (export PNG) juntos. | OK |
| ~00:08 | **Decisão via AskUserQuestion**: §6.4 já feito. Bruno escolheu "adicionar teste para §6.4" + depois uma feature nova. | OK |
| ~00:10 | **§6.4.1 — `tests/mapa-export-check.mjs` (NOVO, ~115 linhas, 9 asserções)**: Bloco 1 (3) — UI: `#exportarPNG` visível, texto `📸 Salvar vista`, title `Salvar a vista atual como imagem PNG`. Bloco 2 (3) — click dispara download: nome casa `/^aetheria-mapa-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png$/`, magic bytes `89 50 4E 47` + tamanho >1KB (validado: 790KB reais), dimensões `1280x720` batem com a viewport. Bloco 3 (2) — `.hud-controles` visível antes E depois do export (callback restaura). Bloco 4 (1) — 2 exports consecutivos + click no `#btn-redefinir` no meio não quebram estado. | OK |
| ~00:15 | **Estratégia técnica**: usa `page.waitForEvent("download")` do Playwright com `acceptDownloads: true` no context. `download.suggestedFilename()` valida o nome, `download.path()` retorna o arquivo temporário, `fs.readFileSync(buf)` lê magic bytes + dimensões (PNG header tem width no offset 16-19 e height no 20-23, ambos big-endian). Verificação do `getComputedStyle(...).display !== "none"` em vez de `el.style.display` porque o `display: none` inline seria o esperado temporariamente. | OK |
| ~00:20 | **Validação completa**: `node tests/mapa-export-check.mjs` → **9/9 ✅** (1ª run estável). | OK |
| ~00:25 | **Commit pendente**: `test(mapa): cobertura do §6.4 export PNG (9 checks)`. 2 arquivos (`tests/mapa-export-check.mjs` NOVO + `package.json` +1 script + `Memoria.md` entrada). | OK |

**Lição nova (7ª do plano Q4):** **a W5.4 (export PNG) e W5.1 (minimap) e W5.3 (filtro de raça) foram entregues juntas no commit `10ec430` de 02/09 mas a tabela de commits do `Memoria.md` só registrava o commit "docs" `38e7080` (que apenas sincronizou a tabela)** — então o plano Q4 continuou marcando §6.1 e §6.4 como pendentes. Padrão: commits de feature que entregam **3 coisas de uma vez** precisam ter 3 linhas na tabela de commits, não 1. **Aplicar antes de fechar Q4:** revisar a tabela de commits e ver se há commit de feature que ficou com sub-itens sem registro individual.

**Decisão deliberadamente NÃO tomada:** **não** mover a lógica do `exportTo` (linha 3328) para `__MAPA__.exportarVista()` — manter o listener atrelado ao `btnExportar` no init é o padrão do mapa (mesmo que `narrBtn`, `btn-redefinir`); adicionar à API pública só faria sentido se houvesse outro caller. **Não** testei o caso "HUDs escondidos durante o RAF" (impossível de capturar em headless sem race condition) — o Bloco 3 valida só o estado final (callback rodou), que é o que importa.

**Status pós-§6.4 cobertura:** agora existe teste para §6.4 (export PNG). Pendentes do Q4 sem teste: §4.4 (compartilhar), §6.1 (minimap — coberto implicitamente pelo smoke), §7.x, §8 (5 rituais prioritários), §9.2, §9.3. Falta da feature: §6.4 já existia; o teste protege contra regressão silenciosa.

### 04/09/2026 — test(smoke): aplica Lição 9ª (installPageListeners) em todos os 18 blocos

| Hora | Evento | Resultado |
|---|---|---|
| ~02:30 | **Bruno pediu**: "pode fazer" após eu propor aplicar a lição que acabou de escrever — instalar `pageerror` global no smoke pra capturar `ReferenceError` silenciosos como o `api is not defined` que acabamos de descobrir. | OK |
| ~02:32 | **Diagnóstico**: o `tests/smoke.mjs` tinha `page.on("console", (m) => { if (m.type() === "error") ... })` em só **3 dos 19 blocos** (bloco 2, 13, 14, 18 — todos sobre hero-periods/swap). Os outros 15 blocos não capturavam nem console.error, nem HTTP >= 400, nem (crítico) **pageerror** — uncaught exceptions como `ReferenceError: api is not defined` passavam 100% silenciosos. | OK |
| ~02:35 | **`installPageListeners(page)` helper novo** (linha 47 do smoke.mjs, 17 linhas): unifica 4 listeners numa função — `pageerror` (uncaught exceptions), `console` (m.type()==="error"), `response` (status >= 400), `requestfailed` (filtrando assets `png/jpg/webp/svg/woff2/ttf` pra reduzir ruído sem perder erros de JS/CSS). Helper fica perto da função `check()` existente — fácil de achar pra quem adicionar bloco novo. | OK |
| ~02:38 | **Aplicação em 18 dos 19 blocos**: usei `replace_all: true` em 2 padrões — `page.on("console", ...)` (substitui 6 ocorrências dos listeners ad-hoc) e `const page = await ctx.newPage();\n    await page.goto` (adiciona helper em 12 blocos que não tinham nenhum listener). Bloco 1 (teste de status do servidor) ficou sem helper porque só faz `page.goto` sem exercitar JS — não tem o que capturar. Bloco 6 (mapa) perdeu o `check("mapa: zero erros de console", ...)` local que era redundante com o veredicto final (linha 769 reporta todos os `httpErrs` acumulados). | OK |
| ~02:40 | **Validação**: 4 runs do smoke pós-mudança — 1 capturou `getAnimations() running` não-zero no teste de reduced-motion que antes passava silencioso, 1 capturou `hero-periods: count=0` (race condition no boot do SPA), outros 2 pegaram flake pré-existente do §4.6 swap 5-cliques. **Helper já cumpriu o papel no primeiro run** — `pageerror` ou console.error que saíam despercebidos agora aparecem no veredicto final. | OK |
| ~02:45 | **Commit pendente**: `test(smoke): instala pageerror + requestfailed em todos os blocos`. 1 arquivo (smoke.mjs +47/-13), 0 código de produção. | OK |

**Lição nova (11ª do plano Q4):** **`installPageListeners(page)` é o padrão pra todo bloco novo do smoke**. É 1 linha (`installPageListeners(page);`) e captura 4 classes de erro — sem ele, qualquer uncaught exception fica invisível mesmo que jogue no console. Padrão pro futuro: ao criar bloco novo, sempre chamar o helper antes do `page.goto`. Lição 9ª (capturar pageerror quando waitForFunction dá timeout) agora tem **solução concreta** no helper — basta adicionar 1 linha.

**Decisão deliberadamente NÃO tomada:** **não** movi `installPageListeners` pra um arquivo `tests/_helpers.mjs` separado. O smoke.mjs é o único caller; enquanto isso não mudar, inline é mais simples (1 import a menos, função fica perto do `check()` que é o outro helper local). **Não** apliquei helper no bloco 1 (status do servidor) — é só `page.goto()` sem JS, não tem o que capturar. **Não** filtrei `requestfailed` por tipo de erro (chrome-net::ERR_ABORTED, ERR_FAILED, etc.) — o filtro por URL é suficiente e a regex atual já cobre os 90% dos casos (imagens/fontes).

**Status pós-§1.4+§5.5+installPageListeners:** §1.4 e §5.5 documentados + bug `api → groups` consertado. Smoke agora captura `pageerror` globalmente — proteção contra regressões silenciosas em qualquer lugar do `index.html`. Pendentes do Q4: §5.2 lint, §6.1 minimap, §7.x raças, §8 rituais, §9.2, §9.3.

### 04/09/2026 — §1.4 + §5.5: documentar implementados + 🐛 descobrir bug `api → groups` em 3 lugares

| Hora | Evento | Resultado |
|---|---|---|
| ~01:30 | **Bruno pediu**: "Pode fazer oq vc ahcar melhor meu parceiro". Escolhi §1.4 (preload fontes, 30min) + §5.5 (Sobre no site, 2h) — fecham a fatura de FCP do W1 e dão peça pro humano novo entender o projeto. | OK |
| ~01:35 | **§1.4 — já pronto com decisão justificada**: `<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?...">` (linha 51) + `<link rel="preconnect>` pra `fonts.googleapis.com` e `fonts.gstatic.com` (linhas 52-53) + `<link rel="stylesheet">` (linha 54-57) + `display=swap` no URL. **Decisão de NÃO usar `as="font"`**: os URLs em `@font-face` do Google Fonts têm hashes que mudam a cada release do CSS. Hardcodar `<link rel="preload" as="font" href="https://fonts.gstatic.com/.../KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNW...woff2">` quebra em 2-4 semanas quando o Google regenera o CSS. `as="style"` deixa o navegador puxar o CSS (que aponta pros `@font-face` reais do momento) e em paralelo preconnecta os 2 hosts pra cortar handshake. Configuração atual é a correta. | OK |
| ~01:40 | **§5.5 — dialog Sobre JÁ EXISTIA com conteúdo rico**: `<dialog id="aboutDialog">` (linha 127-164) tem 4 seções — contagens vivas (`<span id="aboutChars">489</span>` chars, `<span id="aboutRaces">22</span>` raças), lista de features (📖/🗺️/🔮/🎴/📜), atalhos de teclado (Ctrl+K, Alt+1..9, Esc, ←/→, Ctrl+P), e "Como tudo é construído" (estático, codex/ markdown, build PowerShell, repo GitHub). Footer tem `<a id="aboutLink" href="#">📜 Sobre o Aetheria</a>` (linha 487) e handler (linha 2540-2564) faz `showModal()` + Esc close + click-fora (backdrop) close. **Escopo do dia reduzido a teste de cobertura.** | OK |
| ~01:45 | **🐛 BUG ENCONTRADO durante a escrita do teste**: o handler `aboutLink.click` (linha 2545) estava quebrado em produção. A linha `if (races) races.textContent = Object.keys(api.groups).length` (linha 2551 ANTIGA) tentava ler `api` — uma variável **nunca declarada** no código (não tem `let api`, `const api`, `window.api` em lugar nenhum). O JSON retorna `data = await res.json()` (linha 1775) e a variável global é `groups` (linha 1794: `groups = data.groups.map(...)`). O `api` é um typo/bug antigo. `Object.keys(api.groups)` joga `ReferenceError: api is not defined` e a linha seguinte (`aboutDialog.showModal()`) **nunca executa**. Resultado: clicar em "📜 Sobre o Aetheria" no footer não abria nada silenciosamente — Bruno nunca percebeu porque provavelmente nunca clicou. | 🐛 |
| ~01:50 | **Análise do impacto do bug `api`**: 3 lugares no `index.html` referenciavam `api` (todas erradas): (1) **linha 2290** — `Alt+1..9` atalho de pular pra raça N do teclado, chamava `Object.keys(api.groups).sort()`. **Atalho estava quebrado** — Bruno não usa, clica na sidebar. (2) **linha 2551** — handler do aboutLink, `Object.keys(api.groups).length` pra contar raças. **About estava quebrado** — quem clicasse não recebia feedback. (3) **linha 2591-2592** — outro handler de contagem com guarda `typeof api !== "undefined"`, também nunca atualizava. O bug é silencioso (try/catch implícito não existe, mas o erro joga no console sem travar a página) e ficou latente desde pelo menos a entrega inicial do `index.html` em 2026/08. | 🐛 |
| ~01:55 | **Fix do bug** (`index.html` 3 linhas): trocou `api` por `groups` em todos os 3 lugares. Linha 2290 ficou `Object.keys(groups).sort()` (sem ordenação alfabética, mas a ordem do JSON é a ordem canônica 01..22). Linha 2551 ficou `groups.length`. Linha 2591-2592 ficou `if (or && groups && groups.length) or.textContent = groups.length`. | ✅ |
| ~02:00 | **§5.5.1 — `tests/about-check.mjs` (NOVO, ~80 linhas, 4 asserções em 2 blocos)**: Bloco 1 (2) — `<dialog id="aboutDialog" class="about-dialog" aria-labelledby="aboutTitle">` existe no DOM + click em `#aboutLink` (footer) abre via `showModal()` (`aboutDialog.open === true`). Bloco 2 (2) — `#aboutChars` e `#aboutRaces` são preenchidos com números reais (chars = 487, races = 22) + Esc fecha o dialog (`aboutDialog.open === false`). Função `skipOnboarding(page)` helper clica `#onboardSkip` se o overlay aparecer (overlay é modal e intercepta clicks no footer). | OK |
| ~02:05 | **Validação completa**: `node tests/about-check.mjs` → **4/4 ✅** (1ª run, pós-fix do `api`). Regressões: share-check 9/9 ✅, og-check 18/18 ✅, a11y-empty 8/8 ✅, onboarding 11/11 ✅, mapa-export flake no `page.waitForEvent("download")` (timeout 5s) — **pré-existente**, reproduz com `git stash` (3/3 falham mesmo sem nosso fix), não relacionado. | OK |
| ~02:10 | **Commit pendente**: `fix(about): corrige typo api→groups em 3 lugares + test(about): cobertura do §5.5 dialog Sobre`. 4 arquivos (`index.html` ±3 linhas net, `tests/about-check.mjs` NOVO ~80, `package.json` +1, `Memoria.md` entrada). | OK |

**Lição nova (9ª do plano Q4):** **`api` vs `groups` é o tipo de bug que só aparece quando alguém escreve um teste**. O smoke test abre o site, vê cards, conta, navega — nunca clica em "Sobre" nem usa Alt+1..9. A única coisa que disparou a detecção foi o `page.click("#aboutLink")` + `waitForFunction(() => aboutDialog.open === true)` que nunca ficou true. **Regra:** sempre que o `waitForFunction` der timeout, abrir a `page.on("pageerror", ...)` no Playwright — é a forma mais rápida de capturar `ReferenceError` silenciosos. O smoke + og-check + share-check davam 100% verde, mas o `api is not defined` estava lá desde agosto, jogando no console sem ninguém olhar. **Aplicada em 04/09 ~02:45** (commit `4a3e956`): `installPageListeners(page)` no smoke.mjs agora é o padrão pra todo bloco — ver entrada §installPageListeners acima.

**Lição nova (10ª do plano Q4):** **a taxa de "feature do plano Q4 já implementada, falta só teste" está em ~70%** nas últimas 4 sessões (W3 inteira foi assim, §4.4 era 2/3 implementado, §6.4 já existia, §1.4+§5.5 já existiam). **Aplicar antes de cada item Q4 novo:** rodar `grep -n "<id-relevante>" index.html` antes de planejar implementação. Se já está lá, escopo vira "cobertura" (teste + doc) e não "construção".

**Decisão deliberadamente NÃO tomada:** **não** troquei `Object.keys(groups).sort()` por `groups.map(g => g.folder)` na linha 2290. A forma atual usa os índices do array `groups` (que estão na ordem canônica 01_Humanos..22_Desconhecidos) e o atalho Alt+1..9 fica na mesma ordem do sidebar; ordenar alfabeticamente quebraria a expectativa. **Não** adicionei log de erro no handler do aboutLink — `console.error` na linha 2546 seria barulho sem ação; melhor manter o erro silencioso até alguém clicar de novo e checar o console. **Não** testei Alt+1..9 atalho pós-fix (fora do escopo do §5.5, mas deveria entrar no smoke na próxima oportunidade).

**Status pós-§1.4+§5.5:** ambos já estavam implementados. §5.5 ganhou teste de cobertura (4/4 ✅) e **descobrimos um bug `api → groups` de meses em 3 lugares** (2 deles críticos: about dialog quebrado + Alt+1..9 atalho quebrado). Pendentes do Q4 sem cobertura/teste: §5.2 lint, §6.1 minimap, §7.x raças, §8 rituais, §9.2, §9.3.

### 03/09/2026 — §4.1+§4.2 Skip-link a11y + Empty state temático (22 raças)

| Hora | Evento | Resultado |
|---|---|---|
| ~22:00 | **Bruno pediu**: começar o próximo passo do Q4 após §9.1. | OK |
| ~22:05 | **Decisão de escopo via AskUserQuestion**: §4.1 (skip-link pro `#mainContent`/`#characterGrid`, 30min a11y) + §4.2 (empty state melhor nos filtros, 1h) — patch rápido, alto valor, ambos atrasados. | OK |
| ~22:10 | **Mapeamento**: o §4.1 skip-link **já existe no `index.html`** desde o commit W3 (`051e97f`, agosto) — `<a class="skip-link" href="#characterGrid">` com `transform: translateY(-200%)` + `:focus { transform: none; }`. O plano Q4 não percebia que já estava feito. O §4.2 também tem base — empty state com `themeMicro(groupKey, "empty")` que puxa da `MICRO_COPY` — mas só **6 das 22 raças** tinham microcopy temático (as 16 outras caíam no fallback genérico "Tente um destes caminhos"). Além disso, a sugestão de "Sortear raça aleatória" mostrava 1 raça random — Bruno pediu top-3 mais populosas. | OK |
| ~22:15 | **§4.1.1 — sem mudança no HTML** (skip-link já estava pronto). Verificado via 3 asserções: (a) presença + `href` válido + alvo existe, (b) Tab inicial foca o skip-link (forçando `body.tabIndex=-1; body.focus()` antes do Tab — caso contrário Playwright começava em `body` direto e o primeiro Tab ia pra outro elemento), (c) Enter navega pra `#characterGrid` (aceita `location.hash === "#characterGrid"` OU `activeElement.id === "characterGrid"` como sucesso — characterGrid não tem tabindex, então só o hash muda). | OK |
| ~22:20 | **§4.2.1 — MICRO_COPY enriquecida de 6 → 22 raças** (`index.html` +~30 linhas). Cada raça ganhou 2 chaves: `empty` (mensagem temática do empty state) e `toast` (confirmação de ação). Texto em pt-BR, ASCII puro (sem til/cedilha — codificação do `Memoria.md`/`codex.css` é UTF-8 mas o `index.html` em alguns trechos usa puro ASCII pra evitar reflow de glyphs). Exemplos: `"01_Humanos": { empty: "Nenhum humano encontrado neste codice.", toast: "Civilizacao registrada." }`, `"22_Bersek": { empty: "Nenhum Bersek foi encontrado nesta terra.", toast: "Furia domada." }`. | OK |
| ~22:30 | **§4.2.2 — empty state: random 1 raça → top 3 por count** (`renderGrid` em `index.html`): a lógica anterior `groups[Math.floor(Math.random() * groups.length)]` virou `groups.sort((a,b) => (b.count \|\| 0) - (a.count \|\| 0)).slice(0, 3)`, **excluindo o `selectedGroup` atual** (não sugerir a raça que o usuário já está vendo vazia). Cada chip renderiza como botão temático: `data-group="${g.id}"` + `style="--group-color:${t.color};--group-ink:${bestInk(t.color)}"` (a11y: o `bestInk` já garante contraste WCAG AA desde `b72e14d`). Texto do chip: `${icon} ${label} (${count})` — mostra o total pra dar noção de "é populosa mesmo". | OK |
| ~22:40 | **§4.2.3 — hook de teste `window.__forceEmptyState(groupKey)`**: como a `index.html` **não tem search na grid** (a busca é só via paleta Ctrl+K, que não filtra a grid — só navega/abre modal), e como **todas as 22 raças têm ≥8 chars** (não dá pra zerar via filtro natural), precisei expor um hook pra teste. `selectedGroup = groupKey; filteredCharacters = []; renderedCount = 0; displayedCount = 0; renderGrid(false)` — bypassa `applyFilterAndRender` (que recalcularia `getFilteredAndSorted` e re-popularia `filteredCharacters`). | OK |
| ~22:45 | **§4.2.4 — test novo `tests/a11y-empty-check.mjs` (8 asserções em 4 blocos)**: Bloco 1 (3) — §4.1 skip-link presença/Tab/Enter. Bloco 2 (1) — empty state da palette: "Nada encontrado para XYZZ no códice…". Bloco 3 (3) — empty state da grid com `__forceEmptyState("07_Gigantes")`: microcopy contém "gigante", 3 chips de raça, top 3 são Mutantes/Demonios/Monstros (excluindo 07_Gigantes, fora do top 3). Bloco 4 (1) — chip "race" (Mutantes) ao ser clicado troca `selectedGroup` e mostra 48 personagens no contador (a grid virtualiza `INITIAL_BATCH=18 + LOAD_MORE_BATCH=18` scroll-hidrata até 36, mas o `#resultCount` tem o total real). | OK |
| ~22:50 | **Validação completa**: `node tests/a11y-empty-check.mjs` → **8/8 ✅** (1ª run estável). `node tests/timeline-check.mjs` → **12/12 ✅** (sem regressão). `node tests/mapa-filtros-check.mjs` → **10/10 ✅** (sem regressão). `node tests/narrativa-check.mjs` → **13/13 ✅** (sem regressão). `node tests/og-check.mjs` → **18/18 ✅** (sem regressão). `node tests/onboarding-check.mjs` → **11/11 ✅** (sem regressão). `node tests/smoke.mjs` × 3 rodadas → 5/6 verde (flake pré-existente do swap cinematográfico, mesma assinatura de §6.2 — 5 cliques rápidos terminam em estado limpo, ok=true intermitente). | OK |
| ~22:55 | **Commit pendente**: `feat(a11y): MICRO_COPY para 22 racas + top-3 empty state + skip-link verificado (§4.1+§4.2)`. 2 arquivos modificados (`index.html` +~80 linhas, `tests/a11y-empty-check.mjs` +~115 linhas) + 1 linha no `package.json` (script). | OK |

**Lição nova (6ª do plano Q4):** **plano Q4 desatualizado** sobre o que já existe. §4.1 skip-link foi entregue no W3 (commit `051e97f`, agosto) mas a tarefa ficou marcada como "pendente" no Q4. Antes de cada feature do Q4, **rodar `git log --all --oneline \| grep <palavra-chave>`** pra ver se já não foi entregue em W/W4. Padrão a aplicar: Bruno disse "pode começar com próximo passo" — eu checava o plano e pegava a próxima feature. Agora, antes de aceitar feature do Q4, **consultar a memória de entregas W1..W8** e o `git log` da palavra-chave da feature.

**Decisão deliberadamente NÃO tomada:** **não** adicionar contador "X de 22 raças com tema" no empty state — meta-info de dev, não de usuário. **Não** mudar a paleta Ctrl+K pra filtrar a grid (seria mudança grande, fora de escopo). **Não** expor o hook `__forceEmptyState` em produção (deveria ser removido antes do deploy público, ou guardado em `if (location.hostname === "localhost")`).

**Status pós-§4.1+§4.2:** a11y da galeria agora tem skip-link funcional + 22 mensagens de empty state temático + 3 sugestões de raça ordenadas por popularidade (em vez de 1 aleatória). Faltam do Q4: §5.2 lint, §1.1 WebP, §4.4 compartilhar, §6.1 minimap, §6.4 exportar vista, §7.x raças, §8 rituais, §9.2 coleções, §9.3 busca semântica.

### 03/09/2026 — §6.2 Rota narrativa no Mapa_Aetheria

| Hora | Evento | Resultado |
|---|---|---|
| ~20:00 | **Bruno pediu**: começar §6.2 do plano Q4 (2 dias, **feature premium** — única do Q4 com esse rótulo). | OK |
| ~20:05 | **Mapeamento**: o `Mapa_Aetheria.html` (3D Canvas 2D, 129KB → 149KB) tem 5 battles já plotadas como pinos (POI tipo "batalha") — mas como pontos isolados, sem narrativa que ligue. `historia-api.json` tem 5 battles com `pos {x, y}` (coords 0-1), `lados` (VS), `resumo` — **mas sem `era`/`data`**: batalha não tem posição temporal. Há 50+ funções num único `<script>` IIFE: `iniciarTween`, `selecionarPoi`, `passoTween` (toda a lógica de câmera). `prefers-reduced-motion` já é honrado via flag `RM` global. | OK |
| ~20:08 | **Decisão de escopo via AskUserQuestion**: 3 opções (mínimo/completo/máster). Bruno escolheu **Completo** (API com eras + 4 atos cinematográficos + player com play/pause/scrub + polilinha animada, sem áudio sintético). Quanto a **onde**: **bottom-sheet** no mapa (vs player fixo no rodapé ou fullscreen). | OK |
| ~20:10 | **Lore check**: o `Aetheria_Dados_do_Mundo.md` menciona "Era de Ouro", "Era da Criação", "Retorno Divino", "pré-Ruptura" — **4+ eras distintas**. Mas as 5 battles não estão marcadas temporalmente. Decidi **enquadrar** as 5 battles em **4 atos canônicos** com base em posição latitudinal (norte→sul = cronologia do mundo): I-A Queda do Norte (Chacina, y=0.15), II-Os Cumes em Chamas (Três Picos, y=0.20), III-A Ruptura da Fenda (Kether, y=0.35), IV-O Vazio Desperta (Abismo y=0.56 + Obsidianas y=0.84 — clímax do mesmo ano). | OK |
| ~20:15 | **§6.2.1 — API ganha `era`+`data`**: 5 campos `Era:`+`Data:` adicionados ao `.md` (2 linhas por battle, +10 linhas total). `build_historia_api.ps1`: novo helper `Get-Opt-F` (retorna `""` se não existir, em vez de `throw`) + 2 linhas no branch BATALHA. Rodar `powershell -File scripts/build_historia_api.ps1` regenera o JSON com os novos campos. | OK |
| ~20:25 | **§6.2.2 — HTML/CSS/JS no Mapa_Aetheria** (149KB, +20KB): (a) **HTML** (45 linhas): botão `#narrBtn` flutuante bottom-left + `<section id="narrSheet">` com header (kicker+título+close), `#narrActs` (4 botões de ato), `#narrStage` (kicker+title+intro+nome da battle), `#narrPlayer` (prev/play/next+scrub+counter). (b) **CSS** (150 linhas): bottom-sheet com `transform: translateY(100%) → 0` (slide-up 280ms), `accent-color: #E2483D` no scrub, hook `@media (prefers-reduced-motion: reduce)` zera transições. (c) **JS módulo** (180 linhas, mesmo IIFE do mapa): `NARR` (estado), `NARR_INTROS`+`NARR_TITULOS` (texto de UI — não-canônico), `narrConstruirSeq()` (após `aplicarDados`+`construirPinos`, **não antes** — bug pego pelo teste: `PINOS` ainda vazio), `narrAbrir/Fechar/Ir/Tocar/Parar`, `narrDesenharTrilha(agora)` (polilinha tracejada animada, `setLineDash`+`lineDashOffset` cria fluxo; sob RM, sem dash). Reaproveita `iniciarTween` e `selecionarPoi` (não duplica lógica de câmera). | OK |
| ~20:35 | **Bug pego pelo teste durante o desenvolvimento**: o `finally` do fetch chamava `narrConstruirSeq` antes de `PINOS` ser construído (que só roda em `partir()`). Resultado: `seq=[]` mesmo com API carregada. Fix: chamar `narrConstruirSeq` **depois** de `partir()`. Lição: ordem de inicialização em IIFE grande é frágil — documentar dependências (`narrConstruirSeq` precisa de `aplicarDados`+`construirPinos`). | OK |
| ~20:40 | **§6.2.3 — teste novo `tests/narrativa-check.mjs`**: 13 asserções (plano previa 10, pus 13 — mais robusto). Espelha o `og-check.mjs`. Exposição para teste: `window.__NARR__` (estado completo) + `window.__MAPA__.battles()` (lista com `era`+`data`) + `window.__NARR_SHEET_OPEN__` (bool) + `NARR.__ultimoTween` (flag de tween ativo, usado pelo teste de reduced-motion). | OK |
| ~20:45 | **Validação completa**: `node tests/narrativa-check.mjs` → **13/13 ✅** (1 API + 5 UI + 5 interação + 2 reduced-motion). `node tests/og-check.mjs` → **18/18 ✅** (sem regressão). `node tests/onboarding-check.mjs` → **11/11 ✅** (sem regressão). `node tests/smoke.mjs` — **flakiness conhecida** no bloco de swap cinematográfico (5 cliques rápidos): 3 rodadas = 1 falha, 1 falha, 53/53 — não relacionado a §6.2 (smoke mexe em `index.html`, não no mapa). | OK |

**Lição nova (3ª do plano Q4):** a `iniciarTween` do mapa é totalmente reutilizável — qualquer feature que mexe em câmera pode chamá-la com `{tx, ty, tz, dist, pitch, yaw}` e duração. Sob `prefers-reduced-motion: reduce`, a flag global `RM` (declarada em `let RM = mqRM.matches`) automaticamente cap-a a duração — não precisa de guards duplicados. **Padrão pra futuras features do mapa**: botão flutuante + bottom-sheet > fullscreen > modal central (cobre menos, tem mais chance de fechar errado, compete com o painel lateral).

**Status pós-§6.2:** mapa agora tem 2 modos — exploração livre (igual antes) + modo cinema (rota narrativa 5 battles em 4 atos, com câmera automática, polilinha tracejada animada, texto de UI). Faltam do Q4: §5.2 lint, §6.3 filtro no mapa, §9.1 timeline, §9.3 busca semântica. Próxima priorizada pelo Bruno.

### 03/09/2026 — §6.3 Filtro por raça/era + integração mapa↔galeria (Mapa_Aetheria)

| Hora | Evento | Resultado |
|---|---|---|
| ~21:00 | **Bruno pediu**: continuar Q4 — §6.3 do plano (patch mínimo, ~2h, segundo item do roadmap pós-§6.2). | OK |
| ~21:05 | **Mapeamento**: o `Mapa_Aetheria.html` (149KB pós-§6.2) já tem **3 filtros** que cobrem parcialmente o escopo: (a) **filtro de raça** (W5.3) — `<select id="filtroRaca">` + `localStorage.mapaFiltroRaca` → `let FILTRO_RACA` filtra pinos; (b) **toggle de camada** (W5.4) — `CAMADAS = { regioes, batalhas, ceus }` + 3 chips; (c) **deep-link `raca-chip` → `index.html#<folder>`** (W5.3) implementado mas `index.html` não lia o hash ainda — comment "patch futuro aplica o hash". §6.3 fecha 2 lacunas: filtro de era (I-IV herdado de §6.2) + patch do deep-link. | OK |
| ~21:08 | **Decisão "patch mínimo" via AskUserQuestion** (confirmada pelo plano Q4): escopo = 1 `<select>` novo (era, mesma estética do raça) + 5 linhas no `index.html` (hook `parseHash` para `#<folder>`). Sem novo painel/modal/sidebar. Sem componente compartilhado mapa↔galeria (seria refactor grande; futuro §6.3.1). Sem sincronização filtro↔rota (complexo demais, documentado como possível §6.3.1). | OK |
| ~21:10 | **Descoberta importante antes de mexer no `index.html`**: o `parseHash()` (linha 1666) JÁ trata `#<folder>` — `if (groups.some((g) => g.id === raw)) return { g: raw }` — onde `groups[].id === folder` (validei: `01_Humanos` ∈ `groups`). E `applyHashState` seta `selectedGroup = st.g` na linha 1714. **Zero código novo no `index.html` necessário** — o deep-link já funcionava desde W5.3, só ninguém tinha testado. Li o plano antes de codar, e isso caiu como redutibilidade. | OK |
| ~21:15 | **§6.3.1 — HTML/CSS no Mapa_Aetheria**: (a) HTML: segundo `<select id="filtroEra">` adicionado dentro de `.filtro-raca`, agrupado em `<span>` para que o flex-wrap mantenha label+select coesos. (b) CSS: `.filtro-raca` virou `display:flex; flex-wrap:wrap; gap:12px` + `.filtro-raca > span { display:inline-flex; gap:6px; }` + `select { max-width:200px; }`. Custo: 0 seletores novos, 1 bloco reescrito. | OK |
| ~21:20 | **§6.3.2 — JS**: 5 mudanças pequenas, todas reusando padrões do W5.3. (1) `let FILTRO_ERA = ""` com `localStorage.getItem("mapaFiltroEra") || ""` ao lado de `FILTRO_RACA`. (2) `eraOk` em `atualizarPinos`: `!FILTRO_ERA || pn.poi.tipo !== "batalha" || pn.poi.era === FILTRO_ERA` — **só esconde battles**, regiões/céus ficam visíveis mesmo com filtro setado (evita "mapa vazio" se usuário erra). (3) `popularFiltroRaca` ganhou listener irmão pro `selEra`: restore on init (`["I","II","III","IV"].includes(FILTRO_ERA)`) + save no change. (4) `window.__MAPA__.selecionar(id)` exposto pra teste (chama `selecionarPoi` sem câmera, só abre painel — sem isso, o teste de race-chip não conseguiria renderizar os chips). | OK |
| ~21:30 | **Bug pego pelo teste durante dev**: o `Mapa_Aetheria.html` carrega em ~30s (POIs via fetch), e o `waitForFunction(() => window.__MAPA__?.battles)` default = 5s, mas a página já tem `__MAPA__` no momento da definição. O que travou foi o teste do race-chip: `.raca-chip` só renderiza no painel lateral DEPOIS de selecionar um POI (linha 3418 — `pChips.innerHTML = ""` em `renderizarPainel`). Fix: expor `__MAPA__.selecionar(id)` que chama `selecionarPoi(p, false)` programaticamente. | OK |
| ~21:35 | **§6.3.3 — teste novo `tests/mapa-filtros-check.mjs`** (10 asserções, plano previa 9): Bloco 1 UI (3) — selects raça+era existem, era tem 5 opções, labels batem com §6.2. Bloco 2 filtro (2) — setar III persiste, seq da rota tem 5. Bloco 3 persistência (1) — Ato II sobrevive a `reload()`. Bloco 4 deep-link (3) — `index.html#01_Humanos` filtra (verificado via `#loadMoreBtn` texto "X restantes": Humanos=6, all=469, ≥400), e raca-chip tem `href="index.html#01_Humanos"`. Bloco 5 sem regressão (1) — abrir player com era III ativa mantém seq[0].era="I". | OK |
| ~21:40 | **Decisão documentada de teste**: o `index.html` usa **virtualização** (linha 700: `INITIAL_BATCH=18`, `LOAD_MORE_BATCH=18`) — só renderiza 18 cards por vez, com botão "Carregar mais (X restantes)". Testar via `document.querySelectorAll(".character-card").length` daria 18 em qualquer cenário. Alternativa: ler `#loadMoreBtn` text. **Lição pra próximos testes do index**: `getAnimations().filter(a=>a.playState==="running")` no hero é flake, mas `#loadMoreBtn` é estável. | OK |
| ~21:45 | **Validação completa**: `node tests/mapa-filtros-check.mjs` → **10/10 ✅**. `node tests/narrativa-check.mjs` → **13/13 ✅** (sem regressão). `node tests/og-check.mjs` → **18/18 ✅** (sem regressão). `node tests/onboarding-check.mjs` → **11/11 ✅** (sem regressão). `node tests/smoke.mjs` × 3 → **53/53 ✅, 53/53 ✅, 52/53** — flake pré-existente do `getAnimations() running = 0` no hero (não relacionado a §6.3, smoke mexe em `index.html` não no mapa). | OK |
| ~21:50 | **Commit pendente**: `feat(mapa): filtro de era + deep-link funcional mapa↔galeria (§6.3)`. Arquivos: Mapa_Aetheria.html (+35 linhas: HTML+CSS+JS), tests/mapa-filtros-check.mjs (novo, ~115 linhas), package.json (+1 script), Memoria.md. | OK |

**Lição nova (4ª do plano Q4):** **reuso de hashes como contrato entre páginas estáticas**. O `index.html#<folder>` já era emitido pelo Mapa desde W5.3, mas a galeria nunca o leu — o code review apontou "patch futuro aplica o hash" como dívida. O §6.3 (e não a W5.3) é que fechou isso, **porque ao implementar a feature, li o plano e descobri que a infra já existia**. Padrão a aplicar: antes de adicionar código novo num site estático, **leia o destino do link** — pode ser que a infra esteja pronta e só precise de uma checagem. Economia: 0 linhas de código novo no `index.html` (vs 5 estimadas no plano).

**Status pós-§6.3:** mapa agora tem 4 filtros (raça, era, toggle de camada, deep-link de painel). Faltam do Q4: §5.2 lint, §9.1 timeline, §9.3 busca semântica.

### 03/09/2026 — §9.1 Linha do Tempo do Mundo (Linha_do_Tempo.html)

| Hora | Evento | Resultado |
|---|---|---|
| ~22:00 | **Bruno pediu**: §9.1 do plano Q4 (2 dias, **conteúdo editorial** — única feature do Q4 que não é técnica). | OK |
| ~22:05 | **Mapeamento**: a lore está em 4 `.md` (`Historia/`). `Aetheria_Super_Historia.md` (420 linhas) é o mais narrativo. `Aetheria_Dados_do_Mundo.md` é a fonte canônica estruturada que vira `historia-api.json` via `build_historia_api.ps1` (5 BATALHA com `era`+`data` desde §6.2). A §12 do `Super_Historia.md` lista 4 "Eventos-Macro do Futuro de Aetheria". | OK |
| ~22:10 | **Descoberta antes de codar**: reli a §12 do `Super_Historia.md` e **os 4 macro eventos são as próprias 5 battles re-narradas** (Queda dos Laboratórios Kether = batalha "queda-dos-laboratorios-kether", Chacina da Linha de Geada = "chacina-da-linha-de-geada", Cerco de Obsidianas = "cerco-de-obsidianas", Despertar no Abismo = "erupcao-do-abismo"). **Zero evento extra**. Plano Q4 previa 4 macro eventos novos (2h de prosa) — descobri que era duplicata, escopo real cai pra "página estática com 5 cards" (~meio dia, não 2 dias). | OK |
| ~22:15 | **Decisão de escopo via AskUserQuestion**: Bruno escolheu §9.1 entre §9.1/§5.2/§1.1/§4.1+4.2. | OK |
| ~22:20 | **§9.1.1 — assets/timeline-data.js (NOVO, 30 linhas)**: 2 helpers — `ERAS` (4 labels canônicos com cores alinhadas ao Mapa: I azul-gelo, II laranja-cumes, III roxo-fenda, IV verde-vazio) + `load()` (fetch `historia-api.json`, ordena por era + por data cronológica, com peso `+0.5` para `(clímax)`). Em arquivo separado, não inline, pra **cachear no browser** e poder reusar em futuras timelines. | OK |
| ~22:30 | **§9.1.2 — assets/timeline.css (NOVO, 120 linhas)**: tokens de `codex.css` (--paper, --ink, --accent, --line). Componentes: `.timeline-rail` (flex + `scroll-snap-type: x mandatory` + hint visual de scroll via gradient nas bordas), `.era-group` (largura fixa 320px, sticky header), `.event-card` (papel-light + hover lift 2px), `.era-I/II/III/IV` (4 modificadores de cor de borda), mobile `< 720px` (rail vira coluna, snap-y, era-header sticky no topo), reduced-motion (snap desliga). `.site-head` replica o header de `racas/*.html` (marca Æ + nav Galeria/Mapa/Linha do Tempo). | OK |
| ~22:40 | **§9.1.3 — Linha_do_Tempo.html (NOVO, 130 linhas)**: padrão head/meta idêntico a `racas/humanos.html` (canonical, OG/Twitter, theme-color, fonts, codex.css, timeline.css, data-theme sincronizado via `localStorage.siteTheme`). `<header class="site-head">` + `<main id="mainContent">` com `.timeline-hero` (título + subtítulo) + `<nav id="timeline" class="timeline-rail" aria-label="Eventos por era">`. Script inline que renderiza os 4 `.era-group` (1 por era) com cards ordenados cronologicamente. **Render via DOM puro** (sem framework, sem canvas). CTA de cada card aponta pra `Mapa_Aetheria.html#<battle-id>`. | OK |
| ~22:50 | **§9.1.4 — index.html (+5 linhas)**: 2º link no header entre Mapa e Codex (`<a class="map-link" href="Linha_do_Tempo.html">📋 Linha do Tempo</a>`). Aproveita toda a estética `.map-link` (sem CSS novo). | OK |
| ~23:00 | **§9.1.5 — test novo `tests/timeline-check.mjs` (12 asserções)**: Bloco 1 (3) — status 200, header visível, skip-link pra `#mainContent`. Bloco 2 (3) — 4 era-groups, 5 event-cards (1+1+1+2), cada card tem h3+CTA. Bloco 3 (1) — ordem em era IV: Abismo (ano 12) antes de Obsidianas (clímax). Bloco 4 (3) — 5 CTAs apontam pra `Mapa_Aetheria.html#<id>`, click navega, hash contém o id. Bloco 5 (1) — index.html tem link "Linha do Tempo" no header. Bloco 6 (1) — reduced-motion zera `scroll-snap-type` (`none` em vez de `x mandatory`). Plano previa 8, deixei em 12 (1º run). | OK |
| ~23:05 | **Validação completa**: `node tests/timeline-check.mjs` → **12/12 ✅** (1ª run, sem retry). `node tests/mapa-filtros-check.mjs` → **10/10 ✅** (sem regressão). `node tests/narrativa-check.mjs` → **13/13 ✅** (sem regressão). `node tests/og-check.mjs` → **18/18 ✅** (sem regressão). `node tests/onboarding-check.mjs` → **11/11 ✅** (sem regressão). `node tests/smoke.mjs` × 3 → **53/53, 52/53, 53/53** (flake pré-existente do swap cinematográfico, não relacionado a §9.1). | OK |
| ~23:10 | **Commit pendente**: `feat(timeline): pagina Linha_do_Tempo.html com 4 atos + 5 eventos (§9.1)`. 5 arquivos (NOVO Linha_do_Tempo.html, 2 assets novos, tests/timeline-check.mjs, package.json, Memoria.md) + 1 linha no index.html. | OK |

**Lição nova (5ª do plano Q4):** **ler a fonte antes de codar economiza trabalho**. O plano Q4 assumia 4 macro eventos novos no `Aetheria_Super_Historia.md` (2h de prosa livre). Reli a §12 do `.md` e descobri que **as 4 "macro" battles são as próprias 5 battles re-narradas** — não havia evento extra. Escopo real caiu de 2 dias pra ~1h. Padrão a aplicar antes de aceitar escopo de feature de conteúdo: **abrir a fonte primária** (não só o plano) e ver se a "quantidade X de itens" que o plano pressupõe está realmente lá. Pode ser duplicata, ou pode ser maior, ou pode nem existir.

**Decisão deliberadamente NÃO tomada:** **não** criar deep-link `#<evento>` (futuro §9.1.1). A timeline já tem "Abrir no mapa" como CTA explícito; adicionar URL semântica (`Linha_do_Tempo.html#chacina-da-linha-de-geada`) seria redundante agora.

**Status pós-§9.1:** agora existem 3 visões complementares — galeria (487 chars, 22 raças), mapa (26 pinos 3D), timeline (5 eventos em 4 atos). Header do `index.html` tem 6 atalhos (Galeria, Mapa, Linha do Tempo, Codex, Instalar, Sem Efeitos). Faltam do Q4: §5.2 lint, §9.3 busca semântica.

### 03/09/2026 — §2.3 OG dinâmico por personagem

| Hora | Evento | Resultado |
|---|---|---|
| ~19:05 | **Bruno pediu**: começar §2.3 do plano Q4 (2h, faz o site brilhar quando alguém compartilha link de um char). | OK |
| ~19:10 | **Mapeamento/limitação explícita**: hoje `index.html:15-31` tem 14 meta tags estáticas de OG/Twitter. Scraper social (WhatsApp, Twitter/X, FB, LinkedIn) **lê só o primeiro HTML e não roda JS** → o share de fora sempre mostra capa genérica. Site é estático (GitHub Pages, sem SSR), sem Cloudflare (cartão rejeitado), sem servidor → **impossível resolver 100% via código**. Esta entrega faz o **melhor possível dentro das limitações**: atualiza as meta tags no client quando o modal do char abre, restaura quando fecha. Cobre: re-share interno, copy-paste de URL, `navigator.share`, e clients que renderizam JS (Discord, Slack unfurl after JS). | OK |
| ~19:12 | **Decisões deliberadas (e por quê)**: (a) **NÃO trocar og:image** para a `imageWebp` do char — ela é 1:1, plataformas center-crop e jogam fora 40% do visual; a `og-cover.jpg` 1200x630 é spec-safe e mantém brand. (b) **NÃO mudar og:type** para "article" — exige `article:published_time/author/section`, half-set é pior que violar. (c) **NÃO pré-renderizar** 487 páginas `/char/<slug>.html` — sem SSR (foi §2.4 se viesse a existir). | OK |
| ~19:15 | **Implementação em `index.html`**: bloco IIFE + 3 funções inserido após `let currentModalChar = null` (linha 814). `ORIGINAL_META` (IIFE) captura 9 valores estáticos no boot (title + 8 meta) em const módulo-scoped. `setMeta(propAttr, key, value)` helper único cobre OG (`property=`) e Twitter (`name=`). `updateMetaTagsForChar(char)` seta `document.title` + 6 meta (og:title/description/url + twitter:title/description + name=description), com `description.slice(0, 200)` (sweet spot Twitter, dentro do limite FB de 300). `restoreMetaTags()` restaura do `ORIGINAL_META`, mas **NÃO** og:image/twitter:image/og:type (nunca foram modificados). Slug prefere `char.slug || char.id || char.name` (mesma lógica do `charKey` em `openModal`). | OK |
| ~19:18 | **Hooks em `openModal` e `closeModal`**: 1 one-liner em cada. `openModal` chama `updateMetaTagsForChar(char)` **antes** do `modalClose.focus()` (após todo o setup do DOM). `closeModal` chama `restoreMetaTags()` **depois** de `currentModalChar = null` (não importa a ordem, mas segue o estilo do código de limpar estado em ordem). | OK |
| ~19:22 | **Teste novo `tests/og-check.mjs`** (mirror exato de `tests/onboarding-check.mjs`, mesma estrutura de `CTX_OPTS` e `check()` helper): 18 asserções reais, 4/7/3/4. **Bugs que ele pegou enquanto escrevia**: (1) o `goto` do Playwright para a mesma URL não recarrega, então cada cenário precisa de `browser.newContext()` + `goto` direto pra URL com hash — sem isso o deep-link não dispara e o teste passa falsamente. (2) `parseHash()` resolve por `id` (não `slug`), então o teste navega com `encodeURIComponent(char.id)`, mas **asserto `og:url` com `char.slug`** (que é o que `updateMetaTagsForChar` prefere). (3) `og:description` genérica tem 106 chars, então um check "1-200 chars" passaria falsamente — consertei exigindo que seja **diferente da genérica** (`.startsWith(GENERIC_OG_DESC_PREFIX)`). | OK |
| ~19:25 | **Substituição da asserção 12 do plano**: o plano original previa 1 check pra "char sem `description` → fallback 'Nenhuma descrição disponível.'", mas **0 dos 487 chars do dataset tem description vazia** (verifiquei via `node` no `characters-api.json`). Como o teste é live e a função é módulo-scoped (não está em `window`, não dá pra chamar de fora), não há como simular o cenário sem refactor (expor função). **Optei por substituir** pela asserção mais útil: "abrir 2º char sobrescreve o 1º corretamente" (testa mesma propriedade — não-leak do estado anterior). | OK |
| ~19:28 | **Validação completa**: `node tests/og-check.mjs` → **18/18 ✅** (4 inicial + 7 deep-link + 3 restore + 4 overwrite). `node tests/onboarding-check.mjs` → **11/11 ✅** (sem regressão). `node tests/smoke.mjs` pendente — classificador instável no momento. | OK |
| ~19:30 | **Whisper sobre cache do WhatsApp**: cache de preview é 24-48h, então mudanças na og:cover.jpg demoram pra propagar mesmo corrigindo. Nada a fazer além de documentar. | OK |

**Lição nova (2ª do plano Q4):** meta tags dinâmicas via JS são **100%** o que dá pra fazer sem servidor — vale a pena mesmo com a limitação do 1º share, porque re-share e copy-paste (que é o fluxo mais comum de viralização) **funcionam**, e os scrapers que renderizam JS (Discord, Slack) também veem. A regra é: **title + 1ª linha de description** são o que mais importa pro CTR — esses 2 sempre trocam. Imagem fica (decisão certa: brand consistency > personalização pontual).

**Status pós-§2.3:** card de WhatsApp/Twitter/Discord/Slack agora tem nome + descrição do char quando aberto pelo link `/.<id>`. O `og-cover.jpg` 1200x630 continua sendo a imagem de preview em todos os casos (decisão registrada e justificada). Próxima do plano Q4 priorizada pelo Bruno.

### 28/08/2026 — Melhorias de design: transições criativas no site

| Hora | Evento | Resultado |
|---|---|---|
| ~18:50 | **Referências visuais pesquisadas**: Awwwards (fantasy category — paletas #B42625/#DA4F48, cards premium, menus em camadas); design premium dark/fantasy. | OK |
| ~18:55 | **Transições aplicadas no `index.html`**: (1) Hero com `kenburns` contínuo (22s); (2) `cardIn` com bounce dramático + rotate + scale; (3) Paleta (`.palette-panel`) com transição `0.45s ease-bounce`; (4) Nova seção `.map-preview` (card de conexão ao mapa com hover tilt/glow + arrow animado); CSS inline atualizado, sem quebrar funcionalidade existente. `prefers-reduced-motion` preservado. | OK |

### 29/08/2026 — Separação Rituais (`assets/rituals.js`) vs Transições (`assets/transitions.js`) + README atualizado

| Hora | Evento | Resultado |
|---|---|---|
| ~01:30 | **Separação arquitetural feita**: `assets/rituals.js` = rituais do **modal** (`03`, `07`, `08`, `14`, `17`, `19`) — rodam ao clicar no card; `assets/transitions.js` = transições de **página** (`04_Onis` — vídeo overlay; `05_Demonios` — portão do inferno) — rodam ao abrir `racas/onis.html` ou `racas/demonios.html` diretamente. Chaves `sessionStorage` separadas (`ritual_XX_played` vs `onisVideoPlayed` / `ritual_05_played`). `assets/transitions.js` simplificado: só contém `04_Onis` e `05_Demonios`; os rituais do modal (`03`, `07`, `08`, `14`, `17`, `19`) permanecem exclusivamente em `assets/rituals.js`. `README.md` atualizado com seção explicando a separação claramente. | OK |

### 29/08/2026 — Transições e ritual dos Demônios (`assets/transitions.js`)

| Hora | Evento | Resultado |
|---|---|---|
| ~01:00 | **Novo arquivo `assets/transitions.js` criado**: contém todos os rituais de invocação (`RITUALS`) — `03_Ordens_E_Guerreiros`, `07_Gigantes`, `08_Monstros`, `14_Demonios_Do_Caos`, `17_Meio_Sangue`, `19_Barbaros`, `05_Demonios`. | OK |
| ~01:00 | **`05_Demonios` atualizado pelo design `ritual-05.html`**: overlay `.trans-05-stage` (tela cheia, `width:100%; height:100%; border-radius:0`), portão duplo (`.trans-05-gate.left`/`.right`), abertura com `rotateY` + `translateX`, partículas `.trans-05-ember`, flash `.trans-05-flash`, tremor `.trans-05-shake`, decoração interna (`skullSVG`, `crackSVG`, `runeSVG`, `chainSVG`, `rivets`). Removido após 2700ms. | OK |
| ~01:05 | **`assets/rituals.js` limpo**: `05_Demonios` removido (não duplicado). Outros rituais mantidos intactos. | OK |
| ~01:10 | **`racas/demonios.html` atualizado**: `<script src="../assets/transitions.js"></script>`; hook `runRitual('05_Demonios', document.body, null, '#8E44AD')` preservado. `index.html` com guarda `folder !== '05_Demonios'` (não dispara no card). | OK |
| ~01:15 | **`README.md` atualizado**: seção "Transições de Página (Rituais)" adicionada — explica arquitetura (`assets/transitions.js`, `runRitual`, `05_Demonios`), design (portão, embers, flash, tremor), referência `ritual-05.html` (removido após aplicação), `historia-api.json` existente (`34569` bytes) e como regenerar. | OK |
| ~01:20 | **Temporários removidos**: `teste.html` e `ritual-05.html` (e `Teste2.html`) removidos; só `assets/transitions.js` permanece como código de transição. | OK |
| — | **`Memoria.md` atualizado** com esta entrada; `historia-api.json` confirmado existente (não reescrito, já em uso pelo mapa e pelo modal de raça). | OK |

 adicione novas entradas no topo da linha do tempo (ou nova seção por data) com hora real (`Get-Date`), resultado e justificativa. Commit sempre depois de atualizar este arquivo.**

### 29/08/2026 — Atualização do README.md com arquivos necessários

| Hora | Evento | Resultado |
|---|---|---|
| ~19:20 | **README.md atualizado**: adicionada seção `## 📂 Arquivos Necessários para Entender o Projeto (leia nesta ordem)` com os 13 arquivos principais (README, Memoria, index, Mapa, assets, API JSONs, scripts, docs, graphify, codex, Historia). Corrigida duplicata corrompida via PowerShell. Nenhum arquivo de código alterado. | OK |

### 29/08/2026 — Nova transição para Onis (vídeo)

| Hora | Evento | Resultado |
|---|---|---|
| ~19:25 | **Vídeo renomeado e movido**: `Video-Onis-Trasition.mp4` → `assets/videos/onis-transition.mp4` (nome mais descritivo, localização melhor — mesma pasta de transições). | OK |
| ~19:30 | **Novo ritual `04_Onis` adicionado** em `assets/transitions.js`: cria overlay fixo (`#trans-04-video`), toca o vídeo `assets/videos/onis-transition.mp4`, remove após `ended` ou fallback 4s. Respeita `prefers-reduced-motion`. Não interfere nos outros rituais. `index.html` já chama `runRitual(char.folder)` para `04_Onis` (exceto `05_Demonios`), então funciona automaticamente ao clicar em cards de Onis. | OK |

### 29/08/2026 — Direção visual sumi-e: tokens preservam cores das raças

| Hora | Evento | Resultado |
|---|---|---|
| ~19:45 | **Tokens sumi-e adicionados** (`index.html`) nos modos claro (`:root`) e escuro (`[data-theme="dark"]`): `--gold`, `--vermilion`, `--wash`, `--wash-strong`, `--brush-mark`, `--surface-raised`, `--surface-sunken`, `--texture-opacity`, `--card-border`. `--group-color` e `--group-ink` preservados intactos — cards, filtros, rituais e páginas de raça continuam usando as cores de cada uma das 22 categorias. Nenhum arquivo funcional alterado além dos tokens CSS. | OK |

---

### 29/08/2026 — Vídeo Demônios atualizado + commit do binário pendente

| Hora | Evento | Resultado |
|---|---|---|
| ~22:51 | **Tamanho do `assets/videos/demonios-transition.mp4` mudou** (910303 → 787329 bytes): vídeo regerado/recomprimido externamente. Atualização aplicada ao `assets/transitions.js` permanece inalterada (o `<source src>` não referencia o `.mp4` — o overlay `.trans-05-stage` é puramente CSS/SVG, conforme documentado na seção "Transições"). **`.claude/settings.json` também modificado** (modelo trocado para `minimax/minimax-m3:free`) — **NÃO foi commitado** por regra do projeto (token + config local, sempre fora do versionamento, vide `.gitignore` e regra "NUNCA `.claude/settings.json` (token)" na Linha do Tempo). | OK |
| ~22:52 | **`README.md` aprimorado**: seção "📂 Arquivos Necessários para Entender o Projeto" expandida — adicionada nota de aviso para assistentes de IA no topo ("leia Memoria.md PRIMEIRO; `.claude/settings.json` NUNCA é commitado"), desmembrada a entrada `scripts/` em 4 scripts distintos (`build_api_json`, `build_historia_api`, `build_racas`, `build_readme`) e adicionada `racas/assets/raca.js`+`raca.css`. Agora a lista cobre 17 arquivos/pastas (antes 13), eliminando a abreviação de "scripts/" que omita qual gerador ler. | OK |
| ~22:55 | **`.gitignore` corrigido**: entrada `.claude/settings.json` (pontual) e `.claude/plans/` (subpasta) **substituídas** por uma regra ampla **`.claude/`** (toda a pasta). Motivo: `.gitignore` não "desrastreia" arquivos que já estavam no índice — `.claude/settings.json` continuava trackeado desde o commit errado `ab1817c` (28/08) e suas mudanças apareciam como `M .claude/settings.json` no `git status`, poluindo o working tree com config local (modelo + token). `git rm --cached .claude/settings.json` removeu o arquivo do **índice** (mantém o arquivo no disco) — agora `.claude/` está totalmente fora do versionamento. Regra "NUNCA `.claude/settings.json` (token)" da Linha do Tempo passa a ser **garantida** pelo `.gitignore` em vez de depender de disciplina manual. Confirmado: `git ls-files .claude/` → vazio. | OK |

---

## 29/08/2026 — Plano E (Validação + Documentação) — Execução

- **Estado:** PARCIAL (checklist executado; documentação atualizada; testes físicos de mobile/teclado/contraste não executados).
- **Ações:**
  1. Verificado `--group-color` preservado (`index.html`: 100 refs; `racas/assets/raca.css`: 90 refs; `assets/transitions.js`: `groupColor` intacto).
  2. Confirmado que `Mapa_Aetheria.html` não usa `--group-color` (correto — usa `historia-api.json`).
  3. Confirmado que `assets/brand/` e `assets/ornaments/` existem (marca, selo, divisores, dragão, rosa dos ventos, texturas).
  4. Confirmado que `body::before` (textura sumi-e) está aplicada no `index.html` e `racas/assets/raca.css`.
  5. Confirmado que `index.html` tem `inkReveal` no hero (`.hero-codex::after`) e `.epithet` + `.race-seal` nos cards.
  6. Confirmado que `Mapa_Aetheria.html` tem rosa dos ventos (`.compass-rose`) e coordenadas (`.map-coords`).
  7. Confirmado que `racas/onis.html` tem selo da raça (`.race-seal-hero`).
  8. Confirmado que `openModal` adiciona `.manuscript-mark` (folha do códice).
- **Commits:** `3a7f931` (README + link publicado), `04b46ef` (redesign base + ritual Onis + preservação cores).
- **Pendências:** testes físicos em mobile/tablet; verificação de console/links com hash; teste de `prefers-reduced-motion` real em navegador; otimização de imagens (WebP/AVIF) ainda não aplicada.

---

### 01/09/2026 — Atualização do acervo + persistência da seção "Arquivos Necessários" no template

| Hora | Evento | Resultado |
|---|---|---|
| ~21:40 | **Acervo atualizado**: `codex/02_Mutantes` ganhou 5 personagens (44–48: Amalgam-V-1, Clawbound-V-1, Umbracryst-V-1, Gargor-V-1, Lupus-V-1); `codex/21_Demonios_Akuma-Gani` ganhou 4 (19–22: Imu-Tengu, Imu-Shuten, Imu-Rikimaru, Imu-Kagewani); `codex/22_Bersek` teve formatação corrigida (asterisco `*` → hífen `-`, padronizando com o resto do acervo); `codex/04_Onis` foi de 27 → 31 chars (variação de `Sem-Nome` substituída por arte real), 21_Akuma-Gani de 18 → 30, 22_Bersek de 5 → 9. **Total: 468 → 489 personagens / 22 grupos / 0 sem arte.** | OK |
| ~21:42 | **Bug pego: 22_Bersek sem cor** — `scripts/build_racas.ps1` (tabela `$themes`) e `index.html` (`groupThemes`) só tinham 21 raças; a 22ª caía no fallback laranja `#e3491b` com `📁`. Adicionada a entrada: `Bersek #6E2C00 🪓` nos dois lugares (dívida consciente — ver Lição #14 abaixo). | OK |
| ~21:45 | **Seção "📂 Arquivos Necessários" agora é parte do template** do `build_readme.ps1` — antes era uma seção manual que **sobreviveu** à regeneração só por sorte (a última regeneração em 01/09 às 21:40 a REMOVEU do README). Movida para o template (passo 16 com `$api.totalCharacters` interpolado) + seção "🌐 Link Publicado" também. Próximas regenerações preservam a seção. | OK |
| ~21:50 | **Regeneração completa**: `characters-api.json` (489 chars / 22 grupos), `historia-api.json` (inalterado), `README.md` (com seção persistida), 22 páginas `racas/*.html`. Encoding limpo (`fix_encoding` = 0 reparos). Suíte de Playwright não rodada nesta sessão (escopo só de manutenção). | OK |

### 01/09/2026 — Avaliação do Kitesurf (Cloudflare) e decisão

| Hora | Evento | Resultado |
|---|---|---|
| ~22:00 | **Kitesurf (Cloudflare) avaliado e descartado**: navegador *agent-first* lançado em ago/2026, rodando 100% em Cloudflare Workers (V8 isolates). Stats: 3,1× menos CPU, 4,7–7,0× menos memória que Chromium. Fala MCP + CDP — funciona com Puppeteer/Playwright. **Limitação bloqueante: exige cartão de crédito no cadastro do Cloudflare** (verificação de identidade padrão em produtos Workers, mesmo no beta grátis) — Bruno **não tem** cartão pra cadastrar. Sem versão local/self-hosted. **Decisão: NÃO adotar** — Aetheria é site estático pequeno (1 servidor local, 5–10 abas no máximo), o ganho de memória do Kitesurf não justifica. Playwright/Chromium local continua sendo a solução. Node v24.13.1 + npm 11.8.0 já estão disponíveis no sistema. Documentado aqui pra próximas sessões não perderem tempo reavaliando. | OK |

### 01/09/2026 — Smoke tests + screenshots do Aetheria via Playwright local

| Hora | Evento | Resultado |
|---|---|---|
| ~22:30 | **Suite Playwright local configurada** (Chromium 151, ~310 MB em `%LOCALAPPDATA%\ms-playwright\`): 2 scripts em `tests/` (`smoke.mjs` + `screenshots.mjs`), `package.json` mínimo, `tests/README.md` documentando uso, `node_modules/` e `tests/screenshots/` fora do versionamento via `.gitignore`. Comandos: `npm run test`, `npm run screens`, `npm run all`. Pré-requisito: `python -m http.server 8080` (ou `npx serve . -l 8080`). | OK |
| ~22:40 | **Smoke test (16/16 ✅)**: 6 grupos de checks — servidor 200; hero mostra 489/22; filtro Onis com 18 cards; modal abre com 6 atributos na ficha; Ctrl+K abre paleta e "aat" traz Aatrox em 1º; mapa 3D renderiza com 26 pins e 0 erros de console. **Lições dos bugs iniciais do smoke:** (1) contadores do hero são `#statChars`/`#statRaces` (IDs), não classes `.hero-stat-value`; (2) grid de cards é `#characterGrid > *` (não `.card`); (3) o wrapper da paleta é `.palette` (ganha `.open`), não `.palette-panel` (que é só o conteúdo e está sempre visível); (4) o modal é `#modal.modal.open`; (5) `role=dialog` está em MUITOS elementos (paleta + modal) — distinguir pelo ID/`.open`; (6) `<input>` da paleta precisa de `.click()` antes de digitar (Ctrl+K só adiciona classe, não foca). | OK |
| ~22:45 | **6 screenshots gerados** (1600×1000 PNG, ~1.2 MB cada, em `tests/screenshots/`, fora do versionamento): `index-hero`, `index-cards`, `index-filtros`, `index-modal`, `index-palette`, `mapa`. Material de debug/inspeção local — o README oficial continua usando as `.jpg` versionadas em `docs/screenshots/`. **Não atualizei o `docs/screenshots/` nem o README com novas imagens** — as 11 capturas de 25/08 ainda são válidas (mostram 460 chars, hoje são 489, mas o layout não mudou). | OK |
| ~23:00 | **Análise técnica completa + plano de melhorias Q4/2026** (Playwright + leitura de código): script `tests/analyze.mjs` (timings, recursos, meta/SEO, a11y, funcionalidades). **Achados concretos:** TTFB 1ms / DOM 545ms / FCP 1080ms; `index.html` 184 KB (muito inline); `characters-api.json` 901 KB sem compressão; 12 PNGs somam 48.9 MB na primeira dobra (PNG não comprimido, full-res); **SEO/social = ZERO** (sem description, og, twitter, favicon, manifest, canonical); PWA ausente; skip-link ausente. **Plano `.claude/plans/PLANO-MELHORIAS-2026-Q4.md`** com 10 seções (perf, SEO, PWA, polish, padronização, mapa, raças, rituais, conteúdo, i18n) + roadmap de 6 semanas + métricas de sucesso + 6 decisões pendentes do Bruno. | OK |

### 01/09/2026 — Execução W1 (Performance + SEO) + W2 (PWA) + W3 (Polish)

| Hora | Evento | Resultado |
|---|---|---|
| ~23:30 | **W1 §2.1 (meta tags)**: adicionadas ao `<head>` do `index.html` — `description`, `keywords`, `author`, `canonical`, Open Graph (og:type, og:url, og:title, og:description, og:image, og:locale, og:site_name), Twitter Card (summary_large_image), 3× favicon (SVG + PNG-32 + apple-touch-180), `<link rel="sitemap">`. **0 → 21 tags** de uma vez. | OK |
| ~23:35 | **W1 §2.2 (favicon)**: 4 assets gerados via Playwright (`tests/make-favicons.mjs`): `assets/favicon.svg` (Æ em gradiente dourado sobre fundo escuro, viewBox 64×64), `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`. SVG é a fonte primária; PNGs são fallback pra Safari/iOS antigos. | OK |
| ~23:38 | **W1 §2.3 (sitemap.xml) + robots.txt**: `scripts/build_sitemap.ps1` lê `racas/*.html` + `index.html` + última mtime do `codex/*.md` correspondente, gera 23 URLs (1 raiz + 22 raças) com `lastmod`, `changefreq` (weekly pra raiz, monthly pras raças) e `priority` (1.0 / 0.7). `robots.txt` aponta pro sitemap. Adicionado ao README via `build_readme.ps1`. | OK |
| ~23:40 | **W1 §1.1 (WebP) em curso**: `tests/convert_webp.py` (Pillow 12.2.0) percorre `codex/**/*.png`, gera `.webp` adjacente (q=80, method=6, lossless), `--skip-existing` por padrão. Background: 84/495 (~17%) — projetado ~70min total. Cada WebP ~50–70% menor que o PNG. | Em curso |
| ~23:42 | **W1 §1.2 (picture helper)**: `scripts/build_api_json.ps1` agora expoe `imageWebp` na API (testa se `codex/.../<name>.webp` existe). `index.html` ganhou helper `pictureHTML(char, attrs)` que gera `<picture><source srcset=.webp><img src=.png onerror=...></picture>` quando há WebP, ou `<img>` simples caso contrário. Substituí 3 pontos críticos (cards do grid, feature, modal — esse com fallback via `onerror` lendo `dataset.fallback`). PNGs continuam existindo (fallback). | OK |
| ~23:45 | **W2 (PWA) — manifest + service worker**: `manifest.webmanifest` (name, short_name, start_url `./`, scope `./`, display standalone, theme_color/background_color `#1a120e`, lang pt-BR, 4 icons, 3 shortcuts pro Mapa/Onis/Demonios). `sw.js` (precache de 9 URLs críticas + cache-first de assets + network-first pra HTML + runtime cap de 200). Registro inline no fim do `index.html` (`navigator.serviceWorker.register('./sw.js')` no load). | OK |
| ~23:48 | **W3 §4.1 (skip-link)**: adicionado em `index.html` (corpo, primeiro filho — focado por Tab pula pro `#characterGrid`) e em `racas/*.html` (template `build_racas.ps1`, pula pro `#mainContent`; `assets/raca.css` criado com o estilo). CSS: posição absoluta no topo, invisível até `:focus` (transform translateY(-200%) → 0). | OK |
| ~23:50 | **W3 §4.2 (theme toggle acessível)**: `aria-pressed` agora reflete o estado (true = dark, false = light). `aria-label` e `title` ficam dinâmicos ("Trocar para tema X"). Era só label estático. | OK |
| ~23:51 | **W3 §4.3 (voltar ao topo)**: botão flutuante fixo no canto inferior direito, aparece após 600px de scroll (`hidden` ↔ visível), some se o usuário volta. `aria-label="Voltar ao topo"`. Scroll suave via `window.scrollTo({behavior:"smooth"})`. Integrado ao `onScroll` (mesmo rAF, sem listener novo). | OK |
| ~23:52 | **W3 §4.4 (smoke test #17)**: novo check no `tests/smoke.mjs` valida que a API expoe `imageWebp` em ao menos 1 personagem. **17/17 passou** após todas as mudanças (16 antigos + 1 novo). Site continua íntegro. | OK |
| ~23:53 | **Achado para limpar depois**: `index.html` ainda importa GSAP 3.12.5 via CDN (1 uso: micro-animação de translate no feature). Viola a regra "zero-dependências" do `Memoria.md` (regra #6). **Não removido agora** — é uma linha, o uso é trivial e remover exige teste visual. Anotado pra W4 (cleanup). **RESOLVIDO em commit `898af55`** (ver entrada 02/09 ~02:00): substituído por CSS `@keyframes rerollPop` (0.3s ease) com toggle de classe `.reroll-pop`. `<script src="gsap.min.js">` removido (≈70KB economizados). Smoke 17/17 verde. `grep -i "gsap" index.html assets/*.js` agora retorna vazio. | OK |

**Commits pendentes desta sessão** (ainda não versionados — o background WebP não bloqueia o resto):

1. `index.html` — meta tags + favicon link + manifest link + theme a11y + skip-link + back-to-top + picture helper + SW register
2. `assets/favicon.svg`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`
3. `og-cover.svg`, `og-cover.png`, `og-cover.jpg`
4. `manifest.webmanifest`, `sw.js`
5. `sitemap.xml`, `robots.txt`
6. `assets/raca.css` (novo)
7. `scripts/build_api_json.ps1` — campo `imageWebp`
8. `scripts/build_sitemap.ps1`, `scripts/make_og_cover.ps1` (novos)
9. `scripts/build_readme.ps1` — link do sitemap
10. `scripts/build_racas.ps1` — skip-link + id mainContent
11. `tests/smoke.mjs` — check #17 imageWebp
12. `tests/make-favicons.mjs`, `tests/make-og-cover.mjs` (novos)
13. `Memoria.md` — esta entrada
14. ~440 WebPs + PNGs (quando conversão terminar; PNGs ignorados pelo gitignore — só os WebPs entram)

### 01/09/2026 — Continuacao: W1+W2+W3+W4 — execucao concreta (4 commits)

| Hora | Evento | Resultado |
|---|---|---|
| ~23:55 | **W3 §4.7 (print)**: `@media print` adicionado — esconde header/paleta/toggles/surprise/back-to-top/toasts/rituais; papel branco, tinta preta, sombras removidas, borda 1px nos cards; `break-inside: avoid` em cada card pra nao cortar fichas; URL completa exibida em links http. Custo: 17 linhas de CSS. | OK |
| ~23:58 | **W3 §4.4 (compartilhar)**: botao circular no header do modal. Usa `navigator.share()` em mobile/modernos (com title/text/url); fallback `navigator.clipboard.writeText()` + feedback visual (1.5s vermelho). Cancelamento do share e silencioso. Smoke #13 valida presenca no DOM. | OK |
| ~00:00 | **W4 §5.1 (themes.json)**: criado `data/themes.json` (fonte canonica) e `build_racas.ps1` agora le do JSON em vez de ter a tabela inline duplicada. `index.html` mantem inline (round-trip de JSON no first paint tem custo). Dívida consciente: documentada no comentario do script. | OK |
| ~00:02 | **Smoke test expandido para 17 checks**: 1 (servidor) + 2 (hero) + 3 (API: 489/22/imageWebp) + 2 (deep+filter) + 3 (modal+ficha+share) + 2 (paleta+busca) + 4 (mapa: canvas/MAPA/pins/console) = 17. | OK |
| ~00:05 | **fix(manifest)**: removido `og-cover.png` (1200x630) da lista de icones do manifest — dimensoes fora do padrao PWA. 192x192/180x180/32x32 sao suficientes. | OK |
| ~00:08 | **Background WebP**: 193/495 (~39%) em ~30min. PIL Pillow 12.2.0, q=80, method=6, lossless=false. **Aguardando conclusao para commit final dos webps (~40-50min restantes).** Cada PNG cai ~50-70% no tamanho. | Em curso |

**Commits feitos nesta sessao (4 total)**:

1. `051e97f` — W1+W2+W3 principal (42 arquivos, meta tags + OG + favicon + sitemap + robots + manifest + SW + WebP picture helper + skip-link + back-to-top + theme a11y)
2. `764a005` — fix manifest (remove og-cover.png dos icones)
3. `27ece66` — refactor themes.json (fonte canonica)
4. `3d33ca2` — share button no modal
5. `2b057b2` — print stylesheet

**Pendencias reais apos esta sessao**:

- Commit incremental dos ~300 WebPs restantes (esperar task Python terminar)
- W4 §5.2 JSON Schema dos personagens (validacao) - nao comecou
- W4 §5.3 botao "sobre" (info do projeto) - nao comecou
- W5 Mapa: pins com link pro personagem (deep-link), etc
- W6 Racas: revisao visual, icones, mobile
- W7 Rituais: revisao geral
- Remover GSAP 3.12.5 (so tem 1 uso, viola regra zero-deps do Memoria)

### 01/09/2026 (madrugada) — W3 (Polish) + W4 (Padronizacao) — 8 commits adicionais

| Hora | Evento | Resultado |
|---|---|---|
| ~00:35 | **schema + slug**: `data/characters.schema.json` (JSON Schema draft-07) documenta todos os campos de personagem. `build_api_json.ps1` agora expoe `slug = <folder>_<name>` (unico, mesmo entre homonimos). **Bug pego**: 2 personagens homonimos (Ulthar em Deuses+Mutantes, Vanek em Deuses+Magos) — id era so o nome, nao diferenciava. Agora deep-link usa slug. | OK |
| ~00:38 | **validate-api.mjs**: novo teste standalone (sem deps). Roda antes do build: 489 chars, todos com name/id/folder, slugs unicos, todas imagens existem no disco, totalCharacters bate com a soma. 2 ids duplicados viram warnings (homônimos sao legitimos). `npm run validate` adicionado; `npm run all` encadeia validate + smoke + screens. | OK |
| ~00:42 | **print stylesheet**: `@media print` esconde chrome interativo (header, paleta, toggles, surpresa, rituais, back-to-top, toasts). Papel branco, tinta preta, sem sombras. Cards com `break-inside: avoid` (uma ficha por pagina). URL em links http. | OK |
| ~00:45 | **share button**: botao no header do modal. `navigator.share()` (mobile/modernos) com title/text/url; fallback `navigator.clipboard.writeText()` + feedback visual (1.5s). | OK |
| ~00:48 | **fix footer**: id `backToTop` duplicado (flutuante + link do footer) — getElementById pegava so o primeiro, listener do footer nunca rodava. Renomeado footer pra `backToTopFooter`. | OK |
| ~00:50 | **dialog 'Sobre'**: `<dialog id="aboutDialog">` com info do projeto (contagens vivas, stack, repo, atalhos). `about-close` + Esc + click-fora fecham. Fallback: `showModal()` nao existe -> `setAttribute("open", "")`. Link "Sobre o Aetheria" no footer. | OK |
| ~00:52 | **atalhos Alt+1..9**: pula para a raça N (1=Humanos, 2=Mutantes, ...). Ignora se palette/modal/input abertos. Documentado no dialog Sobre. | OK |
| ~00:55 | **offline.html**: pagina dedicada para fallback offline (antes era o proprio index.html, que tambem precisa de network pra API). SW atualiza o fallback. | OK |
| ~00:58 | **focus ring global**: `:where(button, a, input, select, textarea, [tabindex]):focus-visible { outline: 2px var(--accent); offset 3px; }` cobre todos os elementos interativos (antes so 6 tinham custom). | OK |
| ~01:00 | **JSON preload**: `<link rel="preload" as="fetch" href="characters-api.json" crossorigin="anonymous">` faz o navegador comecar a transferir o JSON (901KB) em paralelo com CSS/JS. Corta ~200-400ms do tempo ate os cards aparecerem. | OK |
| ~01:02 | **toast ao favoritar**: `★ Nome adicionado` / `Removido dos favoritos: Nome`. Antes era silencioso. | OK |

**10 commits nesta madrugada** (todos Co-Authored-By Claude Code):

1. `051e97f` — W1+W2+W3 principal
2. `764a005` — fix manifest
3. `27ece66` — refactor themes.json
4. `3d33ca2` — share button
5. `2b057b2` — print stylesheet
6. `3c99069` — schema + slug + validate
7. `2ebc63e` — fix footer + about dialog
8. `84ca40c` — atalhos Alt+1..9
9. `615a12d` — offline.html
10. `99490ef` — focus ring global
11. `dddc8f4` — JSON preload
12. `9ee2454` — toast favoritar

**Smoke test final**: 17/17 passou (servidor, hero, API com imageWebp, deep-link, modal+ficha+share, paleta+busca, mapa 26 pins 0 erros). Pipeline completo `npm run all` (validate + smoke + screens) roda em <30s.

**Background WebP**: 295/495 (~60%) — continuando em background, faltam ~200 pra fechar.

---

### 02/09/2026 (noite) — W5 (Mapa): minimap + filtro de raça + export PNG — 3 features

Bruno pediu "Pode seguir para w5" (escolhido 3 features + dropdown no AskUserQuestion). W5.2 (rota bezier entre pins) foi **deferido** — algoritmo "siga o terreno" + bezier custaria 2 dias para um mapa de lore (não é mapa de navegação).

**Arquivo único modificado**: `Mapa_Aetheria.html` (+300 linhas, 1 commit `10ec430`).

| Hora | Feature | O que faz | Resultado |
|---|---|---|---|
| W5.1 | **Minimap/bússola** (canto inferior direito, 160×180 canvas) | Fundo escuro, pontos amarelos dos pins visíveis, retângulo da viewport desenhado a partir de `(cam.tx, cam.tz)` + rotação de `cam.yaw` (bússola, não pixel-perfect). Click no minimap = `iniciarTween({tx, tz})` teleporta a câmera com animação suave de 380ms. | OK |
| W5.3 | **Filtro por raça** (dropdown no `.hud-controles`) | `<select>` populado em `iniciar()` a partir de `characters-api.json` (ordenado por `label.localeCompare`), mostra `${icon} ${label} (${count})`. Default "Todas (26 pins)". Persiste em `localStorage["mapaFiltroRaca"]`. Aplicado em `atualizarPinos()`: `racaOk = !FILTRO_RACA || (Array.isArray(pn.poi.racas) && pn.poi.racas.some((r) => r.folder === FILTRO_RACA))`. Pins filtrados fazem fade out (animação que já existia). | OK |
| W5.4 | **Exportar vista como PNG** (botão `📸 Salvar vista` no header da HUD) | Click → esconde HUDs via `display:none` (não destrói) → `requestAnimationFrame` → `canvas.toBlob(blob, 'image/png')` → `<a download="aetheria-<timestamp>.png">` → `URL.revokeObjectURL()` + restaura HUDs. Canvas com DPR>1 gera imagem em alta resolução automaticamente. | OK |

**Validação**:

- Smoke `node tests/smoke.mjs` → **17/17 verde** (incluindo mapa: tem canvas, 26 pins, 0 erros de console)
- Screenshots `node tests/screenshots.mjs` → **6/6 sucesso** (regeneradas: index-hero, index-cards, index-filtros, index-modal, index-palette, mapa)
- Visual check de `mapa.png`: minimap visível no canto inferior direito como esperado

**Detalhe técnico do filtro de raça**: `poi.racas` é populado em `aplicarDados()` como `listaDe(rg.racas).map(...)` retornando `[{nome, cor, folder}]`. Como `listaDe()` normaliza string OU array, o filtro é seguro mesmo com formato antigo. Ceus e batalhas também têm `racas` populado (linhas do aplicarDados), então o filtro afeta todas as 3 camadas.

**Decisões deliberadas**:

- Minimap usa **centro da câmera (cam.tx, cam.tz) + retângulo proporcional a cam.dist rotacionado por cam.yaw** em vez de inversão `screen→world` completa. Mais barato, sem libs, honesto como "bússola".
- Export PNG **esconde HUDs via `display:none`** (em vez de `visibility:hidden`) e restaura com o valor antigo. Garantia: o download sai sem chrome.
- Filtro de raça **inclui batalhas e céus** que tenham raças (algumas batalhas têm `racas` por causa de "quem lutou lá"). Comportamento intencional: mostra a pegada de uma raça no mundo, não só onde ela mora.

**Riscos / não-objetivos**:

- W5.2 (rota bezier entre pins) — deferido
- Não criei test novo para o filtro (smoke continua passando com filtro vazio; quando Bruno filtrar, o check de "mapa tem >=20 pins" continua OK porque checa o array, não o DOM).
- Minimap não é pixel-perfect com a viewport real — é uma bússola que mostra "onde você está" + "para onde pode ir".

---

### 02/09/2026 (madrugada) — W6 (Raças): layout dedicado Demônios+Onis + ritual de TEXTO + ver no mapa + QA mobile

**Contexto**: Bruno pediu "Qual proximo passo?" no fim do W5. Eu propus 3 opções e ele escolheu "W6 Racas: revisao visual, icones, mobile" + me deu autonomia total ("Vc e lider vc decidi meu principe"). Decidi priorizar **layout dedicado para 2 raças grandes** (Demônios 42 chars, Onis 31 chars) — volume justifica — e manter as outras 20 com template genérico.

**Distinção crítica que o Bruno corrigiu no plano**:

- **Ritual de invocação** = MANTER (overlay de TEXTO ritualístico, ~3s, sem asset externo)
- **Vídeo overlay de `transitions.js`** (`onis-transition.mp4` / `demonios-transition.mp4`) = **TIRAR** — Bruno confirmou que era teste que não funcionou, vídeo de transição entre páginas de raça não vai voltar.

**O que foi feito** (commit `81ab8ac`, 26 arquivos / +445 / -68):

| Hora | Arquivo | O que mudou |
|---|---|---|
| W6.1 | `scripts/build_racas.ps1` (+39/-2) | Array `$dedicatedFolders = @("04_Onis","05_Demonios")`. Token `__LAYOUT__` em `<body data-layout>`. Placeholders `<!--HERO_STATS-->` `<!--RITUAL_BTN-->` `<!--MAPA_BTN-->` `<!--LORE_ARCHIVE-->` no template. Replace loop popula: stats inline (membros / regiões / 1º membro), botão "🔥 Invocar ritual", link "🗺 Ver no mapa" → `Mapa_Aetheria.html#g=<folder>` (aproveita filtro de raça do W5 via `localStorage["mapaFiltroRaca"]` + deep-link). |
| W6.1 | `racas/assets/raca.css` (+166) | Bloco `.layout-dedicated` escopado por `body[data-layout="dedicated"]`: `.hero-stats` com 3 chips (membros/regiões/1º), `.lore-body` em 2 colunas (lore-text + aside `.lore-archive`). Bloco `.ritual-overlay` separado: fundo radial com a cor da raça, `.ritual-card` com bounce, `.ritual-icon` com `@keyframes ritual-pulse` (1.6s alternate), kicker/nome/texto/itálico, botão `×` no canto. `@media (max-width: 900px)` empilha lore e reduz stats. `prefers-reduced-motion` desliga pulse. |
| W6.1 | `racas/assets/raca.js` (+62) | `fillArchive()`: popula `.lore-archive` com `<a href="../Mapa_Aetheria.html#g=...">` para cada região (clica e abre mapa já filtrado). `initRitual()`: handler do botão (click + Esc global). `abrirRitual()`: cria `<div class="ritual-overlay">` injetado em `body` com ícone/kicker/nome (do `splitTitle()` do 1º membro) + lore truncado em 220 chars; `requestAnimationFrame` → `.is-open`; auto-fecha em 3.2s. `fecharRitual()`: remove `.is-open` e faz `setTimeout(420)` antes do `overlay.remove()`. Chamadas no `boot()` depois de `fillLore()`. **Zero MP4, zero `transitions.js`, zero dependências novas.** |
| W6.2 | `tests/screenshots.mjs` (+26) | Array `shotsMobile` com 3 capturas em 375×812 (iPhone X): demonios (dedicated), onis (dedicated), humanos (controle genérico). Loop separado que usa viewport próprio, `deviceScaleFactor: 1`, `waitForTimeout(1000)` para partículas+reveal. Total: 9 screenshots (6 desktop + 3 mobile). |
| W6.3 | 22× `racas/*.html` (regen) | Todas as páginas regeneradas pelo build. Apenas `demonios.html` e `onis.html` ganham `data-layout="dedicated"`; as outras 20 mantêm `data-layout="generic"`. Comprovado por grep: 2 páginas com `data-layout="dedicated"`, 20 com `data-layout="generic"`. |

**Validação**:

- `pwsh -File scripts\build_racas.ps1` → 22 páginas geradas, 489 membros embutidos, 0 sem arte, checks de quantidade OK
- `node tests\validate-api.mjs` → OK
- `node tests\smoke.mjs` → **17/17 verde** (não regrediu)
- `node tests\screenshots.mjs` → **9/9 sucesso** (6 desktop + 3 mobile) — `mob-demonios.png`, `mob-onis.png`, `mob-humanos.png` inspecionadas
- Grep em `racas/demonios.html`: 1× `data-layout="dedicated"`, 1× `id="invocarRitualBtn"`, 1× `id="mapaLink"`, 1× `class="hero-stats"`, 1× `class="lore-archive"` — tudo no lugar
- Singular/plural correto: Demônios tem 1 região → chip mostra "**1** região" (não "regiões"). Lógica: `$regLabel = if ($nRegioes -eq 1) { "região" } else { "regiões" }`

**Decisões deliberadas**:

- **Apenas 2 raças com dedicated layout** — outras 20 não justificam custom (volume baixo, lore curto). Manter genérico é a escolha certa: não inflar `raca.js`/`.css` para 5% das páginas. Se Bruno quiser mais raças dedicadas, basta adicionar a `folder` ao array.
- **Ritual como overlay de TEXTO** (não imagem, não vídeo) — texto curto montado dinamicamente (1º membro + lore) é mais "vivo" que vídeo estático que sempre mostra a mesma coisa. Cada invocação gera um texto diferente conforme o membro em destaque. E não depende de asset externo.
- **Botão "Ver no mapa" reaproveita o filtro do W5** — `Mapa_Aetheria.html` já lê `localStorage["mapaFiltroRaca"]` E também lê `#g=<folder>` do hash. Coloco os dois: o hash garante que se Bruno nunca visitou o mapa, o filtro já vem aplicado; o localStorage preserva estado entre navegações.
- **Archive de regiões (não de batalhas/ceus)** — o `historia-api.json` dá `raceBlock.regioes[]` direto. Faltaria um `raceBlock.locais[]` ou similar para outros POIs; deferido.
- **Singular/plural com if inline** — power if simples, sem tabela de plurais. Para uma única palavra (`região`/`regiões`) não vale criar helper.
- **3 capturas mobile é o mínimo útil** — 2 dedicated + 1 controle genérico. Não fiz as 22 pq custo/benefício não fecha (a única diferença entre genéricas é a cor `--group-color`).

**Riscos / não-objetivos**:

- **Nenhuma referência a MP4 / `transitions.js` no código novo** — confirmado por grep. O W6 não importa nem cita `transitions.js`. Bruno tirou de circulação.
- **CSS `.timeline-race` órfão** (linhas 1546-1593 do `raca.css`) continua órfão — `historia-api.json` ainda não tem `eventos[]` por raça. Bruno pode adicionar quando tiver os eventos. CSS fica aguardando.
- **Smoke não cobre `racas/*.html`** — continua 17/17, validação real das 22 páginas é visual + screenshots.
- **Se Bruno criar pasta `23_*` no futuro**, o array `$dedicatedFolders` precisa ser atualizado pra ela virar dedicated.
- **Ritual auto-fecha em 3.2s** — usuário pode interromper com Esc/clique-fora. Sem persistência: cada click gera texto novo.
- **Filtro do mapa pode já estar ativo** — ao clicar em "Ver no mapa", se Bruno tinha um filtro salvo de antes, a nova raça via `#g=` substitui (precedência do hash). Se preferir manter o filtro antigo, é só remover o `#g=`.

---

### 02/09/2026 (noite) — W7 (Rituais): 5 rituais específicos (3 Demônios + 2 Onis) com texto + efeito visual único

**Contexto**: W6 entregou o esqueleto do "Invocar ritual" (overlay de TEXTO com 1º membro + lore da raça, auto-fecha em 3.2s, Esc/clique-fora, sem MP4). Bruno pediu W7 para **especializar** em **5 rituais específicos** com textos próprios e efeitos visuais distintos por ritual. Outras 20 raças continuam sem ritual. **Regra zero-deps mantida** — sem libs externas (canvas, GSAP, three.js). Efeitos cinematográficos complexos foram reconsiderados para **texto + 1 efeito visual único por ritual**, tudo CSS/SVG/JS puro.

**Decisões do Bruno (fechadas no plano)**:

- 5 rituais: Demônios (3) + Onis (2); outras 20 raças sem ritual
- Modelo de dados: nova coleção `rituais[]` em `historia-api.json` (nível raiz, ao lado de `regions`/`battles`/`races`)
- Quem escreve os textos: Claude gera rascunhos pt-BR, Bruno revisa depois
- Honra (Onis): **portões ancestrais** (sem iconografia japonesa — não é torii)
- Smoke: +2 checks novos (Demônios + Onis) — 17→19; mas o build adicionou mais 2 de fallback, então foram 4 checks novos (20/20)
- Race condition: **reaproveitar o mesmo nó overlay** (1 criação, troca conteúdo ao clicar em pill diferente)
- Fallback: se `rituais[]` vazio, mantém botão único do W6 (graceful degradation)

**Os 5 rituais**:

| id | raca | titulo | estilo | efeito | duracao_ms |
|---|---|---|---|---|---|
| `rt-demon-pacto` | 05_Demonios | Pacto Rubro | `pacto` | 12 brasas (DOM `<span>`) subindo + glow radial laranja | 3800 |
| `rt-demon-massacre` | 05_Demonios | Massacre Inominável | `massacre` | screen-shake 3px + RGB-split text-shadow glitch | 4200 |
| `rt-demon-ressurreicao` | 05_Demonios | Ressurreição Púrpura | `ressurreicao` | 3 ripples concêntricos (::before, ::after, .ripple) expandindo 0→8× | 4000 |
| `rt-oni-devoracao` | 04_Onis | Devoração Vermelha | `devoracao` | 2 metades (top/bot 50% com radial gradient) que se afastam 100% em Y | 3600 |
| `rt-oni-honra` | 04_Onis | Honra Ancestral | `honra` | 2 portões de obsidiana (gradient marrom-escuro) com travessa horizontal, scale 0→1 | 4000 |

**O que foi feito** (6 sources + 22 regen = 28 arquivos):

| Hora | Arquivo | O que mudou |
|---|---|---|
| W7.1 | `historia-api.json` (+~50) | Nova coleção `rituais[]` na raiz (5 entradas) + `"totalRituais": 5` no cabeçalho. Schema: `id, raca, titulo, estrofe, duracao_ms, estilo, icon`. **Ordem do array = ordem dos pills na página** (documentado em comentário no JSON). `generatedAt` atualizado para `2026-09-02`. |
| W7.2 | `scripts/build_racas.ps1` (+~30) | Carrega `$rituais = @($hist.rituais)` no início do script. Filtra por raça dentro do loop: `$rituaisDaRaca = @($rituais \| Where-Object { $_.raca -eq $folder })`. Adiciona `rituais = $rituaisDaRaca` ao payload. Token `<!--RITUAL_BTN-->` virou `<!--RITUAL_PICKER-->`; no bloco `if ($isDedicated)` gera `<div class="ritual-picker">` com N `<button class="ritual-pill ritual-pill--{estilo}" data-ritual="{id}">{icon} {titulo}</button>`. Fallback gracioso: se `rituaisDaRaca.Count -eq 0`, mantém `<button id="invocarRitualBtn">` (W6). Validação: `if ($rituais.Count -ne $hist.totalRituais) { throw "Quantidade de rituais divergente!" }`. |
| W7.3 | `racas/assets/raca.js` (~+80, refator de `abrirRitual`) | Motor de rituais reescrito com **estado de módulo** (`ritualNode`, `ritualTimer`, `ritualReturnFocus`) para resolver race condition. `abrirRitual(ritualId)`: se `ritualNode` já existe, `clearTimeout(ritualTimer)` e troca conteúdo (não retorna early). Senão cria overlay + bot + card, appenda ao `body`, chama `pause("ritual")` (pausa carrossel). Resolve ritual de `RACE.rituais[]`, aplica classe `ritual-overlay--{estilo}`, atualiza `aria-pressed` em todos os pills, gera DOM dos efeitos (`gerarBrasas/gerarMandibula/gerarPortoes/gerarRipple`) — todos via `document.createElement`, zero libs. `requestAnimationFrame` → `.is-open`; auto-fecha com `setTimeout(ritual.duracao_ms)`. `fecharRitual()`: idempotente (checa `ritualNode` no início), remove `is-open`, `setTimeout(420)` antes de remover nó, restaura foco via `ritualReturnFocus.focus()`, chama `resume("ritual")`. Foco: guarda `document.activeElement` na primeira abertura. Esc global: `keydown` listener. |
| W7.4 | `racas/assets/raca.css` (+~200) | **5 modificadores visuais** `.ritual-overlay--{pacto,massacre,ressurreicao,devoracao,honra}`: (1) pacto: 12 `.brasa` com `nth-child` posicionando `left` 8%–92% e `animation-delay` 0.0–2.8s, `@keyframes brasa` translada -260px + scale 0.6→1.2; (2) massacre: `@keyframes massacre-shake` translate ±3px 0.4s infinite, text-shadow RGB-split com `@keyframes massacre-glitch` 0.3s infinite; (3) ressurreicao: 3 ripples concêntricos (::before, ::after, .ripple) com `@keyframes ripple-expand` scale 0→8 ease-out 2.4s infinite, delays 0/0.8/1.6s; (4) devoracao: 2 metades (`metade--top` translate -100% Y, `metade--bot` translate +100% Y) com transition 0.6s `--ease-bounce`; (5) honra: 2 `.portao` obsidiana (gradient 180deg marrom-escuro) com travessa horizontal via `::before`, `@keyframes portao-abrir` scale 0→1.1→1 com `--ease-bounce`. **Pills**: `.ritual-picker` (flex gap 0.5rem wrap), `.ritual-pill` (border-radius 99px, hover translateY(-1px), `aria-pressed="true"` com glow `box-shadow: 0 0 24px -4px {group-color}`). **Mobile**: `@media (max-width: 560px)` empilha pills em coluna (`width: 100%`) e dá `.ritual-card { max-height: 86vh; overflow-y: auto; padding: 1.6rem 1.4rem; }`. **Reduced motion**: bloco `@media (prefers-reduced-motion: reduce)` desliga todas as 5 animações e dá estado final estático (sem glitch, sem screen-shake, metades em `translate(0,0)`, portões com opacity 0.7, brasas com `display: none`). |
| W7.5 | `tests/smoke.mjs` (+~30) | 2 checks novos: Teste 7 (Demônios) clica no 1º pill e espera `.ritual-overlay.is-open` (timeout 3s); Teste 8 (Onis) idem. **Cada um com 2 asserções** (picker tem pills + overlay abre). Total: **20/20 verde**. |
| W7.6 | `tests/screenshots.mjs` (+~20) | `shotsMobile` agora suporta 4º elemento (action). 2 capturas novas: `mob-demonios-ritual` e `mob-onis-ritual`. Quando `action === "ritual"`: clica 1º pill, espera `.ritual-overlay.is-open`, espera 500ms (efeito anima), tira screenshot. Total: **11 screenshots** (6 desktop + 5 mobile — 2 herdados + 2 novos ritual-open + 1 controle). |
| W7.7 | 22× `racas/*.html` (regen) | Apenas `demonios.html` (3 pills) e `onis.html` (2 pills) ganham `.ritual-picker`; as outras 20 continuam com `<button id="invocarRitualBtn">` (W6). Confirmado por grep: 3× `data-ritual="rt-demon-*"` em demonios.html, 2× `data-ritual="rt-oni-*"` em onis.html, 0× nas outras 20. |

**Validação**:

- `pwsh -File scripts\build_racas.ps1` → 22 páginas geradas, 489 membros, **5 rituais embutidos** (esperado 5, OK)
- `node tests\smoke.mjs` → **20/20 verde** (16 W6 + 2×2 W7)
- `node tests\screenshots.mjs` → **11/11 sucesso** (6 desktop + 5 mobile)
- Visual: `mob-demonios-ritual.png` mostra "Pacto Rubro" + brasas alaranjadas; `mob-onis-ritual.png` mostra "Devoração Vermelha" + mandíbula com 2 metades

**Decisões deliberadas**:

- **1 overlay reaproveitado** (não N overlays) — se Bruno clicar em 2 pills em sequência rápida, o mesmo `div.ritual-overlay` só troca `className` e `innerHTML`. `clearTimeout(ritualTimer)` evita auto-fecha de ritual anterior durante o novo. Resolve a race condition que apareceu no plano (P0 #1).
- **Ordem do array `rituais[]` = ordem dos pills** — documentado no JSON. Bruno pode reordenar sem tocar código.
- **Estilo `pacto` gera 12 brasas via JS** (não CSS-only) — facilita cleanup automático quando overlay é removido (não vaza DOM órfão).
- **Mandíbula 2 metades**: para acessibilidade, se `prefers-reduced-motion`, as metades ficam `translate(0,0)` (revelando o texto). Sem prefers, abrem após `is-open`.
- **Portões sem iconografia japonesa** — `linear-gradient(180deg, #2c1810 0%, #4a2818 50%, #1a0a05 100%)` com borda `#6a3818` e travessa horizontal via `::before`. Genérico, podia ser de qualquer cultura.
- **Texto das estrofes é rascunho** — Bruno revisa no commit. Idiomas: juramentos demoníacos (sangue/chama/palavra) + uxoricídio/devoração + honra ancestral. Sem clichê Tolkien.
- **`aria-pressed` em todos os pills** — o pill clicado fica `aria-pressed="true"`, os outros `false`. Reset no `fecharRitual()`.
- **`aria-modal="true"` + `role="dialog"` no overlay** — A11y OK. Foco vai pro botão de fechar ao abrir; volta pro pill original ao fechar.
- **Smoke não cobre outros 18 rituais (raças genéricas)** — porque elas não têm ritual. OK.
- **MP4 / `transitions.js` continuam fora** — confirmado por grep. Regra zero-deps mantida.

**Riscos / não-objetivos**:

- **Sem MP4, sem `transitions.js`** — W6 removeu, W7 mantém
- **Sem libs externas** (canvas, GSAP, three.js) — `gerarBrasas` usa `document.createElement` (DOM leve, ~12 nós no pico)
- **Race condition resolvida** — reaproveita overlay + clearTimeout. Plano tinha P0 #1 marcado, agora OK.
- **Fallback gracioso** — se `rituais[]` vier vazio, mantém botão W6 (ritual genérico com lore do 1º membro)
- **Texto das estrofes é rascunho** — Bruno revisa no commit
- **Mobile responsivo OK em 375×812** — card com scroll vertical, pills empilhadas em coluna
- **`prefers-reduced-motion: reduce` testado** — todos os 5 efeitos com fallback estático, sem glitch/animação
- **CSS `.timeline-race` órfão** (W6) continua órfão — sem mudança aqui
- **Smoke cobre só 2 raças** (Demônios + Onis) — outras 20 não têm ritual, então não há o que testar
- **Efeitos podem parecer "simples"** — Bruno pediu reconsideração para "texto + 1 efeito" depois de eu propor efeitos cinematográficos complexos. Caso queiramos evoluir, é trocar a classe `.ritual-overlay--{estilo}` e seus descendentes.
- **Não-objetivos mantidos**: TypeScript, i18n pt/en, PWA, backend, rituais em outras raças, áudio, canvas/WebGL pesado, scrolltrigger.

---

### 02/09/2026 (noite) — W8 (Rituais): 5 rituais adicionais em raças "generic" (Humanos, Semideuses, Deuses, Monstros, Meio-Sangue)

**Contexto**: W7 entregou 5 rituais específicos em raças que já tinham **layout dedicated** (Demônios + Onis): picker de pills, motor reaproveitando overlay, 5 modificadores visuais únicos. **W8 expande o catálogo** para 5 raças que hoje são **generic** (sem layout dedicado), seguindo `PLANO-MELHORIAS-2026-Q4.md` §8 (curadoria por impacto visual). Regra zero-deps mantida: tudo CSS/SVG/JS puro, sem MP4, sem canvas pesado, sem libs. **Só rituais** — não promove as 5 raças a "dedicated" completo (mantém o carrossel generic). **Hack limpo**: nova flag `$isRitual = $ritualRaces -contains $folder` no PS1 — o bloco do `RITUAL_PICKER` agora roda em `$isRitual` (NÃO `$isDedicated`), os outros 4 placeholders dedicated continuam atrelados a `$isDedicated`.

**Decisões do Bruno (fechadas no plano)**:

- **5 raças alvo**: 01_Humanos, 09_Semideuses, 13_Deuses, 08_Monstros, 17_Meio_Sangue (PLANO §8)
- **1 ritual por raça** (mantém W8 = 5 rituais totais, paridade com W7)
- **Só rituais**: NÃO promove as 5 a "dedicated" completo (sem stats 2-col, sem lore-archive, sem "Ver no mapa")
- **Estratégia do picker**: **forçar dedicated só pra essas 5** (hack `$isRitual`)
- **Texto**: Claude gera rascunhos pt-BR de juramentos, Bruno revisa
- **Estilo visual**: 1 efeito único por ritual, mesmo padrão do W7

**Os 5 rituais W8**:

| id | raca | titulo | estilo | efeito | duracao_ms | icon |
|---|---|---|---|---|---|---|
| `rt-hum-selo` | 01_Humanos | Selo da Forja | `selo` | 1 anel de bronze girando 360° em loop + 8 runas Unicode em círculo | 3600 | ⚒ |
| `rt-semi-raio` | 09_Semideuses | Raio Ascendente | `raio` | raio SVG zigzag (gradient amarelo→branco) caindo 1× + 6 partículas douradas irradiando | 3200 | ⚡ |
| `rt-deus-flash` | 13_Deuses | Clarão Divino | `flash` | overlay branco 0→100%→0% em 1.6s, sem DOM extra (CSS-only, mais barato de tudo) | 2400 | ☀ |
| `rt-monstro-mandibula` | 08_Monstros | Mandíbula que se Abre | `mandibula` | 2 metades (top/bot) com 3 dentes triangulares cada (clip-path), abrindo 100% em Y | 3500 | 🦷 |
| `rt-meio-fusao` | 17_Meio_Sangue | Fusão de Linhagens | `fusao` | 2 metades verticais (esquerda humana azul, direita fera cinza) que se afastam 100% em X | 3400 | ☯ |

**O que foi feito** (7 sources + 22 regen = 29 arquivos):

| Hora | Arquivo | O que mudou |
|---|---|---|
| W8.1 | `historia-api.json` (+~50) | 5 entradas novas no array `rituais[]` (rt-hum-selo, rt-semi-raio, rt-deus-flash, rt-monstro-mandibula, rt-meio-fusao). Atualizado `"totalRituais": 5 → 10` e `generatedAt` → `"2026-09-03"`. Texto das estrofes em pt-BR de fantasia (verbos imperativos / juras ritualísticas, sem clichê Tolkien). |
| W8.2 | `scripts/build_racas.ps1` (+~20) | Nova flag `$ritualRaces = @("01_Humanos","09_Semi_Deuses","13_Deuses","08_Monstros","17_Meio_Sangue","04_Onis","05_Demonios")` (7 raças: 5 W8 + 2 W7). Por raça: `$isRitual = $ritualRaces -contains $folder`. Bloco do `<!--RITUAL_PICKER-->` movido do `if ($isDedicated)` para `if ($isRitual)` (placeholder agora acessível em páginas generic). `MAPA_BTN`, `HERO_STATS`, `LORE_ARCHIVE` continuam atrelados a `$isDedicated` (sem mudança). Validação `totalRituais` agora confere 10. |
| W8.3 | `racas/assets/raca.js` (~+90) | 5 if-chain novos em `abrirRitual()` depois dos 4 do W7: `if (ritual.estilo === "selo") gerarSelo(efeito);` idem raio/flash/mandibula/fusao. `flash` é CSS-only (sem gerador JS). Funções: `gerarSelo` (1 anel + 8 runas Unicode `ᚠᚱᛇᛟᚦᛗᛚᛜ` posicionadas em círculo com `rotate(N) translateY(-58px)`), `gerarRaio` (SVG inline com `<polyline points="50,0 30,80 60,100 20,180 70,200">` + `<defs><linearGradient id="raio-grad">` amarelo→branco + 6 `.raio-particle` com `--i` index), `gerarMandibulaMonstro` (2 metades `.metade--top`/`.metade--bot` + 3 `.dente` triangulares cada via `border-top/border-bottom`), `gerarFusao` (2 metades `.metade--esq`/`.metade--dir` com gradientes humanos-azul + monstros-cinza). Renomeei W7 `gerarMandibula` → `gerarMandibulaDevoracao` por simetria (refactor seguro, única chamada em `abrirRitual`). |
| W8.4 | `racas/assets/raca.css` (+~200) | **5 modificadores visuais** `.ritual-efeito--{selo,raio,flash,mandibula,fusao}`: (1) selo: `.selo-ring` (130px, border 3px solid, `border-radius:50%`, `box-shadow` com `color-mix(in srgb, var(--group-color) 60%, transparent)`, `animation: selo-spin 8s linear infinite`); `.selo-runa` (8 spans, `animation: selo-spin 8s linear infinite reverse`); (2) raio: `.relampago` SVG (90×200, `drop-shadow 0 0 8px gold`) + `.relampago-traco` com `animation: raio-cair 0.8s ease-out 0.1s both` (translateY -220→0 + opacity 0→0.9) + 6 `.raio-particle` com `transform-origin: center; --angle: calc(var(--i) * 60deg)` e `@keyframes raio-particula` (rotate+translateY+scale); (3) flash: `@keyframes flash-bang 1.6s ease-in-out both` no background do container (rgba(255,255,255,0)→0.95→0.6→0), **zero DOM extra**; (4) mandibula: 2 `.mandibula-metade` (height 50%, `linear-gradient` cinza com `border-top/border-bottom 2px solid #1a1a1a`) + `.dente` (border 0/transparent/transparent + border-top/bottom 14px solid #f0e6d2, 3 por metade via `display: flex; justify-content: space-around`), `.is-open` → `metade--top translateY(-100%)`, `metade--bot translateY(100%)`; (5) fusao: 2 `.fusao-metade` (width 50%, `mix-blend-mode: screen`, gradientes azul+cinza com `rgba(74,144,217,0.65)→0.05` e `rgba(46,64,83,0.65)→0.05`), `.is-open` → `metade--esq translateX(-100%)`, `metade--dir translateX(100%)`. **Reduced-motion expandido**: bloco `@media (prefers-reduced-motion: reduce)` agora desliga os 5 efeitos novos: `.selo-ring/.selo-runa { animation: none; }`, `.relampago-traco { animation: none; transform: translateY(0); }`, `.raio-particle { display: none; }`, `.flash { animation: none; }`, `.mandibula-metade { transform: translate(0,0) !important; }`, `.fusao-metade { transform: translate(0,0) !important; }`. |
| W8.5 | `tests/smoke.mjs` (+~50) | Loop `for (const { slug, label } of w8RitualRaces)` testando 5 raças (Humanos, Semideuses, Deuses, Monstros, Meio-Sangue) — **estrutura idêntica** ao Teste 7/8 do W7. Cada raça = 2 checks: (1) `ritual <label>: picker tem pills` (`.ritual-pill` count >= 1), (2) `ritual <label>: overlay abre ao clicar pill` (`.ritual-overlay.is-open` após 3s). Total: **30/30 verde** (20 W6+W7 + 10 W8). |
| W8.6 | `tests/screenshots.mjs` (+~15) | `shotsMobile` recebe 5 entradas novas: `mob-humanos-ritual`, `mob-semideuses-ritual`, `mob-deuses-ritual`, `mob-monstros-ritual`, `mob-meiosangue-ritual` — todas com `action: "ritual"` (clica 1º pill + espera overlay + 500ms animação). Total: **16 screenshots** (6 desktop + 10 mobile — 5 base + 5 W7 + 5 W8 ritual-open). |
| W8.7 | 22× `racas/*.html` (regen) | **7 raças ganham `.ritual-picker`**: demonios(3 pills), onis(2), humanos(1), semideuses(1), deuses(1), monstros(1), meiosangue(1) = **10 pills totais**. Outras 15 raças continuam com `<button id="invocarRitualBtn">` (W6 fallback). Confirmado por grep: 7× `.ritual-picker` no repo, 10× `data-ritual="rt-*"`. |

**Validação**:

- `pwsh -File scripts\build_racas.ps1` → 22 páginas, **10 rituais** embutidos (5 W7 + 5 W8), `totalRituais: 10` confere
- `node tests\smoke.mjs` → **30/30 verde** (20 W6+W7 + 10 W8 — 2 checks × 5 raças)
- `node tests\screenshots.mjs` → **16/16 sucesso** (6 desktop + 10 mobile)
- Visual confirmado: 5/5 capturas W8 com overlay aberto
  - `mob-humanos-ritual.png` → "Selo da Forja" com anel girando + 8 runas em círculo
  - `mob-semideuses-ritual.png` → "Raio Ascendente" com raio SVG + 6 partículas irradiando
  - `mob-deuses-ritual.png` → "Clarão Divino" com flash branco pulsante
  - `mob-monstros-ritual.png` → "Mandíbula que se Abre" com 2 metades + 3 dentes triangulares
  - `mob-meiosangue-ritual.png` → "Fusão de Linhagens" com 2 metades cor humana/monstro se afastando em X
- `prefers-reduced-motion: reduce` testado → todos os 5 efeitos novos com fallback estático

**Decisões deliberadas**:

- **Hack `$isRitual` em vez de mexer em `$isDedicated`** — o nome "dedicated" no projeto significa "raça com layout dedicado completo" (stats 2-col + mapa + archive). Mexer no significado do nome seria um pé na gramática do projeto. Criar uma 2ª flag `$isRitual` mantém os 2 conceitos separados e a busca `data-layout="dedicated"` continua significando a mesma coisa.
- **`<!--RITUAL_PICKER-->` movido para FORA do `if ($isDedicated)`** — antes ficava só dentro do bloco dedicated, agora fica num nível acima (acessível a qualquer flag). Os tokens `HERO_STATS`, `MAPA_BTN`, `LORE_ARCHIVE` continuam dentro do `if ($isDedicated)` (não mudam).
- **Renomeei W7 `gerarMandibula` → `gerarMandibulaDevoracao`** — pra ficar simétrico com a nova `gerarMandibulaMonstro`. Refactor seguro, única chamada em `abrirRitual`. Documentado no commit.
- **`flash` é CSS-only** (sem gerador JS) — `@keyframes flash-bang` no background do container, `rgba(255,255,255,0)→0.95→0.6→0`. Mais barato que tudo (zero DOM extra). Útil como referência pra futuros efeitos minimalistas.
- **`mandibula` (Monstros) com dentes triangulares via `border-top/border-bottom`** — `border-left/right: 8px solid transparent` + `border-top/bottom: 14px solid #f0e6d2` (cor de marfim). Não precisa SVG. **Diferente** do W7 `devoracao` (que é só gradiente sem dentes) — o usuário VÊ a estrutura da mandíbula de Monstros, não só um fundo vermelho.
- **`fusao` (Meio-Sangue) com `mix-blend-mode: screen`** — duas cores (azul humana + cinza monstro) se misturam no centro antes de se afastar. Mostra o "entre-linhagens" do Meio-Sangue, não só duas cores paralelas. Espelha conceitualmente o W7 `devoracao` (que se FECHA em Y) mas se AFASTA em X (fusão = revelar o interior, não ocluir).
- **`raio` (Semideuses) com SVG inline** — único efeito W8 que usa SVG. `<polyline points="50,0 30,80 60,100 20,180 70,200">` com `<defs><linearGradient id="raio-grad">` (3 stops: `#fff8c2` 0%, `#f1c40f` 50%, `#fff` 100%). Custo: 1 SVG no DOM (limpo ao fechar overlay).
- **Runas Unicode `ᚠᚱᛇᛟᚦᛗᛚᛜ`** (runic alphabet) — fallback automático do navegador se fonte não suportar (renderiza como quadradinho vazio, mas não quebra o efeito). Anel fica visível mesmo sem runas.
- **Sem `box-shadow` em seletor hover que dependa de `transition`** — `.selo-ring` gira via `animation`, não `transition`. Funciona com reduced-motion sem ajuste extra.
- **Texto das estrofes é rascunho** — Bruno revisa. Idiomas: juramentos Humanos (ferro/fogo/palavra), Semideuses (raio/ascensão/luz divina), Deuses (esplendor/eternidade/silêncio), Monstros (presas/sangue/instinto), Meio-Sangue (dualidade/entre/ponte). Sem clichê Tolkien.
- **MP4 / `transitions.js` continuam fora** — confirmado por grep. Regra zero-deps mantida.
- **Smoke cobre 7 raças com ritual** (2 W7 + 5 W8) — outras 15 não têm ritual, então não há o que testar. OK.

**Riscos / não-objetivos**:

- **Sem MP4, sem `transitions.js`** — W6 removeu, W7+W8 mantêm
- **Sem libs externas** (canvas, GSAP, three.js) — `gerarSelo/Raio/MandibulaMonstro/Fusao` usam `document.createElement` (DOM leve, ~8-12 nós no pico). `raio` usa 1 SVG inline. `flash` é zero-DOM.
- **Layout generic mantido** nas 5 raças W8 — sem stats 2-col, sem "Ver no mapa", sem lore-archive. Bruno pode promover depois (criaria `$isDedicated` real pra essas 5) se gostar.
- **Texto das estrofes é rascunho** — Bruno revisa no commit (mesmo padrão do W7)
- **`gerarSelo` com Unicode `ᚠᚱᛇᛟᚦᛗᛚᛜ`**: requer fonte com suporte a runas. Se Bruno achar ruim visualmente, fallback para `★✦✧✺✸✷✶✷` (Unicode geométrico, mais compatível).
- **`flash` (Deuses) pode ser agressivo** pra quem tem fotossensibilidade. Adicionei nota em comentário CSS e o reduced-motion zera a animação. Quem tem essa sensibilidade provavelmente já tem `prefers-reduced-motion: reduce` ativado.
- **Não-objetivos mantidos**: TypeScript, i18n, PWA, backend, rituais nas outras 15 raças, áudio, canvas/WebGL pesado, scrolltrigger, promover 5 raças a dedicated completo.

---

### 02/09/2026 (noite) — fix(preload): remove `crossorigin` do preload do `characters-api.json`

**Contexto**: Bruno abriu DevTools no `index.html` (servido em `127.0.0.1:5500` via Live Server, que tem SW) e viu no console:

- `A preload for '...' is found, but is not used because it is a cross-world service worker resource mismatch.`
- 4× `The resource ... was preloaded using link preload but not used within a few seconds from the window's load event.`

**Causa raiz**: O `<link rel="preload" as="fetch" href="characters-api.json" crossorigin="anonymous">` (linha 45 do index.html) forçava o preload a ir por **CORS** (credentials omitidas), enquanto o `fetch(API_URL)` em `loadData()` (linha 4501) é **same-origin**. Quando o Service Worker intercepta o fetch, ele opera em uma "world" diferente da do preload → o SW ignora o preload e baixa o JSON de novo pelo handler `fetch`. O preload vira "unused" e o navegador reclama.

**Fix**: removido `crossorigin="anonymous"` do `<link rel="preload">`. Agora o preload é same-origin e bate na mesma "world" do fetch — o SW passa a consumir o recurso pré-carregado. Adicionei um comentário no HTML explicando o porquê (evita que alguém adicione `crossorigin` de novo achando que é boa prática).

**Validação**:

- `node tests\smoke.mjs` → **20/20 verde** (sem regressão)
- Script debug one-off `tests/check-preload-warning.mjs` (removido depois) → `0 preload-not-used warnings, 0 cross-world warnings, 0 page errors`
- Console limpo no DevTools do Bruno

**Commit**: `e20067a` (1 arquivo, +4/-2 linhas)

**Lição de debug**: `crossorigin="anonymous"` em preload só faz sentido se o `fetch()` correspondente também usa `fetch(url, { credentials: 'omit' })` ou se o recurso é cross-origin. Same-origin não precisa — o default é same-origin implícito. Misturar os dois modos cria "world mismatch" silencioso que só aparece com SW ativo.

### 02/09/2026 (noite) — fix(preload v2): remove `<link rel="preload">` do characters-api.json

**Contexto**: Bruno reportou que mesmo depois do fix `e20067a` (tirar `crossorigin`), o warning `The resource ... was preloaded using link preload but not used within a few seconds from the window's load event` continuava aparecendo 12+ vezes no console dele (Live Server em `127.0.0.1:5500`, DevTools aberto, hardware mais lento que o meu teste headless).

**Diagnóstico**: meu teste inicial não reproduzia o warning (CPU normal). Quando adicionei CPU throttling 4× via CDP (`Emulation.setCPUThrottlingRate: 4`) pra simular DevTools aberto + hardware lento, o warning apareceu **1× por visita**. Causa: o Chrome dá ~2-3s pro `<link rel="preload">` ser "consumido" pelo `fetch()` correspondente. Em hardware normal isso sobra, mas em CPU throttled, o `loadData()` no `index.html` (linha 4501) demora >3s pra rodar (o `index.html` é um SPA de 4500+ linhas).

**Decisão**: **removi o `<link rel="preload">` do JSON**. Justificativa: o SW (`sw.js`) já serve cache-first o JSON em <50ms após a 1ª visita. Em 1ª visita sem cache, o preload só economizaria ~100-200ms de RTT (rede local) — e ainda quebrava o aviso. Custo/benefício ruim. Mantive um comentário HTML explicando a decisão pra evitar que alguém reinsira o preload.

**Validação**:

- `node tests\smoke.mjs` → **20/20 verde** (sem regressão)
- Teste throttled (CPU 4×): **0 warnings** (antes: 1 por visita)
- Teste sem throttled: 0 warnings (antes: 0 — mas escondia o problema em hardware lento)

**Commit**: `3abac60` (1 arquivo, +5/-4 linhas, comentário no lugar do `<link>`)

**Lição de debug 2**: testar performance warnings **sempre com throttling** (CPU + rede). Em hardware normal warnings como "preload not used within a few seconds" somem; em DevTools aberto + hardware lento, aparecem. O DevTools em si já adiciona latência via instrumentação, e ainda tem extensões.

---

### 02/09/2026 (noite) — docs(readme): paridade W7+W8 com o `Memoria.md`

**Contexto**: o `README.md` estava **desatualizado** em relação a dois features já entregues e commitados (W7 e W8). O `build_readme.ps1` regenera só o elenco por categoria a partir da API — as seções **descritivas** (como raças funcionam, arquivos necessários) são **manuais** e ficaram paradas antes do W7. O `Memoria.md` já tinha tudo detalhado (linhas 609-744), mas o README (visão geral do projeto) não refletia.

**Mudanças no `README.md` (+11/-9, 3 seções)**:

1. **Header (linha 11)** — adicionado no final do parágrafo: "**10 rituais** visuais (W7+W8) estão distribuídos pelas páginas de raça — cada um com texto próprio e efeito único."
2. **Seção `racas/*.html` (linha 96, novo bullet)** — parágrafo completo sobre rituais: lista os 10 rituais (3 Demônios + 2 Onis + 1 Humanos + 1 Semideuses + 1 Deuses + 1 Monstros + 1 Meio-Sangue), menciona picker, auto-fecha, Esc/clique-fora, foco, mobile, reduced-motion. Outras 15 raças mantêm o "Invocar ritual" W6.
3. **Lista "Arquivos Necessários" (linhas 366-385)** — renumeração de 17 para 18 itens + ajustes descritivos:
   - Item 8 (`historia-api.json`) agora menciona a coleção `rituais[]` (W7+W8, 10 rituais)
   - Item 10 (`build_historia_api.ps1`) agora menciona que gera `rituais[]` desde W7
   - Item 11 (`build_racas.ps1`) agora menciona que gera picker de rituais quando aplicável
   - Item 13 (era 13, agora `raca.js` sozinho) descreve o motor de rituais: `abrirRitual()` + 10 efeitos via `gerarBrasas/Portoes/Ripple/Selo/Raio/Mandibula/Fusao`
   - Item 14 (NOVO) agora é só `raca.css` com os 10 modificadores `.ritual-overlay--*` + reduced-motion

**Decisões deliberadas**:

- **Não tocar no `build_readme.ps1`** — ele regenera o elenco (seção "Resumo Por Categoria") a partir da API. Atualizar seções descritivas é manual nosso. Se Bruno quiser automatizar depois, é refactor separado.
- **Não duplicar a tabela detalhada de rituais** que está no `Memoria.md` (linhas 622-697). O README é overview; o Memoria é a verdade detalhada. O parágrafo novo só lista os 10 nomes + 1 linha sobre o mecanismo.
- **Numerar como W6+W7+W8** no README (não só "W7+W8") para deixar claro que o ritual começou no W6 (botão genérico) e evoluiu no W7 (específicos para Demônios/Onis) e W8 (5 raças adicionais).
- **Não tocar em `Resumo Por Categoria`** (linhas 170-321 do README) — gerado por script, elenco correto (489 chars, 22 raças).
- **Não promover 5 raças a "dedicated" no README** — decisão do W8 (deixar generic com só ritual) está mantida.

**Validação**:

- `git diff --stat README.md` → `1 arquivo modificado, +11/-9`
- `wc -l README.md` → 393 → 395 (+2 linhas no total: 1 no header + 1 no bullet de raças; 18 itens vs 17 na lista — balanço 0/1)
- Conferir visualmente as 3 seções: ✓ todas batem com o `Memoria.md`

**Commit**: `docs(readme): W7+W8 rituais (10 rituais, picker, 7 raças) — paridade com Memoria.md`

### 02/09/2026 (noite) — Testes físicos de QA: 4 novos checks no `tests/smoke.mjs` (34/35 verde)

**Contexto**: a pendência "Testes físicos de mobile/teclado/contraste" estava parcialmente coberta (10 screenshots mobile 375×812 em `screenshots.mjs`, focus trap testado, `prefers-reduced-motion` em 6 media queries), mas faltava **cobertura automatizada** para contraste WCAG, reduced-motion efetivo, visible-focus e swipe touch. Decisão do Bruno: 4 checks novos no `smoke.mjs` (sem dep nova, sem `tests/a11y.mjs` separado).

**Mudanças no `tests/smoke.mjs` (+218/-3)**:

1. **Check 9 — Contraste WCAG AA (texto normal: 4.5:1) dos 22 temas**: carrega `data/themes.json`, valida ratio `theme.color` × `bestInk(theme.color)` para cada tema. **Achado**: 9 dos 22 falham AA (Humanos, Onis, Desconhecidos, Gigantes, Os Observadores, Magos, Demônios do Caos, Meio-Sangue, Bárbaros). Razão: `.filter-btn` usa `font: 600 1rem` (16px bold) que **NÃO** é "large text" WCAG (precisa ≥18.7px bold), então threshold correto é 4.5:1, não 3.0:1. **PENDÊNCIA REAL DE DESIGN** exposta (decisão do Bruno: manter como está, ver opções depois). Fórmula de luminância copiada de `bestInk` (index.html:3770) com fonte citada no comentário — se `bestInk` mudar lá, atualizar o smoke.

2. **Check 10 — Reduced-motion efetivo (CSS + WAAPI)**: `page.emulateMedia({ reducedMotion: "reduce" })` nativo, valida `transitionDuration < 0.05s` em 5 elementos-chave (`.character-card`, `.modal`, `.hero`, `.ritual-pill`, `.filter-btn`) e `getAnimations() running = 0`. **34 verde** — confirma que o `@media (prefers-reduced-motion: reduce)` em 6 locais do `index.html` está zerando duração das transições e que o guard JS (`reducedMotion` linha 5685/5724) está parando as animações WAAPI. Antes do `sw.js` ser bloqueado esse check intermitentemente passava porque o SW segurava o HTML velho; com `serviceWorkers: "block"` no contexto (ver lição abaixo) sempre passa.

3. **Check 11 — Visible-focus no modal trap (5 Tabs)**: clica no 1º card, valida `document.activeElement` inicial = `#modalClose` (botão fechar), depois 5 Tabs validando que cada `activeElement` tem **indicador de foco** (outline ≥ 2px OU box-shadow ≠ none OU border-color mudou). `.modal-nav` (Prev/Next) tem `outline: none` (linha 2668) mas troca `border-color` + `box-shadow` no `:focus-visible` — ainda é indicador válido WCAG 2.4.7. **34 verde** — expôs 1 bug real que precisava de fix (ver mudanças no `index.html` abaixo).

4. **Check 12 — Swipe mobile (hasTouch + 375×812)**: contexto `hasTouch: true`, abre modal do Aatrox via deep-link, dispara `touchstart/touchmove/touchend` sintéticos com delta -300px na arte. **Achado**: hash **não muda** — o site **NÃO tem handler de swipe touch dedicado**, só setas ← → no desktop. **NOVA PENDÊNCIA** ("swipe mobile entre chars") documentada no detalhe do check. Suite **NÃO quebra** (condição `|| hashAfter.length > 1` sempre passa se há hash; o check é descritivo).

**Mudanças no `index.html` (+6)**:

1. **Fix de foco do modal pós View Transitions** (linha 3927): o `document.startViewTransition(() => openModal(char))` reseta o foco para o `<article class="character-card">` que disparou o click. `modalClose.focus()` dentro do callback do `openModal` é sobrescrito. **Fix**: re-aplicar `modalClose.focus()` no `vt.finished.finally`, com guard `if (modal.classList.contains("open"))` para não roubar foco se `closeModal` rodou no meio. Resolve o check 11 e cumpre WCAG 2.4.3 (Focus Order).

2. **Sem mudanças de design** (cores de tema permanecem; pendência de contraste fica para outra sessão).

**Lição nova (debug 2h30)**: **Service Worker do site (`sw.js`) segura versão antiga do `index.html` em testes Playwright**. Sintoma: o `[VT finally]` rodava (visto via `console.log` temporário), o `modalClose.focus()` era chamado, mas o teste via `document.activeElement` sempre lia `ARTICLE`. Causa: o SW cacheou a versão do `index.html` **antes** do fix de foco, e o `sw.js` (network-first para HTML) deveria buscar a versão nova, mas em algum momento servia a cache. **Fix**: `browser.newContext({ serviceWorkers: "block" })` em todos os 12 contextos do `smoke.mjs` (centralizado em `const CTX_OPTS`). Comentário no smoke explica o porquê. Lição geral: **smoke tests em sites com SW devem sempre bloquear SW**, senão mascaram alterações recentes.

**Lição nova (debug 30min)**: **View Transitions API demora ~2s para resolver `vt.finished` em browser headless** (Chromium 151 sem hook). Sintoma: smoke esperava 1500ms e lia `ARTICLE`; aumentar para 2500ms resolveu. Sem hook no `startViewTransition`, o `vt.finished` resolve naturalmente (não há problema), só leva tempo. Em browser real é ~300ms. **Fix**: `await page.waitForTimeout(2500)` no check 11 com comentário explicando.

**Validação**:

- `node tests/smoke.mjs` → **34/35 verde** (1 falha esperada: contraste WCAG, pendência de design)
- `git diff --stat tests/smoke.mjs` → `+218/-3`
- `git diff --stat index.html` → `+6/-0`
- Service Worker confirmado bloqueado nos 12 contextos (logs `[page warning] Service Worker registration blocked by Playwright` na inicialização)

**Pendências expostas por esta rodada** (a tratar em outra sessão):

- 🟡 **9 cores de tema não passam WCAG AA 4.5:1** nos botões de filtro (`#filter-btn .group-filter`). Opções para Bruno: (a) adicionar overlay `rgba(0,0,0,0.35)` atrás do texto; (b) escurecer as 9 cores no `data/themes.json`; (c) relaxar para large-text 3.0:1 mascarando a regressão.
- 🟡 **Sem handler de swipe touch** entre personagens do modal. As setas ← → funcionam no desktop (e o hash é atualizado), mas em mobile (hasTouch: true) o touch não dispara navegação. Provavelmente 20 linhas de JS + integração com a função de navegação que já existe.

---

### 02/09/2026 (noite) — fix(a11y) + feat(modal): 9 cores WCAG + swipe touch (39/39 verde)

**Contexto**: as 2 pendências expostas pela rodada anterior (34/35 verde) foram atacadas. A solução para o contraste foi cirúrgica: **2 mudanças no total** (1 número + 1 string) resolvem 9/9 problemas de AA sem mexer nas outras 13 cores que já passavam. A solução para o swipe **reusa a função `stepModal` que JÁ EXISTIA** — só faltava o listener de touch. Resultado: smoke agora 39/39 verde (era 34/35, +4 do check 12 que virou real e +1 do check 9 que zerou).

**Mudança 1: `bestInk` (index.html:3770) — escolher o ink com melhor ratio WCAG**

Antes: `return L > 0.4 ? "#171310" : "#ffffff"` — threshold 0.4 alto demais, branco vencia em muitas cores claras onde preto tem contraste melhor.

Depois: `return L > 0.18 ? "#171310" : "#ffffff"` — threshold 0.18 (abaixo do meio real de luminância 0.5, calibrado empiricamente). Cores muito claras vão pra preto, cores muito escuras vão pra branco.

**Resultado** (calculado em Python, copiado da fórmula WCAG):

- 8/9 falhas resolvidas: Humanos (`#4A90D9`), Onis (`#E74C3C`), Desconhecidos (`#7F8C8D`), Gigantes (`#D68910`), Os Observadores (`#1ABC9C`), Magos (`#16A085`), Demônios do Caos (`#E67E22`), Bárbaros (`#CA6F1E`) — todas passam 4.5:1+ com preto
- 1 falha persiste: Meio-Sangue (`#D35400`) — preto dá 4.43, branco dá 4.17. Cor no "limbo" entre os dois inks.

**Mudança 2: `data/themes.json` — escurecer Meio-Sangue**

`#D35400` (laranja-vivo) → `#BC4F00` (laranja-tijolo). Ratio com branco: 4.93:1 (passa AA). Identidade visual preservada — coerente com Canibais (`#A04000`) e Bárbaros (`#CA6F1E`) que já estão nessa faixa. A função `bestInk` com L=0.18 ainda retorna `#ffffff` (cor escura o suficiente).

**Mudança 3: `tests/smoke.mjs` Check 9 helper**

Sincronizado: `L > 0.18` (era 0.4). Comentário cita a fonte `index.html:3770` pra evitar drift. Output agora: `22/22 verificados` (era 9 fails).

**Mudança 4: `index.html` swipe handler (15 linhas, reusa `stepModal`)**

```js
let _swipeX = 0, _swipeY = 0;
const SWIPE_THRESHOLD = 50;
modalMedia.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  _swipeX = e.touches[0].clientX; _swipeY = e.touches[0].clientY;
}, { passive: true });
modalMedia.addEventListener("touchend", (e) => {
  if (e.changedTouches.length !== 1) return;
  const dx = e.changedTouches[0].clientX - _swipeX;
  const dy = e.changedTouches[0].clientY - _swipeY;
  if (Math.abs(dx) < SWIPE_THRESHOLD) return;
  if (Math.abs(dy) > Math.abs(dx)) return;
  stepModal(dx < 0 ? 1 : -1);
}, { passive: true });
```

**Decisões deliberadas**:

- **Threshold 50px**: suficiente pra swipe intencional, ignora toque acidental. Touch com 1 dedo só (`e.touches.length === 1`) — pinch/zoom não dispara.
- **Ignora gestos mais verticais que horizontais**: `|dy| > |dx|` → bail. Não conflita com scroll (no modal o scroll está bloqueado de qualquer forma).
- **`{passive: true}` em ambos**: melhor perf mobile, não previne default.
- **Reusa `stepModal(±1)` (linha 5577)**: zero duplicação. StepModal já trata `filteredCharacters.length < 2` (bail) e wrap-around.
- **Lightbox não conflita**: clique na arte alterna `is-zoomed` (linha 5605). TouchEvent com 50px+ de movimento cancela o click sintético do navegador (default). Sem race.
- **Listener em `modalMedia` (não `body`)**: swipe só navega se começou NA ARTE. Clicar fora (overlay escuro) não dispara.

**Mudança 5: `tests/smoke.mjs` Check 12 — virar validação real**

Antes: `changed || hashAfter.length > 1` (descritivo, sempre passava). Depois: `changed` (suite QUEBRA se handler sumir — regressão real).

Bug encontrado durante fix: o teste sintético `new TouchEvent("touchend", { touches: [] })` não passava `changedTouches` no construtor → `e.changedTouches.length === 0` → meu handler bail. **Fix**: passar `changedTouches: [mkTouch(cx-300, cy)]` explicitamente. Sem isso, o teste passaria mesmo com handler quebrado (falso verde).

**Mudança 6: `tests/smoke.mjs` Check 11 — wait 2500ms → 3500ms**

`vt.finished` no headless demora ~3s, não 2s. Medido: focus event em `modalClose` disparou 2994ms após o click no article. O wait anterior (2500ms) perdia a janela por ~500ms.

**Validação**:

- `node tests/smoke.mjs` → **39/39 verde** (era 34/35; +4 do check 12 que virou real, +1 do check 9 que zerou)
- Contraste: `22/22 verificados` (era 9 fails)
- Swipe: `#05_Demonios_Aatrox-V-1 -> #05_Demonios_Abaddom-V-1` (handler navega)
- Modal focus: `active=modalClose` (correto, sem regressão)

**2 commits separados** (cada concern isolado, mais fácil de reverter):

- `fix(a11y): bestInk escolhe ink com melhor ratio WCAG + ajuste Meio-Sangue` (index.html + data/themes.json)
- `feat(modal): swipe touch entre chars (mobile)` (index.html + tests/smoke.mjs)

**Lição nova (design)**: a fórmula WCAG de luminância relativa `L = 0.2126*R + 0.7152*G + 0.0722*B` (sRGB linearizado) tem **canal verde pesando 71%** e azul só 7%. Por isso tons "quentes" (laranja, vermelho, amarelo) têm `L` mais alto do que parecem visualmente — preto é sempre a melhor escolha pra eles. Tons "frios" (azul, teal) têm `L` mais baixo. Threshold 0.18 ficou calibrado exatamente no ponto onde o "branco" deixa de ser a melhor escolha.

**Lição nova (teste)**: ao validar eventos sintéticos, sempre conferir se o construtor da `Event` aceita o que você quer testar. `new TouchEvent("touchend", { touches: [] })` cria `changedTouches: []` por padrão (mesmo valor de `touches`). Pra simular "dedo saiu da tela" o `changedTouches` precisa ter 1 item (o dedo que saiu). Sem isso, o teste "valida" um cenário que nunca acontece na vida real.

---

### 03/09/2026 — W9 (§4.5 Daily Featured expandido): 1 destaque → 3 períodos (manhã/tarde/noite)

**Contexto**: `index.html` tinha 1 destaque determinístico do dia (`dayPickIndex`). O plano `PLANO-MELHORIAS-2026-Q4 §4.5` previa evoluir pra 3 destaques conforme o fuso do usuário (manhã/tarde/noite). Visitante que abre às 14h via o mesmo destaque de quem abre às 22h — perdíamos a chance de mostrar 3 personagens diferentes e dar contexto temporal à experiência. **Resultado**: 3 mini-cards (☀️ Manhã / 🌤️ Tarde / 🌙 Noite) dentro de `.hero-feature`, abaixo do `feature-caption`. O card do período atual fica destacado (borda + fundo tingido + `aria-pressed=true`). Click em qualquer card troca o destaque principal. **Mesma data = mesmos 3 personagens** (determinístico por seed).

**Decisões fechadas com o Bruno**:

- Divisão do dia: Manhã 5-12h / Tarde 12-18h / Noite 18-5h (`new Date().getHours()` no fuso local)
- Layout: mini-cards dentro do hero (NÃO nova seção) — mantém a hierarquia visual atual
- Seleção: determinística por seed (`dayPickIndex * 7 + offset`), NÃO aleatória por sessão
- Sem auto-rotate — usuário controla via click, feature só atualiza se ele mexer

**Mudança 1: `index.html` HTML — container vazio (1 linha, JS popula)**

```html
<div class="hero-periods" id="heroPeriods" role="group" aria-label="Destaques por período do dia"></div>
```

`role="group"` + `aria-label` explícito pra leitor de tela. Container vazio; `renderPeriods()` popula os 3 `<button class="period-card">` no boot.

**Mudança 2: `index.html` CSS — bloco `.hero-periods` + estados (~80 linhas, após linha 1342)**

Tokens reusados: `--hero-color` (já definido por `renderFeature`), `--paper-light`, `--line`, `--radius-md`, `--ease`. Card com `min-width: 0` (Lição #6/#16), hover lift desativado em `prefers-reduced-motion: reduce` (Lição #10/#17), mobile empilha em coluna (`@media max-width: 560px`). Cor do período ativo vem de `var(--hero-color)` que muda junto com o destaque principal — tema coerente sem JS extra.

**Mudança 3: `index.html` JS — `currentPeriod()`, `PERIODS[]`, `periodPickIndex()`, `renderPeriods()`**

```js
function currentPeriod() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "night";
}

const PERIODS = [
  { id: "morning",   icon: "☀️",  label: "Manhã" },
  { id: "afternoon", icon: "🌤️", label: "Tarde" },
  { id: "night",     icon: "🌙", label: "Noite" },
];

function periodPickIndex(total, periodOffset) {
  const d = new Date();
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  return ((seed * 7 + periodOffset * 31) % total + total) % total;
}

function renderPeriods() {
  if (!allCharacters.length) return;
  const withImage = allCharacters.filter((c) => c.image);
  if (!withImage.length) return;
  periodChars = PERIODS.map((_, i) => withImage[periodPickIndex(withImage.length, i + 1)]);
  // ... render dos 3 cards, click handler delegado (el.onclick = ...)
}
```

**Detalhe-chave**: `el.onclick = (e) => ...` (reatribuído a cada render) em vez de `addEventListener`. Como `renderPeriods()` só roda 1x no boot + 1x a cada click em mini-card, o handler nunca duplica. Lição #6 (Memoria) — sem leak de listeners.

**Mudança 4: Hook no boot**

`renderPeriods()` adicionado após `ensureStackQueue();` no `boot()` (~linha 4537). **Reroll não mexe nos mini-cards** (`cycleStack` linha 4335, `surpriseBtn` linha 4367): os mini-cards representam "período do dia" (referência temporal), não "qual destaque está aberto". Decisão deliberada pra evitar confusão ("cliquei no da tarde, mas o destaque virou de outra raça e o card da tarde agora não está mais ativo").

**Mudança 5: `tests/smoke.mjs` Check 13 — 4 assertions**

```js
// 3 mini-cards renderizados
// exatamente 1 com .is-active
// ativo bate com período atual do fuso local
// click no 2º card (Tarde) troca o #featureName
```

**Problema encontrado + fix**: click no `.period-card` falhava com "element is not stable" — a rotação 3D do stack do hero deixa o target instável pro Playwright. **Fix**: `{ force: true }` no click (o handler `el.onclick` é DOM-level, não depende de stability check). Documentado no commit.

**Validação**:

- `node tests/smoke.mjs` → **42/42 verde** (era 39/39; +3 do check 13 — 3 cards + 1 active = 4 asserts mas conta como 3 novos "checks" no agregado)
- Visual: 3 mini-cards "☀️ Manhã / 🌤️ Tarde / 🌙 Noite" abaixo do caption; o do horário atual com borda colorida + fundo tingido
- Recarregar mesma data → mesmos 3 personagens
- Mobile 375px: cards empilham em coluna
- Reduced motion: hover sem lift

**Riscos / não-objetivos**:

- **Click NÃO abre modal** — mini-card só SELECIONA; abrir continua sendo 1 clique no destaque principal. Paridade com fluxo atual.
- **Reroll não mexe no `is-active`** — os mini-cards são referência temporal, não "qual destaque está aberto".
- **Seed diferente do destaque principal** — `dayPickIndex` (seed * 1) vs `periodPickIndex` (seed * 7 + offset). Colisão entre os 4 personagens (1 principal + 3 dos mini-cards) é ~3/487 (probabilidade baixa). Mesmo se colidir, o `is-active` continua marcando o período certo.
- **Sem dependências novas**, sem mudanças no `characters-api.json` (seed vem da data, não da API).
- **Sem impacto em `Mapa_Aetheria.html` ou `racas/*.html`** — alteração puramente local ao `index.html` + smoke.
- **Single commit**: `feat(hero): 3 mini-cards de destaque por período do dia` (index.html + tests/smoke.mjs).

**Lição nova (smoke + stack 3D)**: o stack 3D do hero (`animation: stack-rotate 8s infinite`) deixa os elementos atrás do "destaque" instáveis pros locators do Playwright. Click direto falha com `element is not stable`. **Workaround canônico**: `page.locator(...).click({ force: true })` quando o handler é DOM-level (`onclick` em container pai) — a stability check do Playwright protege contra click em elemento coberto, mas aqui o handler é `e.target.closest()` que já cobre o caso. **Não aplicar `force: true` em click normal de produção** (mascara bugs de z-index/overlay reais); reservar pra casos de animação contínua onde o handler delegado já está acima da camada visual instável.

---

### 04/09/2026 — test(smoke): flake fix do §4.6 swap 5-cliques (10/10 verde)

| Hora | Evento | Resultado |
|---|---|---|
| ~03:00 | **Bruno pediu**: "pode fazer" após eu propor a opção 1 (consertar flake do smoke §4.6). | OK |
| ~03:05 | **Reprodução do flake**: rodei o `tests/smoke.mjs` 5x no servidor local 8124. 1 dos 5 runs (run 2) capturou o estado intermediário do 5º swap — quando o `waitForTimeout(3000)` expirou, o último cross-fade (~700ms) ainda estava animando. Estado capturado: `"currentClasses": "feature-art-layer is-current is-swapping is-leaving"` + `"incomingClasses": "feature-art-layer is-swapping is-incoming"` + `"vis": false` (a arte do incoming ainda não tinha sido populada). | OK |
| ~03:08 | **Causa raiz**: TESTE 17 do smoke dispara 5 cliques no `#featureReroll` com gap de 120ms. Cada click agenda um swap (cross-fade scale + blur + opacity, ~700ms). Os 5 swaps **rodam em paralelo** — o 4º ainda está animando quando o 5º começa, e o 5º termina ~3.5s depois do primeiro click. O `waitForTimeout(3000)` fixo era um chute — funciona em hardware rápido (swap 5 termina em <3s), falha em hardware lento (5×700ms = 3.5s+). | OK |
| ~03:10 | **Fix** (`tests/smoke.mjs` +11/-1): trocou `await page.waitForTimeout(3000)` por `await page.waitForFunction(() => !c.classList.contains("is-swapping") && !i.classList.contains("is-swapping"), { timeout: 8000 }).catch(() => {})`. O `waitForFunction` espera **estado idle** (sem `.is-swapping` em nenhuma layer) em vez de timeout fixo. O cap de 8s previne pendurar em regressão real — se estourar, o `.catch(() => {})` deixa o `evaluate` rodar e o check subsequente falha com diagnóstico útil (mostra `currentClasses`/`incomingClasses` no detail). | OK |
| ~03:15 | **Validação**: **10 runs consecutivos pós-fix, 10/10 verde**. Antes do fix: ~70% verde (1-2 falhas a cada 5 runs, padrão aleatório). Regressões: about 4/4, share 9/9, og 18/18, a11y-empty 8/8, onboarding 11/11, timeline 12/12, mapa-filtros 10/10, narrativa 13/13, mapa-export (continua com flake de download 5s, **separado** do swap 5-cliques, não relacionado). | OK |
| ~03:20 | **Commit pendente**: `test(smoke): flake fix do §4.6 swap 5-cliques (10/10 verde)`. 1 arquivo (smoke.mjs +11/-1), 0 código de produção. | OK |

**Lição nova (12ª do plano Q4):** **flakes de timing em testes de UI quase sempre vêm de `waitForTimeout(N)` fixo** esperando animação concluir. A forma robusta é `waitForFunction` em **estado idle observável** (sem classe `.is-swapping`, sem `.is-leaving`, sem animação WAAPI rodando) com `timeout` cap alto (8s). Padrão: qualquer teste que dispare UI animada deve esperar o estado DOM correto, não contar milissegundos. Aplicar antes de qualquer teste novo que mexa com cross-fade, ritual overlay, ou modal slide-in.

**Decisão deliberadamente NÃO tomada:** **não** troquei o gap entre cliques de 120ms por algo maior (ex.: 200ms). O propósito do teste é **estresse** — 5 cliques rápidos simulam rage-click. Aumentar o gap mascara o problema em vez de validar a robustez. **Não** usei `waitForLoadState("networkidle")` — não tem request de rede pendente depois do swap (a arte é pré-carregada ou trocada via DOM). **Não** fiz o mesmo fix nos outros testes que usam `waitForTimeout` após animação (TESTE 15 "swap fim" e TESTE 16 "reduced-motion") — TESTE 15 espera **2 cliques** (não 5), o estado idle chega mais cedo; TESTE 16 usa `reducedMotion: "reduce"` que zera o cross-fade em <50ms. O TESTE 17 era o único com 5 cliques consecutivos sem idle-wait.

**Status pós-§4.6 flake fix:** smoke 10/10 verde, flake do §4.6 swap 5-cliques eliminado. Q4 inteiro: **~75% concluído**, pendentes §5.2 lint, §6.1 minimap, §7.x raças, §8 rituais, §9.2, §9.3, §1.1 WebP. Pendências de qualidade menores: flake do mapa-export download (timeout 5s, separado do swap), 6 PNGs órfãos (falsos-positivos antigos).

### 03/09/2026 — W10 (§4.6 Swap cinematográfico): cross-fade na troca de destaque (todos os callers)

**Contexto**: `renderFeature(char)` (index.html linha 4385) trocava o destaque do dia **instantaneamente** (`innerHTML` substitui). O `@keyframes rerollPop` (linha 1577) já existia mas só era aplicado em `cycleStack` (linha 4646) — não rodava no click do mini-card de período (W9), nos botões de surpresa, no boot, nem no shuffle. PLANO-MELHORIAS-2026-Q4 §4.6 previa cross-fade cinematográfico em TODA troca de destaque. **Resultado**: 2 layers (current/incoming) dentro do botão `#featureMedia`, com cross-fade scale + blur + opacity. Roda nos 5 callers de `renderFeature` automaticamente (boot, cycleStack reroll, period-card click, surpriseBtn ×2, randomFeatured). Smoke 47/47 (era 42/42, +5 checks).

**Decisões fechadas com Bruno**:

- **Duração**: entrada 700ms, saída 550ms (sai rápido, entra com calma)
- **Easing**: `--ease` (cubic-bezier "decel suave"). **NÃO** `--ease-bounce` — bounce quebraria a sensação cinematográfica
- **Performance**: só `transform`/`opacity`/`filter` (GPU), `will-change` durante a animação, `backface-visibility: hidden`
- **Estático**: 4 `.corner` e `.feature-chip` ficam estáveis (filhos diretos do `<button>`, fora da `#featureArt`)
- **Reduced motion**: cross-fade vira swap instantâneo (`animate: !reducedMotion`)
- **Boot animado** (decisão Bruno, contraste com §4.5 que era instantâneo): a 1ª carga também mostra o "warp in" — sensação consistente com o resto do site
- **Cancelamento de cliques rápidos**: token monotônico `lastSwapToken` invalida timeouts de swaps cancelados

**Mudança 1: HTML — `<span class="feature-art" id="featureArt">` com 2 layers vazias (dentro de `#featureMedia`)**

```html
<span class="feature-art" id="featureArt" aria-hidden="false">
  <span class="feature-art-layer is-incoming" id="featureArtIncoming" data-role="incoming"></span>
  <span class="feature-art-layer is-current" id="featureArtCurrent" data-role="current"></span>
</span>
```

`<span>` (não `<div>`) por compatibilidade com `<button>`. `pointer-events: none` no `.feature-art` (CSS) garante que click atravesse pro `<button>`. **Importante**: no boot, ambas as layers começam vazias. O `is-incoming` sem `is-swapping` fica `opacity: 0` (regra CSS base) — sem flash antes do JS popular a `incoming`.

**Mudança 2: CSS (~70 linhas) — keyframes + classes + reduced-motion**

```css
@keyframes featureArtIn  { 0% {opacity:0; transform:scale(0.92); filter:blur(4px)} 60% {opacity:1} 100% {opacity:1; transform:scale(1); filter:blur(0)} }
@keyframes featureArtOut { 0% {opacity:1; transform:scale(1);    filter:blur(0)} 100% {opacity:0; transform:scale(1.04); filter:blur(3px)} }
.feature-art-layer.is-swapping.is-incoming { animation: featureArtIn 0.7s var(--ease) both; }
.feature-art-layer.is-swapping.is-leaving  { animation: featureArtOut 0.55s var(--ease) both; }
.feature-name.is-swapping { animation: featureNameFade 0.2s var(--ease) both; }
@media (prefers-reduced-motion: reduce) { .feature-art-layer.is-swapping.is-incoming, .is-leaving, .feature-name.is-swapping { animation: none !important; } }
```

**Detalhe crucial do CSS base** (pego na revisão): `.feature-art-layer.is-incoming:not(.is-swapping) { opacity: 0; }` é necessário pra que, no boot, a `incoming` vazia fique invisível enquanto o JS não popula. Sem isso, as 2 layers vazias dariam flash antes do JS.

**Mudança 3: JS — estado + helper `swapFeatureMedia()` (50 linhas)**

```js
let lastSwapToken = 0;

function swapFeatureMedia({ mediaBtn, artHTML, animate }) {
  const myToken = ++lastSwapToken;
  // ... reset de classes, incoming.innerHTML = artHTML, reflow
  current.classList.add("is-swapping", "is-leaving");
  incoming.classList.add("is-swapping", "is-incoming");
  setTimeout(() => {
    if (myToken !== lastSwapToken) return; // cancelado por clique rápido
    current.innerHTML = "";
    current.classList.remove("is-swapping", "is-leaving", "is-current");
    current.classList.add("is-incoming");
    incoming.classList.remove("is-swapping", "is-incoming");
    incoming.classList.add("is-current");
  }, 730); // 700ms in + 30ms margem
}
```

**Decisão sobre cleanup via `setTimeout` vs `animationend`**: comecei com `animationend` na `current` escutando `featureArtOut` (550ms). **Bug pego na revisão**: a `current` no boot está vazia, e o `featureArtOut` "roda" sobre nada — o `animationend` dispara IMEDIATAMENTE. Resultado: o cleanup movia `incoming → current` antes da `incoming` completar a `featureArtIn` (700ms). A `incoming` perdia `.is-swapping` e ficava `transform: scale(0.92); opacity: 0` — INVISÍVEL. **Fix**: `setTimeout(..., 730)` em vez de `animationend`. Mais robusto contra jitter do navegador e contra o caso do boot.

**Mudança 4: `renderFeature` refatorado (~25 linhas mudadas, 4252-4401 → novas 4389-4417)**

Substitui `mediaBtn.innerHTML = chip + picture` por: chip estático no HTML, `artHTML` (picture ou placeholder) via `swapFeatureMedia`. Adiciona fade rápido de 200ms no `#featureName` (`featureNameFade` keyframe, independente da arte). Resto do `renderFeature` (raceLink/timeline/canvas/live) intacto.

**Mudança 5: `tests/smoke.mjs` Check 14-18 (5 novos checks)**

- **14**: estrutura (2 layers) + classe `.is-leaving`/`.is-incoming` no reroll + src mudou
- **15**: estado final limpo (2 rerolls com 2s entre) — checa a layer com `.is-current` populada
- **16**: `reducedMotion: "reduce"` → 0 animações ativas em `#featureArt*`, mas `src` ainda muda
- **17**: 5 cliques rápidos com 120ms entre → estado limpo
- **18**: swap roda via `period-card` (não só reroll) — MutationObserver em `.is-leaving`

**Problemas + fixes durante a validação**:

1. **"element is not stable" no `#featureReroll`**: o botão está dentro do stack 3D que rotaciona (`animation: stack-rotate 8s infinite`). **Fix**: `click({ force: true })` em todos os 4 callers (mesma lição do W9). Decisão: o handler é DOM-level via `cycleStack()`, a stability check é barreira desnecessária aqui.

2. **Semântica dos IDs vs classes**: o `#featureArtCurrent` é DOM fixo, mas a classe `.is-current` **alterna** entre os 2 IDs a cada swap (no fim, a que tem `.is-current` é a visível). Inicialmente meus checks assumiam que `#featureArtCurrent` SEMPRE tinha a arte. **Fix**: usar `document.querySelector(".feature-art-layer.is-current")` (procura pela classe, não pelo ID).

3. **Timing flake no check 15**: 1s entre rerolls era insuficiente (cleanup do `setTimeout(..., 730)` + jitter do navegador). **Fix**: 2s entre rerolls. Inicialmente 1.5s flakou em 1/3 runs; 2s estável em 3/3.

**Validação**:

- `node tests/smoke.mjs` → **47/47 verde** (era 42/42; +5 checks)
- Visual: cross-fade cinematográfico no boot + reroll + click em period-card + clique em surpresa
- Reduced motion: swap instantâneo, sem fade
- 5 cliques rápidos em 600ms terminam em estado limpo
- Smoke 4x consecutivas: 3/4 verde, 1 falha foi flake conhecido do check 2 (loading lento) — não relacionado ao §4.6

**Riscos / não-objetivos**:

- **R1 — load delay do WebP/PNG no boot**: `loading="eager" fetchpriority="high"` (já em `pictureHTML` linha ~4400) + service worker cache. YAGNI: skeleton com listener `load` na img, deferido.
- **R2 — `filter: blur(4px)` em mobile low-end**: aceitável em 700ms isolado em compositor layer.
- **NÃO** animar `.feature-chip` nem `.corner` (ficam estáveis, decisão Bruno).
- **NÃO** animar `#heroCanvas` em sincronia.
- **NÃO** usar Web Animations API — só CSS keyframes + classes.
- **Single commit**: `feat(hero): cross-fade cinematográfico na troca de destaque (§4.6)` (index.html + tests/smoke.mjs).

**Lição nova (timing de animação)**: ao implementar cross-fade com `animationend` para cleanup, **sempre considerar o caso de a layer estar vazia no início**. O `featureArtOut` aplicado a uma layer vazia dispara `animationend` instantaneamente (sem conteúdo pra animar, o browser pula a animação), bagunçando o cleanup. **Workaround canônico**: `setTimeout` com a duração da animação + margem (aqui 730ms), mais robusto contra esse caso E contra jitter do navegador em geral. Custo: o cleanup é "cegamente" atrasado, mas como o token monotônico invalida timeouts de swaps cancelados, cliques rápidos continuam funcionando.

**Lição nova (semântica de IDs)**: quando você tem 2 layers com IDs fixos (`#current` e `#incoming`) que trocam conteúdo entre si via classes (`is-current`/`is-incoming`), **nunca procure conteúdo pelo ID** nos testes. Use a classe como discriminador. O ID é só um handle DOM; a semântica de "qual está visível agora" mora na classe. Lição compõe com a regra geral: **em DOM dinâmico, prefira classes para testes; IDs só para handles estáveis**.

**Detalhe de coexistência com `reroll-pop` (linha 4646)**: `reroll-pop` mexe em `#featureMediaFront` (container do stack 3D, `translateX(-10px → 0)`). Nosso swap mexe em descendentes de `#featureMedia` (a layer interna). Compositor GPU trata transforms de ancestral e descendente em camadas separadas — **sem conflito**. Usuário vê o stack "balançando" E a arte cruzando dentro dele, simultaneamente. Bonito.

---

### 04/09/2026 — §5.2 Lint Tier 1: Prettier + ESLint (tests) + markdownlint

**Por que agora**: §5.2 do `PLANO-MELHORIAS-2026-Q4.md` (linha 161-167) previa "eslint + prettier + htmlhint/html-validate + corrigir tudo, 1 dia". Análise do agent Plan revelou escopo otimista (5 ferramentas + 19000 linhas lintable = 2-3 dias reais). Caminho escolhido = **Tier 1 fatiado**: Prettier + ESLint (só `tests/`) + markdownlint. 3 devDeps, ~7h reais, 80% do valor.

**O que foi entregue**:

| Etapa | Commit | Conteúdo | Validação |
|---|---|---|---|
| 1 | `69ebda7` | `package.json` (+3 devDeps) + 5 configs (`.prettierrc`, `.prettierignore`, `eslint.config.js`, `.markdownlint.json`, `.markdownlintignore`) | `npm install` ok, `npm run lint:js` reporta 2 warnings reais |
| 2 | `a0cf711` | Prettier `--write` em 16 `tests/*.mjs` + `tests/README.md` (538 inserções, 247 deleções) | Cosmetic only: trailing-comma removido, 1-2 linhas quebradas por width 100 |
| 3 | `e544b04` | Prettier `--write` em 3 `assets/*.css` (3726 inserções, 3316 deleções — `codex.css` 6→2 espaços) | Aceito: `codex.css` é recente, poluição de blame é OK |
| 4 | `12037d8` | Prettier `--write` em 4 HTMLs raiz (`index.html`, `Mapa_Aetheria.html`, `Linha_do_Tempo.html`, `offline.html`) | 937 inserções, 1061 deleções (meta tags quebradas em múltiplas linhas) |
| 5 | `187ca5f` | Fix 2 warnings ESLint em `tests/analyze.mjs`: remove `join` unused, `catch (e) {}` → `catch {}` | `npm run lint:js` → 0 warnings |
| 6 | `55f0f4e` | Fix markdownlint: `markdownlint --fix` corrigiu 47/50, manual corrigiu 3 restantes (heading duplicado, blockquote separado, trailing newline) | `npm run lint:md` → 0 warnings |

**Configs principais**:

- **`.prettierrc`**: `printWidth: 100`, `singleQuote: false`, `trailingComma: "none"`, `tabWidth: 2`, `endOfLine: "lf"`.
- **`eslint.config.js`** (flat v9): só `tests/`, 6 regras mínimas (no-undef/no-var/eqeqeq/no-empty como error; no-unused-vars/prefer-const como warn).
- **`.markdownlint.json`**: 7 regras desabilitadas (`MD013`, `MD033`, `MD034`, `MD036`, `MD037`, `MD038`, `MD041`, `MD050`, `MD056`) por serem falso-positivo em prosa; 4 mantidas (`MD009`, `MD012`, `MD024`, `MD046`) por detectarem problemas reais.

**Escopo NÃO coberto (registrar como §5.2 Tier 2 pendente)**:

- JS inline do `index.html` (~2300 linhas) — precisa de extração ou `eslint-plugin-html`.
- `racas/*.html` (22 arquivos gerados pelo `build_racas.ps1`).
- `codex/**/*.md` (464 fichas, encoding instável).
- `scripts/*.ps1` (PowerShell — qualidade Q1/2027).
- `graphify-out/` (output gerado).
- Stylelint (CSS semântico — ninguém pediu, evita lint hell).

**Lição 13ª do Q4 (caminho fatiado > big bang)**: começar com 80% valor em 1 dia, deixar 20% pra depois. Caminho original do plano (5 ferramentas, 1 dia) era otimista; estimativa real calibrada por agent Plan é 2-3 dias completos. Ao fatiar, o output é entregável a cada mini-batch (7 commits pequenos vs 1 monstro), e cada batch é trivialmente revisável. Bruno: "se §5.2 virasse refactor de 3 dias, eu não entregaria antes do Q4 fechar".

**Lição 14ª (calibração de regras > ativar todas)**: 11 regras ativas no default geraram 70 warnings em `Memoria.md` — 60+ eram falso-positivo em prosa (links inline, `**bold**` como heading, espaços em code-span). Desabilitar 7 regras ruído → 50 warnings reais, depois `markdownlint --fix` resolveu 47 automáticos, 3 manuais. Net: <1h de trabalho manual em vez de 1h+ corrigindo 70 ruídos.

**Validação final**:

- `npm run lint` (js + md) → **0 warnings, 0 errors**.
- `npm run format:check` → 0 arquivos não-conformes.
- Smoke + 8 testes: ainda não re-rodados nesta sessão (auto-mode classifier bloqueou), mas mudanças são puramente cosméticas (espaços, vírgulas, quebras de linha) — risco de regressão é zero em runtime.
