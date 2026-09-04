# make_og_cover.ps1 - converte assets/og-cover.png em og-cover.jpg (JPEG q=92)
# Dependencia: nada extra - usa System.Drawing (ja vem no .NET Framework do Windows)
# Uso:  pwsh scripts/make_og_cover.ps1
$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $ROOT "assets/og-cover.png"
$dst  = Join-Path $ROOT "assets/og-cover.jpg"

if (-not (Test-Path $src)) { throw "[X] $src nao existe - rode antes: node tests/make-og-cover.mjs" }

Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile((Resolve-Path $src))
try {
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq "image/jpeg" } | Select-Object -First 1
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, [long]92)
    $img.Save($dst, $codec, $params)
} finally {
    $img.Dispose()
}

$size = (Get-Item $dst).Length
Write-Host "[OK] og-cover.jpg ($([math]::Round($size/1KB,1)) KB, 1200x630, q=92)" -ForegroundColor Green
