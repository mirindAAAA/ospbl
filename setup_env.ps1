# PowerShell script to set up encryption environment
Write-Host "Setting up encryption environment..." -ForegroundColor Green

# Set encryption key
$env:ENCRYPTION_KEY = "10"

Write-Host "Environment variable ENCRYPTION_KEY set to: $env:ENCRYPTION_KEY" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now run the encryption/decryption commands without warnings." -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  .\build\encrypt_decrypt.exe create-test-files"
Write-Host "  .\build\encrypt_decrypt.exe process-all"
Write-Host "  .\build\encrypt_decrypt.exe decrypt-all"
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
