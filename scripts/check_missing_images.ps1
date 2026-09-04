# check_missing_images.ps1
# Diagnostico: lista os personagens SEM imagem e classifica o motivo de cada um.
#   COLISAO        - existe PNG com o mesmo nome normalizado na propria pasta, mas
#                    ele ja foi atribuido a OUTRO personagem (nomes duplicados na ficha;
#                    o matching nunca reusa a mesma imagem para dois personagens).
#   ORFAO-IGUAL    - existe PNG orfa na propria pasta com o mesmo nome normalizado.
#                    NAO deveria acontecer; se aparecer, e bug de matching.
#   TYPO?          - existe PNG orfa na propria pasta com nome muito proximo
#                    (Levenshtein <= 2 entre nomes normalizados); candidata ao
#                    pareamento manual / fix_image_typos.ps1.
#   EM-OUTRA-PASTA - o nome casou com PNG que esta em OUTRA categoria (arte na
#                    pasta errada ou personagem homonimo).
#   SEM-ARTE       - nenhuma PNG correspondente em lugar nenhum do acervo.
# Nao altera nenhum arquivo; apenas reporta. Requer characters-api.json atualizado.

$ErrorActionPreference = 'Stop'
# Raiz do projeto = pasta PAI do script (o script vive em scripts/).
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')

$apiPath = Join-Path $root 'characters-api.json'
if (-not (Test-Path -LiteralPath $apiPath)) { throw "characters-api.json nao encontrado. Execute build_api_json.ps1 primeiro." }
$api = [System.IO.File]::ReadAllText($apiPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json

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

# O JSON nao tem mais o array flat "characters" (26/08/2026); derivar dos grupos.
$allChars = @($api.groups | ForEach-Object { $_.characters })

# Mapa caminho-de-imagem -> personagens que a usam ("Pasta/arquivo.png").
$usersByImage = @{}
foreach ($c in ($allChars | Where-Object { $_.image })) {
  if (-not $usersByImage.ContainsKey($c.image)) { $usersByImage[$c.image] = New-Object System.Collections.Generic.List[string] }
  [void]$usersByImage[$c.image].Add($c.name)
}

# Inventario de todos os PNGs das pastas numeradas, com status usado/orfa.
# As pastas vivem em codex/ desde 26/08/2026; as chaves usam o mesmo formato
# do campo "image" do API ("codex/<pasta>/<arquivo>.png").
$codex = Join-Path $root 'codex'
$inventory = New-Object System.Collections.Generic.List[object]
Get-ChildItem -LiteralPath $codex -Directory |
  Where-Object { $_.Name -match '^\d{2}_' } |
  Sort-Object Name |
  ForEach-Object {
    $folderName = $_.Name
    foreach ($f in (Get-ChildItem -LiteralPath $_.FullName -File -Filter '*.png')) {
      $key = 'codex/' + $folderName + '/' + $f.Name
      $usedBy = ''
      if ($usersByImage.ContainsKey($key)) { $usedBy = ($usersByImage[$key] -join ' & ') }
      $inventory.Add([pscustomobject]@{
        Folder = $folderName
        Name   = $f.Name
        Norm   = (Get-NormalizedName $f.BaseName)
        UsedBy = $usedBy
      })
    }
  }

$rows = New-Object System.Collections.Generic.List[object]
foreach ($ch in ($allChars | Where-Object { -not $_.image })) {
  $charNorm = Get-NormalizedName $ch.name
  $inFolder = @($inventory | Where-Object { $_.Folder -eq $ch.folder })

  # 1. PNG da propria pasta ja usada por outro personagem (mesmo nome normalizado).
  $collisions = @($inFolder | Where-Object { $_.UsedBy -and $_.Norm -eq $charNorm })
  if ($collisions.Count -gt 0) {
    $parts = @()
    foreach ($h in $collisions) { $parts += ('{0} -> usada por {1}' -f $h.Name, $h.UsedBy) }
    $rows.Add([pscustomobject]@{ Motivo = 'COLISAO'; Pasta = $ch.folder; Personagem = $ch.title; Detalhe = ($parts -join '; ') })
    continue
  }

  # 2. Orfa com nome exatamente igual na propria pasta (indicaria bug de matching).
  $exactOrphans = @($inFolder | Where-Object { -not $_.UsedBy -and $_.Norm -eq $charNorm })
  if ($exactOrphans.Count -gt 0) {
    $detail = ($exactOrphans | ForEach-Object { $_.Name }) -join '; '
    $rows.Add([pscustomobject]@{ Motivo = 'ORFAO-IGUAL'; Pasta = $ch.folder; Personagem = $ch.title; Detalhe = $detail })
    continue
  }

  # 3. Orfa com nome proximo na propria pasta (possivel typo ainda nao pareado).
  $typoPairs = @()
  foreach ($o in ($inFolder | Where-Object { -not $_.UsedBy })) {
    $dist = Get-Levenshtein -A $o.Norm -B $charNorm
    if ($dist -le 2) { $typoPairs += ('{0} (dist {1})' -f $o.Name, $dist) }
  }
  if ($typoPairs.Count -gt 0) {
    $rows.Add([pscustomobject]@{ Motivo = 'TYPO?'; Pasta = $ch.folder; Personagem = $ch.title; Detalhe = ($typoPairs -join '; ') })
    continue
  }

  # 4. O nome casou com PNG de outra pasta.
  $cross = @($inventory | Where-Object { $_.Folder -ne $ch.folder -and $_.Norm -eq $charNorm })
  if ($cross.Count -gt 0) {
    $parts = @()
    foreach ($h in $cross) {
      $status = 'orfa'
      if ($h.UsedBy) { $status = 'usada por ' + $h.UsedBy }
      $parts += ('{0}/{1} [{2}]' -f $h.Folder, $h.Name, $status)
    }
    $rows.Add([pscustomobject]@{ Motivo = 'EM-OUTRA-PASTA'; Pasta = $ch.folder; Personagem = $ch.title; Detalhe = ($parts -join '; ') })
    continue
  }

  # 5. Nenhuma arte correspondente em lugar nenhum.
  $rows.Add([pscustomobject]@{ Motivo = 'SEM-ARTE'; Pasta = $ch.folder; Personagem = $ch.title; Detalhe = '' })
}

Write-Host ("Personagens sem imagem: " + $rows.Count + " (acervo: " + $inventory.Count + " PNGs)")
Write-Host ""
Write-Host "=== RESUMO POR MOTIVO ==="
$rows | Group-Object Motivo | Sort-Object Count -Descending | ForEach-Object { Write-Host ("{0}: {1}" -f $_.Name, $_.Count) }
Write-Host ""
Write-Host "=== DETALHE ==="
$rows | Sort-Object Motivo, Pasta, Personagem | Format-Table -AutoSize -Wrap | Out-String -Width 200 | Write-Host
