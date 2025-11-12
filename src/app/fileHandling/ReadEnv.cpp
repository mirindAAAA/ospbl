#include "ReadEnv.hpp"
#include <cstdlib>
#include <iostream>

ReadEnv::ReadEnv() {
    const char* key = std::getenv("ENCRYPTION_KEY");
    if (key != nullptr) {
        envKey = std::string(key);
    } else {
        //if no key set use default key
        envKey = "default-encryption-key";
        std::cout << "Warning: ENCRYPTION_KEY environment variable not set. Using default key." << std::endl;
        std::cout << "Note: The key will be hashed to generate a 32-byte AES-256 key." << std::endl;
    }
}

std::string ReadEnv::getenv() {
    return envKey;
}
