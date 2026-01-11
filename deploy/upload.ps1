# PowerShell script to upload TestDone to VPS
# Run from: testdone-app directory

$VPS_USER = "ankushmulla"
$VPS_HOST = "72.62.145.63"
$VPS_PATH = "/var/www/testdone"

Write-Host "📦 Uploading TestDone to VPS..." -ForegroundColor Cyan

# Create exclude list
$excludes = @(
    "node_modules",
    ".next",
    "dist",
    ".git",
    "*.log"
)

# Using SCP to upload (requires OpenSSH client)
Write-Host "Uploading files to $VPS_USER@$VPS_HOST:$VPS_PATH" -ForegroundColor Yellow

# Create a temporary directory without node_modules
$tempDir = "$env:TEMP\testdone-deploy"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files excluding node_modules
Write-Host "Preparing files..." -ForegroundColor Yellow
$source = Get-Location
Get-ChildItem -Path $source -Exclude "node_modules",".next","dist",".git" | Copy-Item -Destination $tempDir -Recurse

Write-Host ""
Write-Host "Files prepared at: $tempDir" -ForegroundColor Green
Write-Host ""
Write-Host "Now run these commands manually:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. SSH into your VPS:" -ForegroundColor White
Write-Host "   ssh $VPS_USER@$VPS_HOST" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Run the deployment script:" -ForegroundColor White
Write-Host "   curl -o deploy.sh https://raw.githubusercontent.com/your-repo/deploy.sh" -ForegroundColor Yellow
Write-Host "   OR copy the deploy.sh content manually" -ForegroundColor Yellow
Write-Host "   chmod +x deploy.sh && ./deploy.sh" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Upload your code using SCP or SFTP:" -ForegroundColor White
Write-Host "   scp -r $tempDir/* $VPS_USER@$VPS_HOST`:$VPS_PATH/" -ForegroundColor Yellow
Write-Host ""
