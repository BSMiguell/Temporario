# dedupe_images.ps1
# Remove PNGs orfaos que sao duplicatas identicas (hash) de imagens ja referenciadas
# na mesma pasta — caso tipico: a sincronizacao externa restaura o arquivo com o nome
# com typo depois de ele ja ter sido renomeado.
# Arquivos orfaos com mesmo nome normalizado mas CONTEUDO diferente sao mantidos e reportados.

$ErrorActionPreference = 'Stop'
# Raiz do projeto = pasta PAI do script (o script vive em scripts/).
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')

function Get-NormalizedName {
  param([string]$Value)
  $clean = $Value.ToLowerInvariant()
  $clean = $clean -replace '[-_ ]?v[-_ ]?\d+$', ''
  $clean = $clean -replace '[^a-z0-9]+', ''
  return $clean
}

function Get-Levenshtein {
  param([string]$A, [string]$B)
  $m = $A.Length; $n = $B.Length
  $d = New-Object 'int[,]' ($m + 1), ($n + 1)
  for ($i = 0; $i -le $m; $i++) { $d[$i, 0] = $i }
  for ($j = 0; $j -le $n; $j++) { $d[0, $j] = $j }
  for ($i = 1; $i -le $m; $i++) {
    for ($j = 1; $j -le $n; $j++) {
      $cost = 0
      if ($A[($i - 1)] -ne $B[($j - 1)]) { $cost = 1 }
      $del = $d[($i - 1), $j] + 1
      $ins = $d[$i, ($j - 1)] + 1
      $sub = $d[($i - 1), ($j - 1)] + $cost
      $min = [Math]::Min($del, $ins)
      if ($sub -lt $min) { $min = $sub }
      $d[$i, $j] = $min
    }
  }
  return $d[$m, $n]
}

$apiPath = Join-Path $root 'characters-api.json'
if (-not (Test-Path -LiteralPath $apiPath)) { throw "characters-api.json nao encontrado. Execute build_api_json.ps1 primeiro." }
$api = [System.IO.File]::ReadAllText($apiPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json

$removed = 0
$different = @()

foreach ($g in $api.groups) {
  # Pastas das racas vivem em codex/ desde 26/08/2026.
  $folderPath = Join-Path (Join-Path $root 'codex') $g.folder
  if (-not (Test-Path -LiteralPath $folderPath)) { continue }

  $usedNames = @($g.characters | Where-Object { $_.image } | ForEach-Object { Split-Path $_.image -Leaf })
  if ($usedNames.Count -eq 0) {
    Write-Host ("AVISO: pasta {0} tem personagens mas nenhuma imagem referenciada (ou nenhum .md)." -f $g.folder)
    continue
  }

  # Nomes normalizados das imagens referenciadas (para pareamento por typo)
  $usedNorms = @($usedNames | ForEach-Object { Get-NormalizedName ([IO.Path]::GetFileNameWithoutExtension($_)) })

  $orphans = @(Get-ChildItem -LiteralPath $folderPath -File -Filter '*.png' | Where-Object { $_.Name -notin $usedNames })

  foreach ($o in $orphans) {
    $oNorm = Get-NormalizedName ([IO.Path]::GetFileNameWithoutExtension($o.Name))

    # Achar a imagem referenciada mais proxima (typo = distancia <= 2, pareamento unico)
    $bestIndex = -1; $bestDist = 99
    for ($k = 0; $k -lt $usedNorms.Count; $k++) {
      $dist = Get-Levenshtein -A $oNorm -B $usedNorms[$k]
      if ($dist -lt $bestDist) { $bestDist = $dist; $bestIndex = $k }
    }
    if ($bestIndex -lt 0 -or $bestDist -gt 2) { continue }

    # Empate? Nao remover em caso ambiguo.
    $ties = 0
    for ($k = 0; $k -lt $usedNorms.Count; $k++) {
      if ((Get-Levenshtein -A $oNorm -B $usedNorms[$k]) -eq $bestDist) { $ties++ }
    }
    if ($ties -gt 1) {
      $different += ("{0}/{1} (pareamento ambiguio - MANTIDO)" -f $g.folder, $o.Name)
      continue
    }

    $twinName = $usedNames[$bestIndex]
    $twinPath = Join-Path $folderPath $twinName
    $hOrphan = (Get-FileHash -LiteralPath $o.FullName).Hash
    $hTwin   = (Get-FileHash -LiteralPath $twinPath).Hash

    if ($hOrphan -eq $hTwin) {
      Remove-Item -LiteralPath $o.FullName -Confirm:$false
      $removed++
      Write-Host ("  REMOVIDO (duplicata identica de {0}): {1}/{2}" -f $twinName, $g.folder, $o.Name)
    } else {
      $different += ("{0}/{1} (conteudo difere de {2} - MANTIDO para revisao: pode ser arte atualizada)" -f $g.folder, $o.Name, $twinName)
    }
  }
}

Write-Host ""
Write-Host "Duplicatas identicas removidas: $removed"
foreach ($d in $different) { Write-Host ("  DIFERENTE: " + $d) }
