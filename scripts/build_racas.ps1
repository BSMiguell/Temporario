# ============================================================
# build_racas.ps1 — gera as 21 páginas de raça (racas/*.html)
# Fontes: characters-api.json + historia-api.json (nunca os .md)
# Os dados de cada raça vão EMBUTIDOS na página (funciona em file://).
# Assets compartilhados escritos à mão: racas/assets/raca.css e raca.js
#
# ⚠️ PowerShell 5.1: este arquivo DEVE ser salvo em UTF-8 COM BOM.
# ============================================================

$ErrorActionPreference = "Stop"

# raiz do projeto = pasta PAI de scripts/ (mesmo padrão dos demais scripts)
$root = (Split-Path -Parent $PSScriptRoot).TrimEnd('\')
$apiPath = Join-Path $root "characters-api.json"
$histPath = Join-Path $root "historia-api.json"
$outDir = Join-Path $root "racas"

if (-not (Test-Path $apiPath)) { throw "Não encontrei $apiPath" }
if (-not (Test-Path $histPath)) { throw "Não encontrei $histPath" }

$api = [IO.File]::ReadAllText($apiPath) | ConvertFrom-Json
$hist = [IO.File]::ReadAllText($histPath) | ConvertFrom-Json

# ------------------------------------------------------------
# Tabela de temas - fonte canonica em data/themes.json (o array
# inline em index.html continua existindo para evitar round-trip).
# ------------------------------------------------------------
$themesJsonPath = Join-Path $root 'data/themes.json'
if (-not (Test-Path $themesJsonPath)) { throw "Nao encontrei $themesJsonPath" }
$themesData = [IO.File]::ReadAllText($themesJsonPath) | ConvertFrom-Json
$themes = @()
foreach ($t in $themesData.themes) {
    $themes += @{ label = $t.label; color = $t.color; icon = $t.icon }
}

# slug idêntico ao slugify() do index.html: NFD → tira marcas →
# minúsculas → só [a-z0-9] → tira prefixo numérico da pasta
function Get-Slug {
    param([string]$s)
    $formD = $s.Normalize([System.Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    foreach ($ch in $formD.ToCharArray()) {
        $cat = [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)
        if ($cat -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$sb.Append($ch)
        }
    }
    $clean = ($sb.ToString() -replace '[^a-zA-Z0-9]', '').ToLower()
    return ($clean -replace '^\d+', '')
}

function Get-ThemeForFolder {
    param([string]$folder)
    $key = Get-Slug $folder
    foreach ($t in $themes) {
        if ((Get-Slug $t.label) -eq $key) { return $t }
    }
    # fallback (não deve acontecer com as 21 pastas conhecidas)
    Write-Warning "Tema não encontrado para '$folder'; usando fallback laranja."
    return @{ label = ($folder -replace '^\d+_', ''); color = "#e3491b"; icon = "📁" }
}

# mapa id→nome das regiões (para chips de lore)
$regionNames = @{}
foreach ($rg in $hist.regions) { $regionNames[$rg.id] = $rg.nome }

# W7: rituais por raça. Array no historia-api.json; pode ser vazio.
# Casa por `raca` (folder). Ordem do array = ordem dos pills na página.
$rituais = @()
if ($hist.rituais) { $rituais = @($hist.rituais) }

# ------------------------------------------------------------
# Template da página gerada — here-string SINGLE-quoted com tokens.
# Contrato de IDs/classes com racas/assets/raca.js — NÃO renomear.
# ------------------------------------------------------------
$template = @'
<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark" style="--group-color:__COLOR__;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="canonical" href="https://bsmiguell.github.io/Temporario/racas/__SLUG__.html">
  <title>__LABEL__ — Aetheria Codex</title>
  <meta name="description" content="Página da raça __LABEL__: __COUNT__ personagens do Aetheria Codex em showcase rotativo.">
  <meta name="theme-color" content="__COLOR__">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Aetheria Codex">
  <meta property="og:title" content="__LABEL__ — Aetheria Codex">
  <meta property="og:description" content="Conheça os __COUNT__ personagens da raça __LABEL__ no Aetheria Codex. Cards, lore e galeria.">
  <meta property="og:url" content="https://bsmiguell.github.io/Temporario/racas/__SLUG__.html">
  <meta property="og:image" content="https://bsmiguell.github.io/Temporario/assets/og-cover.jpg">
  <meta property="og:locale" content="pt_BR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="__LABEL__ — Aetheria Codex">
  <meta name="twitter:description" content="Conheça os __COUNT__ personagens da raça __LABEL__ no Aetheria Codex.">
  <meta name="twitter:image" content="https://bsmiguell.github.io/Temporario/assets/og-cover.jpg">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='88'%3E__ICON_ENC__%3C/text%3E%3C/svg%3E">
  <script>try{var t=localStorage.getItem("racasTheme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/raca.css?v=__ASSET_VER__">
</head>
<body data-slug="__SLUG__" data-layout="__LAYOUT__">
<a class="skip-link" href="#mainContent">Pular para a lista de personagens</a>

<header class="site-head">
  <a class="brand" href="../index.html"><span class="brand-mark">Æ</span><span class="brand-name">Aetheria Codex</span></a>
  <div class="head-race"><span class="head-icon">__ICON__</span><span class="head-label">__LABEL__</span></div>
  <nav class="head-nav" aria-label="Navegação principal">
    <div class="race-picker">
      <button class="picker-btn" id="pickerBtn" aria-haspopup="listbox" aria-expanded="false"><span>Raças</span><span class="picker-caret">▾</span></button>
      <div class="picker-menu" id="pickerMenu" role="listbox" aria-label="Ir para outra raça" hidden></div>
    </div>
    <a class="head-link" href="../index.html">Galeria</a>
    <a class="head-link" href="../Mapa_Aetheria.html">Mapa</a>
    <button class="theme-btn" id="themeBtn" aria-label="Alternar tema claro/escuro">◑</button>
  </nav>
</header>

<main id="mainContent">
  <section class="hero" id="hero" aria-roledescription="carrossel" aria-label="Membros da raça em destaque">
    <canvas id="fxCanvas" aria-hidden="true"></canvas>
    <div class="hero-watermark" id="heroWatermark" aria-hidden="true">__ICON__</div>

    <div class="hero-grid">
      <div class="hero-copy">
        <p class="hero-kicker"><span>Raça · <span id="kickerRace">__LABEL__</span></span><span class="kick-sep">·</span><span id="kickerIdx">01 / 01</span></p>
        <h1 class="hero-name" id="heroName" aria-live="polite"></h1>
        <p class="hero-epithet" id="heroEpithet"></p>
        <p class="hero-desc" id="heroDesc"></p>
        <!--HERO_STATS-->
        <ul class="hero-chips" id="heroChips"></ul>
        <div class="hero-actions">
          <button class="btn btn-solid" id="sheetBtn">Ficha completa</button>
          <!--RITUAL_PICKER-->
          <!--MAPA_BTN-->
          <a class="btn btn-line" id="galleryLink" href="../index.html#__FOLDER_ENC__">Ver na galeria ↗</a>
        </div>
      </div>

      <figure class="hero-stage">
        <div class="stage-frame" id="stageFrame">
          <div class="stage-glare" aria-hidden="true"></div>
        </div>
        <figcaption class="sr-only" id="stageCaption"></figcaption>
      </figure>
    </div>

    <div class="hero-ui">
      <button class="arrow" id="prevBtn" aria-label="Membro anterior">‹</button>
      <div class="dots" id="dots" role="tablist" aria-label="Escolher membro"></div>
      <button class="arrow" id="nextBtn" aria-label="Próximo membro">›</button>
    </div>
    <div class="hero-timer" aria-hidden="true"><span id="timerBar"></span></div>
  </section>

  <section class="lore reveal" id="lore">
    <div class="lore-watermark" aria-hidden="true">__ICON__</div>
    <div class="lore-inner">
      <header class="sec-head">
        <p class="sec-kicker">Crônica das raças</p>
        <h2 class="sec-title">__LABEL__ no mundo de Aetheria</h2>
      </header>
      <div class="lore-body">
        <div class="stat-block">
          <span class="stat-num" id="loreCount">0</span>
          <span class="stat-cap">membros registrados<br>no códice</span>
        </div>
        <div class="lore-text">
          <p id="loreDesc"></p>
          <ul class="lore-chips" id="loreChips"></ul>
        </div>
        <!--LORE_ARCHIVE-->
      </div>
    </div>
  </section>

  <section class="roster reveal" id="roster">
    <div class="roster-inner">
      <header class="sec-head">
        <p class="sec-kicker">Acervo completo</p>
        <h2 class="sec-title">Todos os membros<span class="sec-count" id="rosterCount">0</span></h2>
      </header>
      <ul class="roster-grid" id="rosterGrid"></ul>
    </div>
  </section>

  <nav class="race-nav reveal" aria-label="Navegar entre as raças">
    <a class="rn-big rn-prev" id="racePrev">
      <span class="rn-arrow" aria-hidden="true">‹</span>
      <span class="rn-body"><span class="rn-kicker">Raça anterior</span><span class="rn-name"></span></span>
    </a>
    <div class="rn-index" id="raceIndex" aria-label="Índice das raças"></div>
    <a class="rn-big rn-next" id="raceNext">
      <span class="rn-body"><span class="rn-kicker">Próxima raça</span><span class="rn-name"></span></span>
      <span class="rn-arrow" aria-hidden="true">›</span>
    </a>
  </nav>
</main>

<footer class="site-foot">
  <span>Æ Aetheria Codex — acervo autoral · <a href="../index.html">galeria</a> · <a href="../Mapa_Aetheria.html">mapa do mundo</a></span>
  <span class="foot-gen">Gerado por scripts/build_racas.ps1 em __GEN_DATE__</span>
</footer>

<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetName" hidden>
  <div class="sheet-bg" id="sheetBg"></div>
  <aside class="sheet-panel">
    <button class="sheet-close" id="sheetClose" aria-label="Fechar ficha">×</button>
    <p class="sheet-kicker">Ficha do membro</p>
    <h3 id="sheetName"></h3>
    <p class="sheet-epithet" id="sheetEpithet"></p>
    <p class="sheet-desc" id="sheetDesc"></p>
    <div class="sheet-fields" id="sheetFields"></div>
  </aside>
</div>

<noscript><p style="padding:6rem 2rem;text-align:center;font-family:sans-serif;">Ative o JavaScript para ver o showcase dos membros.</p></noscript>

<script id="race-data" type="application/json">__DATA__</script>
<script src="assets/raca.js?v=__ASSET_VER__" defer></script>
</body>
</html>
'@

# ------------------------------------------------------------
# Montagem dos dados por raça
# ------------------------------------------------------------
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$folders = @($api.groups | ForEach-Object { $_.folder })
$genDate = (Get-Date).ToString("dd/MM/yyyy HH:mm")
# W9: cache-busting — data do build vira query string em raca.css / raca.js
$assetVer = (Get-Date -Format "yyyyMMdd")
$totalMembers = 0
$noImageTotal = 0
$written = 0

# W6.1: raças com layout dedicado (hero expandido, lore 2-col, ritual, ver no mapa).
# Volume justifica o custom. Adicionar nova raça aqui se quiser o mesmo tratamento.
$dedicatedFolders = @("04_Onis", "05_Demonios")

# W8.2: raças com rituais (picker de pills na hero). Pode estar junto ou separado de $dedicatedFolders.
# Hoje: 5 raças W8 (ritual picker sem layout dedicated) + 2 raças W7 (ritual picker + layout dedicated).
$ritualRaces = @(
    "01_Humanos",      # W8: rt-hum-selo
    "04_Onis",         # W7: rt-oni-devoracao + rt-oni-honra
    "05_Demonios",     # W7: rt-demon-pacto + rt-demon-massacre + rt-demon-ressurreicao
    "08_Monstros",     # W8: rt-monstro-mandibula
    "09_Semi_Deuses",  # W8: rt-semi-raio
    "13_Deuses",       # W8: rt-deus-flash
    "17_Meio_Sangue"   # W8: rt-meio-fusao
)

for ($gi = 0; $gi -lt $api.groups.Count; $gi++) {
    $group = $api.groups[$gi]
    $folder = $group.folder
    $theme = Get-ThemeForFolder $folder
    $slug = Get-Slug $folder
    $isDedicated = $dedicatedFolders -contains $folder
    $isRitual = $ritualRaces -contains $folder
    $layoutClass = if ($isDedicated) { "dedicated" } else { "generic" }

    # membros ordenados por número (Aatrox primeiro nos Demônios etc.)
    # Fonte única: os grupos do próprio grupo (o array flat saiu do JSON em 26/08/2026).
    $chars = @($group.characters |
        Sort-Object { [int]$_.number })

    $members = New-Object System.Collections.Generic.List[object]
    $noImage = 0
    foreach ($c in $chars) {
        $img = $null
        if ($c.image) { $img = "../" + $c.image } else { $noImage++ }
        $attrs = $null
        if ($c.attributes) {
            $attrs = [ordered]@{}
            foreach ($k in @("race", "physical", "faceAndHair", "outfit", "palette", "equipment")) {
                $v = $c.attributes.$k
                if ($v) { $attrs[$k] = $v }
            }
            if ($attrs.Count -eq 0) { $attrs = $null }
        }
        $members.Add([ordered]@{
            number      = [int]$c.number
            title       = $c.title
            name        = $c.name
            id          = $c.id
            image       = $img
            description = $c.description
            attributes  = $attrs
        })
    }
    $totalMembers += $members.Count
    $noImageTotal += $noImage

    # lore a partir do historia-api (races[] casa por id === folder)
    $raceBlock = $hist.races | Where-Object { $_.id -eq $folder } | Select-Object -First 1
    $lore = ""
    $tipo = ""
    $regioes = @()
    if ($raceBlock) {
        $lore = $raceBlock.descricao
        $tipo = $raceBlock.tipo
        $regioes = @($raceBlock.regioes | ForEach-Object {
            if ($regionNames.ContainsKey($_)) { $regionNames[$_] } else { $_ }
        })
    }
    else {
        Write-Warning ("historia-api sem bloco RACA para '{0}' — página sai sem lore." -f $folder)
    }

    # W7: rituais da raça (pode ser vazio; ordem preservada do JSON)
    $rituaisDaRaca = @($rituais | Where-Object { $_.raca -eq $folder })

    # vizinhas no ciclo das 21 raças + índice completo
    $prevG = $api.groups[($gi - 1 + $api.groups.Count) % $api.groups.Count]
    $nextG = $api.groups[($gi + 1) % $api.groups.Count]
    $prevTheme = Get-ThemeForFolder $prevG.folder
    $nextTheme = Get-ThemeForFolder $nextG.folder

    $allRaces = New-Object System.Collections.Generic.List[object]
    for ($j = 0; $j -lt $api.groups.Count; $j++) {
        $g2 = $api.groups[$j]
        $t2 = Get-ThemeForFolder $g2.folder
        $allRaces.Add([ordered]@{
            href  = "{0}.html" -f (Get-Slug $g2.folder)
            label = $t2.label
            color = $t2.color
            icon  = $t2.icon
            count = [int]$g2.count
        })
    }

    $payload = [ordered]@{
        race = [ordered]@{
            folder  = $folder
            label   = $theme.label
            color   = $theme.color
            icon    = $theme.icon
            lore    = $lore
            tipo    = $tipo
            regioes = $regioes
            count   = [int]$group.count
        }
        rituais   = $rituaisDaRaca
        members   = $members
        neighbors = [ordered]@{
            prev = [ordered]@{ href = "{0}.html" -f (Get-Slug $prevG.folder); label = $prevTheme.label; color = $prevTheme.color; icon = $prevTheme.icon }
            next = [ordered]@{ href = "{0}.html" -f (Get-Slug $nextG.folder); label = $nextTheme.label; color = $nextTheme.color; icon = $nextTheme.icon }
        }
        allRaces     = $allRaces
        generatedAt  = (Get-Date -Format "yyyy-MM-dd")
    }

    $json = ConvertTo-Json $payload -Depth 12 -Compress
    # segurança: impede fechamento acidental da tag <script> dentro do JSON
    $json = $json.Replace('</', '<\/')

    $iconEnc = [Uri]::EscapeDataString($theme.icon)
    $folderEnc = [Uri]::EscapeDataString($folder)

    $html = $template
    $html = $html.Replace('__TITLE__', "$($theme.label) — Aetheria Codex")
    $html = $html.Replace('__LABEL__', $theme.label)
    $html = $html.Replace('__COLOR__', $theme.color)
    $html = $html.Replace('__ICON_ENC__', $iconEnc)
    $html = $html.Replace('__ICON__', $theme.icon)
    $html = $html.Replace('__SLUG__', $slug)
    $html = $html.Replace('__FOLDER_ENC__', $folderEnc)
    $html = $html.Replace('__COUNT__', [string]$group.count)
    $html = $html.Replace('__GEN_DATE__', $genDate)
    # W9: cache-busting — query string muda a cada build (yyyyMMdd)
    $html = $html.Replace('__ASSET_VER__', $assetVer)
    $html = $html.Replace('__DATA__', $json)
    $html = $html.Replace('__LAYOUT__', $layoutClass)

    # ---- W6.1: placeholders do layout dedicado ----
    if ($isDedicated) {
        $mapaBtn = "<a class=`"btn btn-line`" id=`"mapaLink`" href=`"../Mapa_Aetheria.html#g=$($folder)`"><svg class=`"btn-icon`" viewBox=`"0 0 24 24`" aria-hidden=`"true`" fill=`"none`" stroke=`"currentColor`" stroke-width=`"2`" stroke-linecap=`"round`" stroke-linejoin=`"round`"><path d=`"M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z`"/><path d=`"M9 4v14`"/><path d=`"M15 6v14`"/></svg><span>Ver no mapa</span></a>"
        $html = $html.Replace('<!--MAPA_BTN-->', $mapaBtn)

        # hero-stats: membros / regiões / 1º membro (nome curto)
        $nRegioes = @($regioes).Count
        $primeiro = $members | Select-Object -First 1
        $primeiroNome = if ($primeiro) { (($primeiro.title -split ',')[0]).Trim() } else { '—' }
        $primeiroCurto = ($primeiroNome -replace '\s.*', '')
        if ([string]::IsNullOrWhiteSpace($primeiroCurto)) { $primeiroCurto = '—' }
        $regLabel = if ($nRegioes -eq 1) { "região" } else { "regiões" }
        $heroStats = "<div class=`"hero-stats`"><div class=`"hero-stat`"><strong>$($members.Count)</strong><span>membros</span></div><div class=`"hero-stat`"><strong>$nRegioes</strong><span>$regLabel</span></div><div class=`"hero-stat`"><strong>$primeiroCurto…</strong><span>1º membro</span></div></div>"
        $html = $html.Replace('<!--HERO_STATS-->', $heroStats)

        # lore-archive: aside populado pelo JS (raca.js fillArchive)
        $html = $html.Replace('<!--LORE_ARCHIVE-->', '<aside class="lore-archive" id="loreArchive"></aside>')
    } else {
        $html = $html.Replace('<!--MAPA_BTN-->', '')
        $html = $html.Replace('<!--HERO_STATS-->', '')
        $html = $html.Replace('<!--LORE_ARCHIVE-->', '')
    }

    # ---- W7/W8: ritual picker — roda pra qualquer raça em $ritualRaces ----
    # Separado do if $isDedicated porque o W8 adiciona rituais a raças com layout generic.
    if ($isRitual) {
        $rituaisDaRaca = @($rituais | Where-Object { $_.raca -eq $folder })
        if ($rituaisDaRaca.Count -gt 0) {
            $pillList = @()
            foreach ($r in $rituaisDaRaca) {
                $pillList += ('<button class="ritual-pill ritual-pill--' + $r.estilo + '" data-ritual="' + $r.id + '" type="button" aria-pressed="false">' + $r.icon + ' ' + $r.titulo + '</button>')
            }
            $ritualPicker = '<div class="ritual-picker" id="ritualPicker">' + (-join $pillList) + '</div>'
        } else {
            # fallback W6: 1 botão (raça em $ritualRaces mas sem rituais no JSON)
            $ritualPicker = '<button class="btn btn-line" id="invocarRitualBtn" type="button">🔥 Invocar ritual</button>'
        }
        $html = $html.Replace('<!--RITUAL_PICKER-->', $ritualPicker)
    } else {
        $html = $html.Replace('<!--RITUAL_PICKER-->', '')
    }

    $outPath = Join-Path $outDir ("{0}.html" -f $slug)
    [IO.File]::WriteAllText($outPath, $html, (New-Object System.Text.UTF8Encoding($false)))
    $written++
    Write-Host ("  ✓ {0,-28} {1,3} membros{2}" -f "$($theme.label)", $members.Count, $(if ($noImage -gt 0) { "  ($noImage sem arte)" } else { "" }))
}

# ------------------------------------------------------------
# Validações finais
# ------------------------------------------------------------
Write-Host ""
Write-Host "=== build_racas concluído ==="
Write-Host ("Páginas geradas : {0} (esperado: {1})" -f $written, $api.groups.Count)
Write-Host ("Membros embutidos: {0} (esperado: {1})" -f $totalMembers, $api.totalCharacters)
Write-Host ("Sem arte        : {0}" -f $noImageTotal)
Write-Host ("Rituais embutidos: {0} (esperado: {1})" -f $rituais.Count, $hist.totalRituais)

if ($written -ne $api.groups.Count) { throw "Quantidade de páginas divergente!" }
if ($totalMembers -ne $api.totalCharacters) { throw "Soma de membros divergente!" }
if ($rituais.Count -ne $hist.totalRituais) { throw "Quantidade de rituais divergente!" }

foreach ($asset in @("raca.css", "raca.js")) {
    $p = Join-Path (Join-Path $root "racas\assets") $asset
    if (-not (Test-Path $p)) { Write-Warning "Asset ausente: $p" }
}
