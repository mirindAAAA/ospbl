@echo off
echo Setting up encryption environment...

REM Set encryption key
set ENCRYPTION_KEY=10

echo Environment variable ENCRYPTION_KEY set to: %ENCRYPTION_KEY%
echo.
echo You can now run the encryption/decryption commands without warnings.
echo.
echo Available commands:
echo   .\build\encrypt_decrypt.exe create-test-files
echo   .\build\encrypt_decrypt.exe process-all
echo   .\build\encrypt_decrypt.exe decrypt-all
echo.
pause
