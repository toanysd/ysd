param(
    [string]$IndexFile = "index-v8.5.6.html",
    [string]$TargetFolder = "v8.5.6"
)

if (!(Test-Path $TargetFolder)) {
    New-Item -ItemType Directory -Force -Path $TargetFolder | Out-Null
}

if (!(Test-Path $IndexFile)) {
    Write-Host "Error: Cannot find index file $IndexFile" -ForegroundColor Red
    exit 1
}

Copy-Item -Path $IndexFile -Destination $TargetFolder -Force
Write-Host "Copied $IndexFile"

$content = Get-Content $IndexFile -Raw
$regex = '(?i)<(?:script[^>]+src|link[^>]+href|img[^>]+src)\s*=\s*["'']([^"'']+)["'']'
$matches = [regex]::Matches($content, $regex)

foreach ($match in $matches) {
    $filePattern = $match.Groups[1].Value
    if ($filePattern -match "^http") { continue }
    
    # Bỏ qua query string
    $filename = $filePattern -split "\?" | Select-Object -First 1
    
    if ($filename -eq "" -or $filename -eq "#") { continue }

    if (Test-Path $filename) {
        Copy-Item -Path $filename -Destination $TargetFolder -Force
        Write-Host "Copied $filename"
    } else {
        Write-Host "Warning: File $filename not found!" -ForegroundColor Yellow
    }
}

Write-Host "Backup completed to $TargetFolder"
