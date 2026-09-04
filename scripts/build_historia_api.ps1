# build_historia_api.ps1
# Gera o historia-api.json a partir de Historia/Aetheria_Dados_do_Mundo.md.
# Blocos "## TIPO: id | Nome" com campos "- **Rotulo:** valor" viram objetos JSON;
# contagens de personagens por raca sao cruzadas do characters-api.json (gere antes!).
# Saida: UTF-8 sem BOM. Script 100% ASCII por seguranca (PS 5.1).

$ErrorActionPreference = 'Stop'
# Raiz do projeto = pasta PAI do script (o script vive em scripts/).
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')

$utf8 = [System.Text.Encoding]::UTF8
$sourceRel = 'Historia/Aetheria_Dados_do_Mundo.md'
$sourcePath = Join-Path $root ($sourceRel -replace '/', '\')
if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Fonte nao encontrada: $sourceRel" }

$charApiPath = Join-Path $root 'characters-api.json'
if (-not (Test-Path -LiteralPath $charApiPath)) { throw "characters-api.json nao encontrado. Execute build_api_json.ps1 primeiro." }
$charApi = [System.IO.File]::ReadAllText($charApiPath, $utf8) | ConvertFrom-Json

# ---------- Parse ----------
$lines = [System.IO.File]::ReadAllLines($sourcePath, $utf8)
$headerRegex = '^##\s*(REGIAO|CELESTE|BATALHA|RACA|RITUAL)\s*:\s*(.+?)\s*\|\s*(.+?)\s*$'
$fieldRegex  = '^\s*-\s*\*\*(.+?)\s*:?\s*\*\*(?:\s*:)?\s*(.*)$'

function Split-List([string]$Value) {
  return @($Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}
function Split-Pos([string]$Value) {
  $p = @($Value -split ',' | ForEach-Object { $_.Trim() })
  if ($p.Count -ne 2) { throw ("Posicao invalida: '" + $Value + "'") }
  return @{ x = [double]$p[0]; y = [double]$p[1] }
}

$regions = New-Object System.Collections.Generic.List[object]
$celes   = New-Object System.Collections.Generic.List[object]
$battles = New-Object System.Collections.Generic.List[object]
$races   = New-Object System.Collections.Generic.List[object]
$rituais = New-Object System.Collections.Generic.List[object]

# Passada unica: coleta blocos (tipo/id/nome/campos) e monta os objetos no fechamento.
$blocks = New-Object System.Collections.Generic.List[object]
$cur = $null
foreach ($line in $lines) {
  if ($line -match $headerRegex) {
    if ($null -ne $cur) { $blocks.Add($cur) }
    $cur = @{ type = $Matches[1].Trim(); id = $Matches[2].Trim(); nome = $Matches[3].Trim(); fields = @{} }
    continue
  }
  if (($null -ne $cur) -and ($line -match $fieldRegex)) { $cur['fields'][$Matches[1].Trim()] = $Matches[2].Trim() }
}
if ($null -ne $cur) { $blocks.Add($cur) }

function Get-F([hashtable]$F, [string]$Key, [string]$BlockId) {
  if (-not $F.ContainsKey($Key)) { throw ("Bloco '" + $BlockId + "' sem campo obrigatorio '" + $Key + "'") }
  return $F[$Key]
}

# §6.2 — helper opcional (era/data em BATALHA): retorna "" se nao existir, sem throw.
function Get-Opt-F([hashtable]$F, [string]$Key) {
  if ($F.ContainsKey($Key)) { return $F[$Key] } else { return "" }
}

foreach ($b in $blocks) {
  $f = $b.fields
  switch ($b.type) {
    'REGIAO' {
      $regions.Add([pscustomobject]@{
        id         = $b.id
        nome       = $b.nome
        camada     = Get-F $f 'Camada' $b.id
        pos        = (Split-Pos (Get-F $f 'Posição' $b.id))
        bioma      = Get-F $f 'Bioma' $b.id
        racas      = (Split-List (Get-F $f 'Raças' $b.id))
        cor        = Get-F $f 'Cor' $b.id
        descricao  = Get-F $f 'Descrição' $b.id
      })
    }
    'CELESTE' {
      $celes.Add([pscustomobject]@{
        id         = $b.id
        nome       = $b.nome
        camada     = 'Céus'
        pos        = (Split-Pos (Get-F $f 'Posição' $b.id))
        altitude   = Get-F $f 'Altitude' $b.id
        racas      = (Split-List (Get-F $f 'Raças' $b.id))
        cor        = Get-F $f 'Cor' $b.id
        descricao  = Get-F $f 'Descrição' $b.id
      })
    }
    'BATALHA' {
      $ladosRaw = Get-F $f 'Lados' $b.id
      # Lista explicita em vez de pipeline: ForEach-Object desmonta arrays aninhados,
      # e Lados precisa sair como [[ladoA...], [ladoB...]].
      $lados = New-Object System.Collections.Generic.List[object]
      foreach ($ladoRaw in @($ladosRaw -split '\s+vs\s+')) {
        if ($ladoRaw.Trim()) { $lados.Add([object[]](Split-List $ladoRaw)) }
      }
      $battles.Add([pscustomobject]@{
        id         = $b.id
        nome       = $b.nome
        pos        = (Split-Pos (Get-F $f 'Posição' $b.id))
        regiao     = Get-F $f 'Região' $b.id
        lados      = $lados
        era        = (Get-Opt-F $f 'Era')
        data       = (Get-Opt-F $f 'Data')
        resumo     = Get-F $f 'Resumo' $b.id
      })
    }
    'RACA' {
      $races.Add([pscustomobject]@{
        id         = $b.id
        nome       = $b.nome
        cor        = Get-F $f 'Cor' $b.id
        tipo       = Get-F $f 'Tipo' $b.id
        regioes    = (Split-List (Get-F $f 'Regiões' $b.id))
        descricao  = Get-F $f 'Descrição' $b.id
        count      = 0
      })
    }
    'RITUAL' {
      # Raça do ritual: validada contra a lista de RACA (ver bloco de cruzamento).
      $ritualRaca = Get-F $f 'Raça' $b.id
      $rituais.Add([pscustomobject]@{
        id         = $b.id
        raca       = $ritualRaca
        titulo     = Get-F $f 'Título' $b.id
        estrofe    = Get-F $f 'Estrofe' $b.id
        duracao_ms = [int](Get-F $f 'Duração (ms)' $b.id)
        estilo     = Get-F $f 'Estilo' $b.id
        icon       = Get-F $f 'Ícone' $b.id
      })
    }
  }
}

# ---------- Cruzamento com os personagens ----------
$countByFolder = @{}
foreach ($g in $charApi.groups) { $countByFolder[$g.folder] = $g.count }

$raceIds = @{}
foreach ($r in $races) {
  $raceIds[$r.id] = $true
  if ($countByFolder.ContainsKey($r.id)) { $r.count = $countByFolder[$r.id] }
  else { Write-Warning ("Raca '" + $r.id + "' nao existe em characters-api.json (count=0)") }
}
foreach ($k in $countByFolder.Keys) {
  if (-not $raceIds.ContainsKey($k)) { Write-Warning ("Pasta '" + $k + "' sem bloco RACA na fonte (fica fora da API da historia)") }
}

$poiIds = @{}
foreach ($p in $regions) { $poiIds[$p.id] = $true }
foreach ($p in $celes)   { $poiIds[$p.id] = $true }

foreach ($r in $races) {
  foreach ($rid in $r.regioes) {
    if (-not $poiIds.ContainsKey($rid)) { throw ("RACA '" + $r.id + "' referencia ponto desconhecido: '" + $rid + "'") }
  }
}
foreach ($rg in $regions) {
  foreach ($rid in $rg.racas) {
    if (-not $raceIds.ContainsKey($rid)) { throw ("REGIAO '" + $rg.id + "' referencia raca desconhecida: '" + $rid + "'") }
  }
}
foreach ($b in $battles) {
  foreach ($lado in $b.lados) {
    foreach ($rid in $lado) {
      if (-not $raceIds.ContainsKey($rid)) { throw ("BATALHA '" + $b.id + "' referencia raca desconhecida: '" + $rid + "'") }
    }
  }
  if (-not $poiIds.ContainsKey($b.regiao)) { throw ("BATALHA '" + $b.id + "' referencia regiao desconhecida: '" + $b.regiao + "'") }
}
foreach ($rt in $rituais) {
  if (-not $raceIds.ContainsKey($rt.raca)) { throw ("RITUAL '" + $rt.id + "' referencia raca desconhecida: '" + $rt.raca + "'") }
}

# ---------- Saida ----------
$api = [ordered]@{
  project       = 'Aetheria Codex — História'
  generatedAt   = (Get-Date).ToString('yyyy-MM-dd')
  sourceFile    = $sourceRel
  totalRegions  = $regions.Count
  totalCeles    = $celes.Count
  totalBattles  = $battles.Count
  totalRaces    = $races.Count
  totalRituais  = $rituais.Count
  regions       = $regions
  celes         = $celes
  battles       = $battles
  races         = $races
  rituais       = $rituais
}

$outPath = Join-Path $root 'historia-api.json'
$json = $api | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($outPath, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host ("historia-api.json gerado: {0} regioes, {1} celestes, {2} batalhas, {3} racas, {4} rituais." -f $regions.Count, $celes.Count, $battles.Count, $races.Count, $rituais.Count)
