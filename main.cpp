#include <iostream>
#include <fstream>
#include <string>
#include <windows.h>
#include <vector>
#include <thread>
#include <chrono>
#include "./src/app/processes/ProcessManagement.hpp"
#include "./src/app/processes/Task.hpp"
#include "./src/app/fileHandling/IO.hpp"

void createTestFiles() {
    std::cout << "Creating 100 test files in test folder..." << std::endl;
    
    // Create test directory if it doesn't exist
    CreateDirectoryA("test", NULL);
    
    for (int i = 1; i <= 100; i++) {
        std::string filename = "test/test_file_" + std::to_string(i) + ".txt";
        std::ofstream file(filename);
        if (file.is_open()) {
            file << "This is test file number " << i << " for encryption/decryption testing.\n";
            file << "Content: Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n";
            file << "Random data: " << (i * 123) % 1000 << "\n";
            file.close();
        }
    }
    std::cout << "Created 100 test files successfully!" << std::endl;
}

void processAllTestFiles() {
    std::cout << "=== Processing All Test Files with Multiprocessing ===" << std::endl;
    ProcessManagement processManagement;
    
    // Add all test files to the queue
    for (int i = 1; i <= 100; i++) {
        std::string filename = "test/test_file_" + std::to_string(i) + ".txt";
        
        // Check if file exists
        DWORD dwAttrib = GetFileAttributesA(filename.c_str());
        if (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY)) {
            IO io(filename);
            std::fstream f_stream = std::move(io.getFileStream());

            if (f_stream.is_open()) {
                Action taskAction = Action::ENCRYPT; // Default to encrypt for batch processing
                auto task = std::make_unique<Task>(std::move(f_stream), taskAction, filename);
                processManagement.submitToQueue(std::move(task));
            }
        }
    }
    
    std::cout << "Starting multiprocessing execution..." << std::endl;
    processManagement.executeTasksWithMultiprocessing();
    std::cout << "All files processed successfully!" << std::endl;
}

void decryptAllTestFiles() {
    std::cout << "=== Decrypting All Test Files with Multiprocessing ===" << std::endl;
    ProcessManagement processManagement;
    
    // Add all test files to the queue
    for (int i = 1; i <= 100; i++) {
        std::string filename = "test/test_file_" + std::to_string(i) + ".txt";
        
        // Check if file exists
        DWORD dwAttrib = GetFileAttributesA(filename.c_str());
        if (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY)) {
            IO io(filename);
            std::fstream f_stream = std::move(io.getFileStream());

            if (f_stream.is_open()) {
                Action taskAction = Action::DECRYPT; // Decrypt for batch processing
                auto task = std::make_unique<Task>(std::move(f_stream), taskAction, filename);
                processManagement.submitToQueue(std::move(task));
            }
        }
    }
    
    std::cout << "Starting multiprocessing decryption..." << std::endl;
    processManagement.executeTasksWithMultiprocessing();
    std::cout << "All files decrypted successfully!" << std::endl;
}

int main(int argc, char* argv[]) {
    std::string filename;
    std::string action;

    // Check if we should create test files
    if (argc > 1 && std::string(argv[1]) == "create-test-files") {
        createTestFiles();
        return 0;
    }
    
    // Check if we should process all test files
    if (argc > 1 && std::string(argv[1]) == "process-all") {
        processAllTestFiles();
        return 0;
    }
    
    // Check if we should decrypt all test files
    if (argc > 1 && std::string(argv[1]) == "decrypt-all") {
        decryptAllTestFiles();
        return 0;
    }

    std::cout << "=== File Encryption/Decryption System ===" << std::endl;
    std::cout << "Enter the file name (e.g., test/test_file_1.txt): ";
    std::getline(std::cin, filename);

    std::cout << "Enter the action (encrypt/decrypt): ";
    std::getline(std::cin, action);

    try {
        // Check if file exists
        DWORD dwAttrib = GetFileAttributesA(filename.c_str());
        if (dwAttrib != INVALID_FILE_ATTRIBUTES && !(dwAttrib & FILE_ATTRIBUTE_DIRECTORY)) {
            ProcessManagement processManagement;
            
            IO io(filename);
            std::fstream f_stream = std::move(io.getFileStream());

            if (f_stream.is_open()) {
                Action taskAction = (action == "encrypt") ? Action::ENCRYPT : Action::DECRYPT;
                auto task = std::make_unique<Task>(std::move(f_stream), taskAction, filename);
                processManagement.submitToQueue(std::move(task));
                
                std::cout << "Processing file: " << filename << " with action: " << action << std::endl;
                processManagement.executeTasks();
                std::cout << "Operation completed successfully!" << std::endl;
            } else {
                std::cout << "Unable to open file: " << filename << std::endl;
            }
        } else {
            std::cout << "File not found: " << filename << std::endl;
            std::cout << "Use 'make create-test-files' to create test files first." << std::endl;
        }
    } catch (const std::exception& ex) {
        std::cout << "Error: " << ex.what() << std::endl;
    }

    return 0;
}