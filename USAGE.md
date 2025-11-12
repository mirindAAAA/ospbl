
## Features
- **AES-256 Encryption**: Uses OpenSSL for industry-standard AES-256-CBC encryption
- **Single File Processing**: Encrypt/decrypt individual files by name
- **Multiprocessing**: Process multiple files concurrently using child processes
- **Batch Processing**: Automatically create and process 100 test files
- **Windows API Integration**: Uses CreateProcess for true multiprocessing

## Prerequisites

This project requires OpenSSL libraries to be installed on your system.

### Windows (MinGW/g++):
**Recommended: Use MSYS2**

1. Install MSYS2 from https://www.msys2.org/
2. Open **"MSYS2 MinGW 64-bit"** terminal (NOT the regular MSYS2 terminal)
3. Install OpenSSL:
   ```bash
   pacman -S mingw-w64-x86_64-openssl
   ```
4. Run the build script - it will automatically detect MSYS2 installation

**Quick Setup:**
```powershell
# Check if MSYS2 and OpenSSL are installed
.\install_openssl_msys2.ps1

# Build the project
.\build_simple.bat
```

### Linux:
```bash
# Ubuntu/Debian
sudo apt-get install libssl-dev

# Fedora/RHEL
sudo dnf install openssl-devel
```

### macOS:
```bash
brew install openssl
```

## Running the Program

Set encryption key (AES-256 encryption)
$env:ENCRYPTION_KEY="your-secret-key-here"
Note: The key string will be hashed using SHA-256 to generate a 32-byte AES-256 key.
Any string can be used as the encryption key.

# 1. Build project (use simplified build script)
.\build_simple.bat

# 2. Create fresh test files
.\build\encrypt_decrypt.exe create-test-files

# 3. Test single file encryption
echo "test/test_file_1.txt" > temp.txt
echo "encrypt" >> temp.txt
Get-Content temp.txt | .\build\encrypt_decrypt.exe

# 4. Test single file decryption
echo "test/test_file_1.txt" > temp.txt
echo "decrypt" >> temp.txt
Get-Content temp.txt | .\build\encrypt_decrypt.exe

# 5. Encrypt all 100 files
.\build\encrypt_decrypt.exe process-all

# 6. Decrypt all 100 files
.\build\encrypt_decrypt.exe decrypt-all

# 7. Clean up
del temp.txt


