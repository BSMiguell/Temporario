# absorb_sync.ps1
# A ferramenta de sincronizacao externa copia imagens/fichas para as pastas
# numeradas NA RAIZ do projeto. Desde 26/08/2026 essas pastas vivem em codex/.
# Este script absorve o que a sync (re)criou na raiz:
#   - arquivo novo            -> move para codex/<pasta>/
#   - arquivo identico (hash) -> descarta a copia da raiz
#   - arquivo DIFERENTE       -> NUNCA sobrescreve: guarda como <nome>.CONFLITO-SYNC.<ext>
#                                e reporta para decisao humana.
# No fim, remove a pasta da raiz se ficar vazia.
#
# Uso: powershell -File scripts\absorb_sync.ps1
# (roda de qualquer diretorio; resolve a raiz pela pasta PAI de scripts/)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$codex = Join-Path $root 'codex'

if (-not (Test-Path -LiteralPath $codex)) {
  throw ("Pasta 'codex' nao encontrada em '{0}'." -f $root)
}

function Get-FileHashSafe {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  return (Get-FileHash -LiteralPath $Path -Algorithm MD5).Hash
}

$strayDirs = @(Get-ChildItem -LiteralPath $root -Directory |
  Where-Object { $_.Name -match '^\d{2}_' })

if ($strayDirs.Count -eq 0) {
  Write-Host 'Nada a absorver: nenhuma pasta numerada na raiz.'
  exit 0
}

$moved = 0; $deduped = 0; $conflicts = 0

foreach ($dir in $strayDirs) {
  $target = Join-Path $codex $dir.Name
  if (-not (Test-Path -LiteralPath $target)) {
    # Pasta inteiramente nova vinda da sync: mover como um todo.
    Move-Item -LiteralPath $dir.FullName -Destination $target
    Write-Host ("NOVA PASTA movida: {0} -> codex\{0}" -f $dir.Name)
    $moved += @(Get-ChildItem -LiteralPath $target -File -Recurse).Count
    continue
  }

  foreach ($file in (Get-ChildItem -LiteralPath $dir.FullName -File)) {
    $dest = Join-Path $target $file.Name
    if (-not (Test-Path -LiteralPath $dest)) {
      Move-Item -LiteralPath $file.FullName -Destination $dest
      Write-Host ("movido : {0}\{1}" -f $dir.Name, $file.Name)
      $moved++
      continue
    }
    if ((Get-FileHashSafe $file.FullName) -eq (Get-FileHashSafe $dest)) {
      Remove-Item -LiteralPath $file.FullName -Force -Confirm:$false
      Write-Host ("identico (descartado): {0}\{1}" -f $dir.Name, $file.Name)
      $deduped++
      continue
    }
    # Conteudo diverge: preservar os DOIS lados e reportar.
    $conflictName = '{0}.CONFLITO-SYNC{1}' -f $file.BaseName, $file.Extension
    $conflictDest = Join-Path $target $conflictName
    $n = 2
    while (Test-Path -LiteralPath $conflictDest) {
      $conflictDest = Join-Path $target ('{0}.CONFLITO-SYNC-{1}{2}' -f $file.BaseName, $n, $file.Extension)
      $n++
    }
    Move-Item -LiteralPath $file.FullName -Destination $conflictDest
    Write-Warning ("CONFLITO: {0}\{1} difere do arquivo em codex\ - guardado como '{2}'. Decidir qual manter." -f $dir.Name, $file.Name, $conflictName)
    $conflicts++
  }

  $leftovers = @(Get-ChildItem -LiteralPath $dir.FullName -Force)
  if ($leftovers.Count -eq 0) {
    Remove-Item -LiteralPath $dir.FullName -Force -Confirm:$false
    Write-Host ("pasta da raiz removida: {0}\" -f $dir.Name)
  } else {
    Write-Warning ("Pasta {0}\ ainda tem itens nao-absorviveis: {1}" -f $dir.Name, (($leftovers | ForEach-Object { $_.Name }) -join ', '))
  }
}

Write-Host ''
Write-Host ('Resumo: {0} movido(s), {1} identico(s) descartado(s), {2} conflito(s).' -f $moved, $deduped, $conflicts)
if ($conflicts -gt 0) {
  Write-Warning 'Ha CONFLITOS aguardando decisao em codex/ (arquivos *.CONFLITO-SYNC.*).'
}
Write-Host 'Proximo passo padrao: regenerar com scripts\build_api_json.ps1 + build_readme.ps1.'
