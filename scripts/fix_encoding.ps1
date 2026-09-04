# fix_encoding.ps1
# Repara arquivos de texto com encoding corrompido:
#   1. Double-encoded UTF-8 (mojibake -> texto correto): reparo por segmento,
#      preservando as partes do arquivo que ja estao corretas.
#   2. Arquivos gravados em CP1252 nativo (UTF-8 estrito falha): decodifica como CP1252.
# Saida: .md/.html como UTF-8 sem BOM; .ps1 como UTF-8 COM BOM (exigencia do PowerShell 5.1).
# Este script e 100% ASCII e constroi o padrao regex a partir de codigos numericos,
# para nao depender do proprio encoding do arquivo.

$ErrorActionPreference = 'Stop'
# Raiz do projeto = pasta PAI do script (o script vive em scripts/).
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')

$utf8Strict = New-Object System.Text.UTF8Encoding($false, $true)
$cp1252     = [System.Text.Encoding]::GetEncoding(1252)

# Assinatura classica de mojibake UTF-8 -> CP1252 -> UTF-8:
# lead byte U+00C2..U+00EF seguido de 1+ marks (continuation U+0080..U+00BF
# ou os specials que o CP1252 usa nos slots 80-9F).
$leadRange = 0x00C2..0x00EF
$markCodes = @(0x0080..0x00BF) + @(
  0x00A0, 0x20AC, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021,
  0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017D, 0x2018, 0x2019,
  0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161,
  0x203A, 0x0153, 0x017E, 0x0178
)

$leadChars = -join ($leadRange | ForEach-Object { [char]$_ })
$markChars = -join ($markCodes | ForEach-Object { [char]$_ })
# Nenhum dos chars acima e especial dentro de classe regex (sem ] \ ^ hifen ASCII).
$pattern = '[' + $leadChars + '][' + $markChars + ']+'

$evaluator = [System.Text.RegularExpressions.MatchEvaluator]{
  param($m)
  try { return $utf8Strict.GetString($cp1252.GetBytes($m.Value)) }
  catch { return $m.Value }  # sequencia nao round-trippavel: mantem original
}

$files = Get-ChildItem -LiteralPath $root -Recurse -File |
  Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.Extension -in '.md', '.html', '.ps1' }

$changed = @()
foreach ($f in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  $wasStrictUtf8 = $true
  try { $text = $utf8Strict.GetString($bytes) }
  catch { $text = $cp1252.GetString($bytes); $wasStrictUtf8 = $false }

  $repaired = [regex]::Replace($text, $pattern, $evaluator)

  if ($repaired -cne $text) {
    $enc = if ($f.Extension -eq '.ps1') {
      New-Object System.Text.UTF8Encoding($true)   # BOM para o PS 5.1 parsear acentos
    } else {
      New-Object System.Text.UTF8Encoding($false)
    }
    [System.IO.File]::WriteAllText($f.FullName, $repaired, $enc)
    $changed += [pscustomobject]@{
      Arquivo       = $f.FullName.Substring($root.Length + 1)
      EraUtf8Valido = $wasStrictUtf8
    }
  }
}

"Arquivos corrompidos reparados: $($changed.Count)"
$changed | Format-Table -AutoSize
