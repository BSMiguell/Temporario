# build_sitemap.ps1 - gera sitemap.xml a partir de racas/*.html + raiz index.html
# Uso:  pwsh scripts/build_sitemap.ps1
# Saida: sitemap.xml (raiz do projeto)
$ErrorActionPreference = "Stop"

$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..")).TrimEnd("\")
$base = "https://bsmiguell.github.io/Temporario"
$now  = (Get-Date).ToString("yyyy-MM-dd")

# Pega mtime de cada HTML para lastmod (mais fiel que um unico stamp)
$files = @()
$files += [pscustomobject]@{ url = "$base/";             path = (Join-Path $root "index.html") }
Get-ChildItem (Join-Path $root "racas") -Filter "*.html" | Sort-Object Name | ForEach-Object {
    $slug = $_.BaseName
    $files += [pscustomobject]@{ url = "$base/racas/$slug.html"; path = $_.FullName }
}

# Calcula lastmod por arquivo (usa a maior data entre o .html e seu .md fonte)
function Get-LastMod([string]$htmlPath) {
    $stamp = (Get-Item $htmlPath).LastWriteTime
    # procura o codex/*.md correspondente
    $slug = [IO.Path]::GetFileNameWithoutExtension($htmlPath)
    $codex = Join-Path $root "codex"
    if (Test-Path $codex) {
        Get-ChildItem $codex -Filter "$slug.md" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.LastWriteTime -gt $stamp) { $stamp = $_.LastWriteTime }
        }
    }
    return $stamp.ToString("yyyy-MM-dd")
}

$sb = New-Object Text.StringBuilder
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

foreach ($f in $files) {
    $lastmod = Get-LastMod $f.path
    if ($f.url -eq "$base/") { $pri = "1.0"; $cf = "weekly" } else { $pri = "0.7"; $cf = "monthly" }
    [void]$sb.AppendLine("  <url>")
    [void]$sb.AppendLine("    <loc>$($f.url)</loc>")
    [void]$sb.AppendLine("    <lastmod>$lastmod</lastmod>")
    [void]$sb.AppendLine("    <changefreq>$cf</changefreq>")
    [void]$sb.AppendLine("    <priority>$pri</priority>")
    [void]$sb.AppendLine("  </url>")
}
[void]$sb.AppendLine("</urlset>")

$dst = Join-Path $root "sitemap.xml"
[IO.File]::WriteAllText($dst, $sb.ToString(), [Text.UTF8Encoding]::new($false))
Write-Host "[OK] sitemap.xml ($($files.Count) URLs)" -ForegroundColor Green
