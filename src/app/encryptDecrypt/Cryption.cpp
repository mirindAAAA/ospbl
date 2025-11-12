#include "Cryption.hpp"
#include "../processes/Task.hpp"
#include "../fileHandling/ReadEnv.hpp"
#include <fstream>
#include <iostream>
#include <vector>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/sha.h>
#include <openssl/opensslv.h>
#include <cstring>

// AES-256 requires a 32-byte key
#define AES_KEY_SIZE 32
#define AES_IV_SIZE 16
#define AES_BLOCK_SIZE 16

// Derive a 32-byte AES key from the environment key string
std::vector<unsigned char> deriveAESKey(const std::string& envKey) {
    std::vector<unsigned char> key(AES_KEY_SIZE);
    unsigned char hash[SHA256_DIGEST_LENGTH];
    
    // Use EVP interface for SHA-256 (compatible with OpenSSL 3.0+)
    EVP_MD_CTX* mdctx = EVP_MD_CTX_new();
    if (mdctx == nullptr) {
        std::cerr << "Failed to create MD context" << std::endl;
        return key;
    }
    
    const EVP_MD* md = EVP_sha256();
    if (EVP_DigestInit_ex(mdctx, md, nullptr) != 1) {
        EVP_MD_CTX_free(mdctx);
        std::cerr << "Failed to initialize digest" << std::endl;
        return key;
    }
    
    if (EVP_DigestUpdate(mdctx, envKey.c_str(), envKey.length()) != 1) {
        EVP_MD_CTX_free(mdctx);
        std::cerr << "Failed to update digest" << std::endl;
        return key;
    }
    
    unsigned int hashLen = 0;
    if (EVP_DigestFinal_ex(mdctx, hash, &hashLen) != 1) {
        EVP_MD_CTX_free(mdctx);
        std::cerr << "Failed to finalize digest" << std::endl;
        return key;
    }
    
    EVP_MD_CTX_free(mdctx);
    
    // Copy the hash to the key vector
    std::memcpy(key.data(), hash, AES_KEY_SIZE);
    
    return key;
}

int executeCryption(const std::string& taskData) {
    Task task = Task::fromString(taskData);
    ReadEnv env;
    std::string envKey = env.getenv();
    
    // Derive AES-256 key from environment variable
    std::vector<unsigned char> aesKey = deriveAESKey(envKey);
    
    // Read file content
    std::vector<unsigned char> content;
    char ch;
    while (task.f_stream.get(ch)) {
        content.push_back(static_cast<unsigned char>(ch));
    }
    
    // Close input stream
    task.f_stream.close();
    
    // Initialize OpenSSL (OpenSSL 3.0+ compatible)
    OPENSSL_init_crypto(OPENSSL_INIT_LOAD_CRYPTO_STRINGS | OPENSSL_INIT_ADD_ALL_CIPHERS | OPENSSL_INIT_ADD_ALL_DIGESTS, nullptr);
    
    std::vector<unsigned char> output;
    
    if (task.action == Action::ENCRYPT) {
        // Encryption
        EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
        if (!ctx) {
            std::cerr << "Failed to create encryption context" << std::endl;
            return 1;
        }
        
        // Generate random IV
        std::vector<unsigned char> iv(AES_IV_SIZE);
        if (RAND_bytes(iv.data(), AES_IV_SIZE) != 1) {
            std::cerr << "Failed to generate random IV" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return 1;
        }
        
        // Initialize encryption
        if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, aesKey.data(), iv.data()) != 1) {
            std::cerr << "Failed to initialize encryption" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return 1;
        }
        
        // Reserve space for output (input + padding + IV)
        output.resize(content.size() + AES_BLOCK_SIZE + AES_IV_SIZE);
        
        // Write IV at the beginning
        std::memcpy(output.data(), iv.data(), AES_IV_SIZE);
        
        int outlen = AES_IV_SIZE;
        int finalLen = 0;
        
        // Encrypt the data
        if (EVP_EncryptUpdate(ctx, output.data() + AES_IV_SIZE, &outlen, 
                              content.data(), static_cast<int>(content.size())) != 1) {
            std::cerr << "Encryption failed" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return 1;
        }
        
        // Finalize encryption (handles padding)
        if (EVP_EncryptFinal_ex(ctx, output.data() + AES_IV_SIZE + outlen, &finalLen) != 1) {
            std::cerr << "Encryption finalization failed" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return 1;
        }
        
        output.resize(AES_IV_SIZE + outlen + finalLen);
        EVP_CIPHER_CTX_free(ctx);
        
    } else {
        // Decryption
        if (content.size() < AES_IV_SIZE) {
            std::cerr << "File too short to contain IV" << std::endl;
            return 1;
        }
        
        // Extract IV from the beginning
        std::vector<unsigned char> iv(content.begin(), content.begin() + AES_IV_SIZE);
        std::vector<unsigned char> encryptedData(content.begin() + AES_IV_SIZE, content.end());
        
        EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
        if (!ctx) {
            std::cerr << "Failed to create decryption context" << std::endl;
            return 1;
        }
        
        // Initialize decryption
        if (EVP_DecryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, aesKey.data(), iv.data()) != 1) {
            std::cerr << "Failed to initialize decryption" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return 1;
        }
        
        // Reserve space for output
        output.resize(encryptedData.size() + AES_BLOCK_SIZE);
        
        int outlen = 0;
        int finalLen = 0;
        
        // Decrypt the data
        if (EVP_DecryptUpdate(ctx, output.data(), &outlen, 
                              encryptedData.data(), static_cast<int>(encryptedData.size())) != 1) {
            std::cerr << "Decryption failed" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return 1;
        }
        
        // Finalize decryption (removes padding)
        if (EVP_DecryptFinal_ex(ctx, output.data() + outlen, &finalLen) != 1) {
            std::cerr << "Decryption finalization failed - wrong key or corrupted data" << std::endl;
            EVP_CIPHER_CTX_free(ctx);
            return 1;
        }
        
        output.resize(outlen + finalLen);
        EVP_CIPHER_CTX_free(ctx);
    }
    
    // Write output to file
    std::ofstream outFile(task.filePath, std::ios::out | std::ios::binary | std::ios::trunc);
    if (outFile.is_open()) {
        outFile.write(reinterpret_cast<const char*>(output.data()), output.size());
        outFile.close();
    } else {
        std::cerr << "Failed to open file for writing: " << task.filePath << std::endl;
        return 1;
    }
    
    return 0;
}