# Quick Start Guide - Encryptyor

## Prerequisites Setup (Windows)

### Step 1: Install MSYS2 (if not already installed)
1. Download from: https://www.msys2.org/
2. Install to default location (C:\msys64)
3. **Important**: Use "MSYS2 MinGW 64-bit" terminal, NOT the regular MSYS2 terminal

### Step 2: Install OpenSSL
Open **"MSYS2 MinGW 64-bit"** terminal and run:
```bash
pacman -S mingw-w64-x86_64-openssl
```

### Step 3: Verify Installation
Run the helper script:
```powershell
.\install_openssl_msys2.ps1
```

## Building the Project

### Option 1: Simplified Build Script (Recommended)
```powershell
.\build_simple.bat
```

### Option 2: Original Build Script
```powershell
.\build.bat
```

## Running the Program

### Set Encryption Key
```powershell
$env:ENCRYPTION_KEY="your-secret-key-here"
```

### Create Test Files
```powershell
.\build\encrypt_decrypt.exe create-test-files
```

### Encrypt a Single File
```powershell
echo "test/test_file_1.txt" > temp.txt
echo "encrypt" >> temp.txt
Get-Content temp.txt | .\build\encrypt_decrypt.exe
```

### Decrypt a Single File
```powershell
echo "test/test_file_1.txt" > temp.txt
echo "decrypt" >> temp.txt
Get-Content temp.txt | .\build\encrypt_decrypt.exe
```

### Batch Operations
```powershell
# Encrypt all 100 test files
.\build\encrypt_decrypt.exe process-all

# Decrypt all 100 test files
.\build\encrypt_decrypt.exe decrypt-all
```

## Using the Web Frontend

1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies (first time only):
   ```powershell
   npm install
   ```

3. Start the backend server:
   ```powershell
   npm start
   ```

4. Open your browser to: http://localhost:3001

## Troubleshooting

### Build Fails: "openssl/evp.h: No such file or directory"
- Make sure MSYS2 is installed
- Make sure OpenSSL is installed via MSYS2: `pacman -S mingw-w64-x86_64-openssl`
- Use the "MSYS2 MinGW 64-bit" terminal, not the regular MSYS2 terminal

### Build Fails: "cannot find -lssl"
- The OpenSSL development libraries are missing
- Install via MSYS2 as shown above
- The standard Windows OpenSSL installer doesn't include MinGW-compatible libraries

### Frontend Can't Connect to Backend
- Make sure the backend server is running: `npm start` in the frontend directory
- Check that port 3001 is not in use
- Verify the C++ executables are built in the `build/` directory

## Encryption Details

- **Algorithm**: AES-256-CBC
- **Key Derivation**: SHA-256 hash of your encryption key string
- **IV**: Random 16-byte IV generated for each encryption (stored with encrypted data)
- **Padding**: PKCS7

Your encryption key can be any string - it will be hashed to generate a 32-byte AES-256 key.

