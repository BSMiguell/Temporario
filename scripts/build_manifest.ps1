# build_manifest.ps1 - gera manifest.webmanifest dinamicamente
# - contagens vem do characters-api.json
# - atalhos: top 3 racas com mais personagens + mapa
# Uso:  pwsh scripts/build_manifest.ps1
$ErrorActionPreference = "Stop"

$root = (Split-Path -Parent $PSScriptRoot).TrimEnd('\')
$api = [IO.File]::ReadAllText((Join-Path $root "characters-api.json")) | ConvertFrom-Json
$themes = [IO.File]::ReadAllText((Join-Path $root "data/themes.json")) | ConvertFrom-Json

# sanity check: personagens na API == soma do declared
$soma = ($api.groups | Measure-Object -Property count -Sum).Sum
if ($soma -ne $api.totalCharacters) {
    Write-Warning "Soma dos grupos ($soma) != totalCharacters ($($api.totalCharacters)) - corrija build_api_json.ps1"
}

# mapa de folder -> label (ex: 15_Os_Aspectos -> "Os Aspectos")
# Normaliza removendo acentos (NFD) pra casar com folders sem acento.
$folderToLabel = @{}
foreach ($t in $themes.themes) {
    $folderToLabel[$t.label] = $t.label
    $norm = $t.label.Normalize([System.Text.NormalizationForm]::FormD) -replace '[^a-zA-Z0-9 ]',''
    # slug1 sem nada (letras/digitos colados), slug2 com underscores
    $slug1 = ($norm -replace '\s+','').ToLower()
    $slug2 = ($norm -replace '\s+','_').ToLower()
    $folderToLabel[$slug1] = $t.label
    $folderToLabel[$slug2] = $t.label
}

# top 3 racas por quantidade de personagens (converte pra array de hashtable)
$top3 = @()
foreach ($g in $api.groups) {
    $top3 += @{ folder = $g.folder; count = $g.count }
}
$top3 = $top3 | Sort-Object count -Descending | Select-Object -First 3

$shortcuts = @(
    @{ name = "Mapa do mundo"; url = "./Mapa_Aetheria.html" }
)
foreach ($g in $top3) {
    # tenta mapear folder -> label humano; senao usa o folder cru
    $bare = ($g.folder -replace '^\d+_','')
    $bareLower = $bare.ToLower()
    $label = if ($folderToLabel.ContainsKey($bare)) { $folderToLabel[$bare] }
              elseif ($folderToLabel.ContainsKey($bareLower)) { $folderToLabel[$bareLower] }
              else { $g.folder }
    $shortcuts += @{ name = $label; url = "./?g=$($g.folder)" }
}

$manifest = [ordered]@{
  name             = "Aetheria Codex"
  short_name       = "Aetheria"
  description      = "Codice de $($api.totalCharacters) personagens em $($api.totalGroups) racas, com fichas, arte, lore e mapa do mundo."
  start_url        = "./"
  scope            = "./"
  display          = "standalone"
  orientation      = "portrait-primary"
  background_color = "#1a120e"
  theme_color      = "#1a120e"
  lang             = "pt-BR"
  categories       = @("books", "entertainment", "lifestyle")
  icons = @(
    @{ src = "assets/favicon-192.png";       sizes = "192x192"; type = "image/png"; purpose = "any" }
    @{ src = "assets/favicon-32.png";        sizes = "32x32";   type = "image/png"; purpose = "any" }
    @{ src = "assets/apple-touch-icon.png";  sizes = "180x180"; type = "image/png"; purpose = "any" }
  )
  shortcuts = $shortcuts
}

$json = $manifest | ConvertTo-Json -Depth 5
$dst = Join-Path $root "manifest.webmanifest"
[IO.File]::WriteAllText($dst, $json, [Text.UTF8Encoding]::new($false))
$names = ($shortcuts | ForEach-Object { $_.name }) -join ", "
Write-Host "[OK] manifest.webmanifest (atalhos: $names)" -ForegroundColor Green
