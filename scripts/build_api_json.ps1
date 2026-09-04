# build_api_json.ps1
# Gera o characters-api.json a partir das fichas .md de cada pasta.
#
# Melhorias vs versao anterior:
#   - Descricao extraida tanto do formato "* **História Original:** texto"
#     quanto do formato simples "História Original: texto" (paragrafo proprio).
#   - Atributos mapeados por ROTULO (Raça/Rosto/Vestuário...), nao por posicao.
#   - Leitura sempre em UTF-8 explicito.
#   - Matching de imagens estrito (exato -> normalizado -> prefixo com separador),
#     sem reutilizar a mesma PNG para dois personagens; sem imagem = null.
#   - Caminho relativo ao script (portavel); nao sobrescreve $Matches.

$ErrorActionPreference = 'Stop'
# Raiz do projeto = pasta PAI do script (o script vive em scripts/).
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
# As pastas numeradas das racas vivem em codex/ (reestruturacao de 26/08/2026).
$codex = Join-Path $root 'codex'

$utf8 = [System.Text.Encoding]::UTF8
$fallbackDescription = 'Nenhuma descrição disponível para este personagem.'

function Normalize-Name {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return '' }
  $clean = $Value.ToLowerInvariant()
  $clean = $clean -replace '[-_ ]?v[-_ ]?\d+$', ''
  $clean = $clean -replace '[-_ ]?version[-_ ]?\d*$', ''
  $clean = $clean -replace '[^a-z0-9]+', ''
  return $clean
}

# Rotulos reconhecidos nas fichas. Aceitam negrito, bullets e todas as variacoes
# encontradas no projeto ("Raça:", "Raça / Categoria:", "Classe Mutagênica:",
# "Rosto & Cabelo"/"Rosto & Anatomia"/"Anatomia & Detalhes", "Atributos Únicos", ...).
# Em Mutantes, "Atributos Únicos" ocupa o lugar de equipamento.
$labelPatterns = [ordered]@{
  description = 'Hist[oó]ria\s+Original'
  race        = '(?:Raç[ao]|Classe)(?:\s*/\s*(?:Categoria|Ordem|Tipo|Classe))?(?:\s+(?:Mutag[êe]nica|Demon[íi]aca|Mutante))?'
  dna         = 'DNA\s*&\s*Raio-X\s*Visual'
  physical    = 'F[íi]sico\s*&\s*Postura'
  faceAndHair = '(?:Rosto\s*&\s*(?:Anatomia|Cabelo)|Anatomia\s*&\s*Detalhes)'
  outfit      = 'Vestu[áa]rio'
  palette     = 'Paleta\s*de\s*Cores'
  equipment   = '(?:Acess[óo]rios(?:\s*&\s*Equipamento)?|Atributos\s*[ÚÚuú]nicos)'
}
$attrKeys = @('race', 'physical', 'faceAndHair', 'outfit', 'palette', 'equipment')

function Get-Sections {
  # Divide o conteudo nas fichas: linhas "N. Titulo" com ou sem cabecalho "##".
  param([string]$Content)
  return [regex]::Matches($Content, '(?ms)^(?:##\s*)?\d+\.\s+.+?(?=^(?:##\s*)?\d+\.\s+|\z)')
}

function Find-LabeledValue {
  # Localiza um rotulo na ficha e devolve seu valor (inline ou paragrafo seguinte).
  param(
    [string[]]$Lines,
    [string]$LabelPattern
  )
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    $line = $Lines[$i]
    # Usar -match explicito: -notmatch nao popula $Matches de forma confiavel.
    if (-not ($line -match ('^\s*(?:[-*]\s+)?(?:\*\*\s*)?' + $LabelPattern + '\s*\*{0,2}\s*:\s*\*{0,2}\s*(.*)$'))) { continue }
    $value = ($Matches[1].Trim() -replace '^\*\*\s*', '')
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return ($value -replace '\s+', ' ')
    }
    # Valor vazio no inline: coletar paragrafo seguinte ate linha vazia ou novo rotulo/entrada.
    $collector = New-Object System.Collections.Generic.List[string]
    for ($j = $i + 1; $j -lt $Lines.Count; $j++) {
      $next = $Lines[$j].Trim()
      if ([string]::IsNullOrWhiteSpace($next)) {
        if ($collector.Count -gt 0) { break }
        continue
      }
      if ($next -match '^(?:#{1,6}\s+|\d+\.\s+)') { break }
      $isOtherLabel = $false
      foreach ($p in $labelPatterns.Values) {
        if ($next -match ('^\s*(?:[-*]\s+)?(?:\*\*\s*)?' + $p + '\s*\*{0,2}\s*:')) { $isOtherLabel = $true; break }
      }
      if ($isOtherLabel) { break }
      $collector.Add(($next -replace '^[-*]\s+', '' -replace '\*\*', ''))
    }
    if ($collector.Count -gt 0) {
      return ((($collector -join ' ') -replace '\s+', ' ').Trim())
    }
    return ''
  }
  return $null
}

function Get-CharacterFields {
  param([string]$SectionBody)
  $lines = $SectionBody -split "\r?\n"
  $fields = @{}
  foreach ($key in $labelPatterns.Keys) {
    $value = Find-LabeledValue -Lines $lines -LabelPattern $labelPatterns[$key]
    if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace($value)) {
      $fields[$key] = $value
    }
  }
  return $fields
}

function Find-ImageFile {
  # Tiers estritos: nome exato -> nome normalizado igual -> prefixo seguido de separador.
  # Uma imagem nunca serve dois personagens da mesma pasta.
  param(
    [System.IO.FileInfo[]]$PngFiles,
    [string]$BaseName,
    [string]$NormalizedName,
    [System.Collections.Generic.HashSet[string]]$UsedImages
  )
  foreach ($png in $PngFiles) {
    if (-not $UsedImages.Contains($png.Name) -and $png.BaseName -ieq $BaseName) { return $png }
  }
  foreach ($png in $PngFiles) {
    if (-not $UsedImages.Contains($png.Name) -and $NormalizedName -and (Normalize-Name $png.BaseName) -eq $NormalizedName) { return $png }
  }
  foreach ($png in $PngFiles) {
    if (-not $UsedImages.Contains($png.Name) -and $BaseName -and $png.BaseName -match ('^' + [regex]::Escape($BaseName) + '[\-_ ]')) { return $png }
  }
  return $null
}

if (-not (Test-Path -LiteralPath $codex)) {
  throw ("Pasta 'codex' nao encontrada em '{0}'. As pastas numeradas das racas vivem em codex/ desde 26/08/2026." -f $root)
}

# Guarda de sincronizacao: a ferramenta de sync externa aponta para as pastas NA RAIZ.
# Se ela recriar pastas numeradas fora de codex/, avisar com instrucao clara.
$strayDirs = @(Get-ChildItem -LiteralPath $root -Directory |
  Where-Object { $_.Name -match '^\d{2}_' })
if ($strayDirs.Count -gt 0) {
  Write-Warning ('SINCRONIZACAO: {0} pasta(s) numerada(s) reapareceram NA RAIZ (fora de codex/): {1}' -f $strayDirs.Count, (($strayDirs | ForEach-Object { $_.Name }) -join ', '))
  Write-Warning 'Rode: powershell -File scripts\absorb_sync.ps1  (mescla o conteudo em codex/ e remove as pastas da raiz).'
}

$dirs = Get-ChildItem -LiteralPath $codex -Directory |
  Where-Object { $_.Name -match '^\d{2}_' } |
  Sort-Object Name

$groups = New-Object System.Collections.Generic.List[object]
$allCharacters = New-Object System.Collections.Generic.List[object]
$foldersWithoutSheet = New-Object System.Collections.Generic.List[string]

foreach ($d in $dirs) {
  $md = Get-ChildItem -LiteralPath $d.FullName -File -Filter 'Aetheria_Codex_de_*.md' | Select-Object -First 1
  if (-not $md) {
    $pngCount = @(Get-ChildItem -LiteralPath $d.FullName -File -Filter '*.png').Count
    $foldersWithoutSheet.Add("$($d.Name) ($pngCount PNGs, nenhum personagem com ficha)")
    Write-Warning ("Pasta '{0}' tem {1} PNG(s) mas NENHUM arquivo Aetheria_Codex_de_*.md — personagens sem ficha ficam fora do site. Crie as fichas." -f $d.Name, $pngCount)
    continue
  }

  $content = [System.IO.File]::ReadAllText($md.FullName, $utf8)
  $pngFiles = @(Get-ChildItem -LiteralPath $d.FullName -File -Filter '*.png')
  $usedImages = New-Object System.Collections.Generic.HashSet[string]

  $characterItems = New-Object System.Collections.Generic.List[object]
  foreach ($section in (Get-Sections -Content $content)) {
    $body = $section.Value
    $firstLineEnd = $body.IndexOf("`n")
    $headerLine = if ($firstLineEnd -ge 0) { ($body.Substring(0, $firstLineEnd) -replace '\r', '').Trim() } else { $body.Trim() }
    $title = ($headerLine -replace '^(?:##\s*)?\d+\.\s*', '').Trim()
    $baseName = ($title -replace ',.*$', '').Trim()
    $normalizedName = Normalize-Name $baseName
    $number = [int]($headerLine -replace '^(?:##\s*)?(\d+)\..*$', '$1')

    $fields = Get-CharacterFields -SectionBody $body

    $png = Find-ImageFile -PngFiles $pngFiles -BaseName $baseName -NormalizedName $normalizedName -UsedImages $usedImages
    $imagePath = $null
    $imageWebp = $null
    if ($png) {
      # Caminho relativo a raiz do projeto (o site consome direto no src).
      $imagePath = ('codex/' + $d.Name + '/' + $png.Name) -replace '\\', '/'
      # espelho WebP (mesmo nome, extensao trocada) - null se nao existir
      $webpCandidate = Join-Path $d.FullName ($png.BaseName + '.webp')
      if (Test-Path $webpCandidate) {
        $imageWebp = ('codex/' + $d.Name + '/' + $png.BaseName + '.webp') -replace '\\', '/'
      }
      [void]$usedImages.Add($png.Name)
    }

    $attributes = [ordered]@{}
    foreach ($key in $attrKeys) {
      if ($fields.ContainsKey($key)) { $attributes[$key] = $fields[$key] }
    }

    $character = [ordered]@{
      number      = $number
      title       = $title
      name        = $baseName
      id          = $baseName
      slug        = ($d.Name + '_' + $baseName)  # folder+name, unico entre racas
      file        = $md.Name
      folder      = $d.Name
      image       = $imagePath
      imageWebp   = $imageWebp
      description = if ($fields.ContainsKey('description')) { $fields['description'] } else { $fallbackDescription }
      attributes  = $attributes
    }
    $characterItems.Add([pscustomobject]$character)
    $allCharacters.Add([pscustomobject]$character)
  }

  $groups.Add([pscustomobject]([ordered]@{
    folder     = $d.Name
    file       = $md.Name
    count      = $characterItems.Count
    characters = $characterItems
  }))
}

# O array FLAT "characters" saiu do JSON em 26/08/2026: duplicava groups[].characters
# e ja tinha divergido uma vez (Licao #13). Consumidores leem os grupos.
$api = [ordered]@{
  project             = 'Aetheria Codex'
  generatedAt         = (Get-Date).ToString('yyyy-MM-dd')
  totalGroups         = $groups.Count
  totalCharacters     = $allCharacters.Count
  foldersWithoutSheet = $foldersWithoutSheet
  groups              = $groups
}

$json = $api | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText((Join-Path $root 'characters-api.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host ("characters-api.json gerado: $($groups.Count) grupos, $($allCharacters.Count) personagens.")
