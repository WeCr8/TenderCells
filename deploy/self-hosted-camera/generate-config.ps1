$ErrorActionPreference = 'Stop'
$template = Join-Path $PSScriptRoot '.env.example'
$target = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $target) { throw '.env already exists; refusing to overwrite secrets.' }
$secretBytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
$secret = ([BitConverter]::ToString($secretBytes) -replace '-', '').ToLowerInvariant()
$content = (Get-Content -LiteralPath $template -Raw).Replace('replace-with-a-random-64-character-secret', $secret)
[IO.File]::WriteAllText($target, $content, [Text.UTF8Encoding]::new($false))
Write-Host 'Created .env. Set TC_CAMERA_URL and TC_PUBLIC_HOST before starting Docker.'
