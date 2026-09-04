# fix_image_typos.ps1
# Renomeia PNGs orfaos cujos nomes sao typos evidentes de personagens sem imagem.
# Criterio conservador: distancia de Levenshtein <= 2 entre nomes normalizados
# e pareamento UNICO dentro da pasta. Casos ambiguos sao apenas reportados.

$ErrorActionPreference = 'Stop'
# Raiz do projeto = pasta PAI do script (o script vive em scripts/).
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')

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
      $del  = $d[($i - 1), $j] + 1
      $ins  = $d[$i, ($j - 1)] + 1
      $sub  = $d[($i - 1), ($j - 1)] + $cost
      $min  = [Math]::Min($del, $ins)
      if ($sub -lt $min) { $min = $sub }
      $d[$i, $j] = $min
    }
  }
  return $d[$m, $n]
}

function Get-NormalizedName {
  param([string]$Value)
  $clean = $Value.ToLowerInvariant()
  $clean = $clean -replace '[-_ ]?v[-_ ]?\d+$', ''
  $clean = $clean -replace '[^a-z0-9]+', ''
  return $clean
}

$apiPath = Join-Path $root 'characters-api.json'
$api = [System.IO.File]::ReadAllText($apiPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json

$usedImages = @{}
# O JSON nao tem mais o array flat "characters" (26/08/2026); derivar dos grupos.
$api.groups | ForEach-Object { $_.characters } | Where-Object { $_.image } | ForEach-Object {
  $usedImages[(Split-Path $_.image -Leaf)] = $true
}

$renamed = 0
foreach ($g in $api.groups) {
  # Pastas das racas vivem em codex/ desde 26/08/2026.
  $folderPath = Join-Path (Join-Path $root 'codex') $g.folder
  $needImage = @($g.characters | Where-Object { -not $_.image })
  if ($needImage.Count -eq 0) { continue }

  $orphans = @(Get-ChildItem -LiteralPath $folderPath -File -Filter '*.png' |
    Where-Object { -not $usedImages.ContainsKey($_.Name) })

  foreach ($png in $orphans) {
    $pngNorm = Get-NormalizedName $png.BaseName
    $candidates = @()
    foreach ($ch in $needImage) {
      $charNorm = Get-NormalizedName $ch.name
      $dist = Get-Levenshtein -A $pngNorm -B $charNorm
      if ($dist -le 2) {
        $candidates += [pscustomobject]@{ Char = $ch; Dist = $dist }
      }
    }

    if ($candidates.Count -eq 1) {
      $target = $candidates[0].Char
      $newName = $target.name + $png.Extension
      Rename-Item -LiteralPath $png.FullName -NewName $newName
      Write-Host ("  {0}/{1} -> {2}" -f $g.folder, $png.Name, $newName)
      $usedImages[$newName] = $true
      $renamed++
    }
    elseif ($candidates.Count -gt 1) {
      $names = ($candidates | ForEach-Object { $_.Char.name }) -join ', '
      Write-Host ("  AMBIGUO {0}/{1}: candidatos {2} - ignorado" -f $g.folder, $png.Name, $names)
    }
  }
}

Write-Host "Renomeados: $renamed"
