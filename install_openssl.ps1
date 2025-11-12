# OpenSSL Installation Helper for Windows
# This script helps you install OpenSSL for the Encryptyor project

Write-Host "=== OpenSSL Installation Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if OpenSSL is already installed
$opensslPaths = @(
    "C:\OpenSSL-Win64",
    "C:\OpenSSL-Win32",
    "C:\Program Files\OpenSSL-Win64",
    "C:\Program Files\OpenSSL-Win32"
)

$found = $false
foreach ($path in $opensslPaths) {
    $evpPath = Join-Path $path "include\openssl\evp.h"
    if (Test-Path $evpPath) {
        Write-Host "OpenSSL found at: $path" -ForegroundColor Green
        $found = $true
        break
    }
}

if ($found) {
    Write-Host ""
    Write-Host "OpenSSL is already installed! You can proceed with building." -ForegroundColor Green
    exit 0
}

Write-Host "OpenSSL not found. Please choose an installation method:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Download Pre-built Binaries (Recommended for Windows)" -ForegroundColor Cyan
Write-Host "  1. Visit: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor White
Write-Host "  2. Download 'Win64 OpenSSL v3.x.x' (Light version is sufficient)" -ForegroundColor White
Write-Host "  3. Install to: C:\OpenSSL-Win64" -ForegroundColor White
Write-Host "  4. Run this script again to verify installation" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Install via MSYS2/MinGW (If you have MSYS2 installed)" -ForegroundColor Cyan
Write-Host "  Run in MSYS2 terminal:" -ForegroundColor White
Write-Host "    pacman -S mingw-w64-x86_64-openssl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 3: Install via vcpkg (If you have vcpkg)" -ForegroundColor Cyan
Write-Host "  Run:" -ForegroundColor White
Write-Host "    vcpkg install openssl:x64-windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 4: Set OPENSSL_ROOT_DIR environment variable" -ForegroundColor Cyan
Write-Host "  If OpenSSL is installed elsewhere, set:" -ForegroundColor White
Write-Host "    `$env:OPENSSL_ROOT_DIR = 'C:\Path\To\OpenSSL'" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Would you like to open the download page? (y/n)"
if ($choice -eq 'y' -or $choice -eq 'Y') {
    Start-Process "https://slproweb.com/products/Win32OpenSSL.html"
}

Write-Host ""
Write-Host "After installing OpenSSL, run .\build.bat to build the project." -ForegroundColor Green

