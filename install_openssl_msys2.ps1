# OpenSSL Installation Guide for MSYS2/MinGW
# This script helps you install OpenSSL for the Encryptyor project

Write-Host "=== OpenSSL Installation for Encryptyor ===" -ForegroundColor Cyan
Write-Host ""

# Check if MSYS2 is installed
$msys2Paths = @(
    "C:\msys64",
    "C:\msys32"
)

$msys2Found = $false
$msys2Path = ""

foreach ($path in $msys2Paths) {
    if (Test-Path $path) {
        $msys2Path = $path
        $msys2Found = $true
        Write-Host "[OK] Found MSYS2 at: $path" -ForegroundColor Green
        break
    }
}

if (-not $msys2Found) {
    Write-Host "[INFO] MSYS2 not found. You need to install it first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps to install MSYS2 and OpenSSL:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Download MSYS2 from: https://www.msys2.org/" -ForegroundColor White
    Write-Host "2. Install MSYS2 (default location: C:\msys64)" -ForegroundColor White
    Write-Host "3. Open 'MSYS2 MinGW 64-bit' terminal (NOT the regular MSYS2 terminal)" -ForegroundColor White
    Write-Host "4. Run this command:" -ForegroundColor Yellow
    Write-Host "   pacman -S mingw-w64-x86_64-openssl" -ForegroundColor Green
    Write-Host "5. After installation, run .\build_simple.bat" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Would you like to open the MSYS2 download page? (y/n)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Start-Process "https://www.msys2.org/"
    }
    exit 0
}

# Check if OpenSSL is already installed
$opensslPaths = @(
    "$msys2Path\mingw64\include\openssl\evp.h",
    "$msys2Path\mingw32\include\openssl\evp.h"
)

$opensslFound = $false
foreach ($path in $opensslPaths) {
    if (Test-Path $path) {
        Write-Host "[OK] OpenSSL is already installed!" -ForegroundColor Green
        Write-Host "     Location: $(Split-Path (Split-Path (Split-Path $path)))" -ForegroundColor Gray
        $opensslFound = $true
        break
    }
}

if (-not $opensslFound) {
    Write-Host "[INFO] OpenSSL is not installed in MSYS2." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install OpenSSL:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open 'MSYS2 MinGW 64-bit' terminal" -ForegroundColor White
    Write-Host "   (Look for it in Start Menu under MSYS2 folder)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Run this command:" -ForegroundColor White
    Write-Host "   pacman -S mingw-w64-x86_64-openssl" -ForegroundColor Green
    Write-Host ""
    Write-Host "3. Press 'Y' when prompted to install" -ForegroundColor White
    Write-Host ""
    Write-Host "4. After installation, run .\build_simple.bat" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Would you like instructions on how to open MSYS2 terminal? (y/n)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Write-Host ""
        Write-Host "To open MSYS2 MinGW 64-bit terminal:" -ForegroundColor Cyan
        Write-Host "1. Press Windows key" -ForegroundColor White
        Write-Host "2. Type 'MSYS2 MinGW 64-bit' and press Enter" -ForegroundColor White
        Write-Host "3. Or navigate to: Start Menu > MSYS2 > MSYS2 MinGW 64-bit" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "You're all set! Run .\build_simple.bat to build the project." -ForegroundColor Green
}

