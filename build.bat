@echo off
setlocal enabledelayedexpansion
echo Building Encryptyor...

if not exist "build" mkdir build

set OPENSSL_INCLUDE=
set OPENSSL_LIB=

REM Check for 32-bit OpenSSL first
if exist "C:\msys64\mingw32\include\openssl\evp.h" (
    set "OPENSSL_INCLUDE=-IC:/msys64/mingw32/include"
    set "OPENSSL_LIB=-LC:/msys64/mingw32/lib -lcrypto -lssl"
    echo Found OpenSSL via MSYS2 (32-bit)
    goto compile
)

REM Check for 64-bit OpenSSL
if exist "C:\msys64\mingw64\include\openssl\evp.h" (
    set "OPENSSL_INCLUDE=-IC:/msys64/mingw64/include"
    set "OPENSSL_LIB=-LC:/msys64/mingw64/lib -lcrypto -lssl"
    echo Found OpenSSL via MSYS2 (64-bit)
    goto compile
)

echo ERROR: OpenSSL not found!
echo.
echo Install OpenSSL via MSYS2:
echo   pacman -S mingw-w64-i686-openssl    (for 32-bit compiler)
echo   pacman -S mingw-w64-x86_64-openssl (for 64-bit compiler)
exit /b 1

:compile
echo.
echo Compiling main executable...
g++ -std=c++17 -g -Wall -I. -Isrc/app/encryptDecrypt -Isrc/app/fileHandling -Isrc/app/processes !OPENSSL_INCLUDE! main.cpp src/app/processes/ProcessManagement.cpp src/app/fileHandling/IO.cpp src/app/fileHandling/ReadEnv.cpp src/app/encryptDecrypt/Cryption.cpp !OPENSSL_LIB! -o build/encrypt_decrypt.exe

if !ERRORLEVEL! NEQ 0 (
    echo Failed to build main executable
    exit /b 1
)

echo Main executable built successfully
echo.

echo Compiling cryption executable...
g++ -std=c++17 -g -Wall -I. -Isrc/app/encryptDecrypt -Isrc/app/fileHandling -Isrc/app/processes !OPENSSL_INCLUDE! src/app/encryptDecrypt/CryptionMain.cpp src/app/encryptDecrypt/Cryption.cpp src/app/fileHandling/IO.cpp src/app/fileHandling/ReadEnv.cpp !OPENSSL_LIB! -o build/cryption.exe

if !ERRORLEVEL! NEQ 0 (
    echo Failed to build cryption executable
    exit /b 1
)

echo Cryption executable built successfully
echo.
echo Build completed successfully!
echo.
