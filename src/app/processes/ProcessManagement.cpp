#include <iostream>
#include <string>
#include <sstream>
#include "ProcessManagement.hpp"
#include "../encryptDecrypt/Cryption.hpp"

ProcessManagement::ProcessManagement() {}

ProcessManagement::~ProcessManagement() {
    cleanupProcesses();
}

bool ProcessManagement::submitToQueue(std::unique_ptr<Task> task) {
    taskQueue.push(std::move(task));
    return true;
}

void ProcessManagement::executeTasks() {
    while (!taskQueue.empty()) {
        std::unique_ptr<Task> taskToExecute = std::move(taskQueue.front());
        taskQueue.pop();
        std::cout << "Executing task: " << taskToExecute->toString() << std::endl;
        executeCryption(taskToExecute->toString());
    }
}

void ProcessManagement::executeTasksWithMultiprocessing() {
    std::cout << "Starting multiprocessing execution with " << taskQueue.size() << " tasks..." << std::endl;
    
    while (!taskQueue.empty()) {
        std::unique_ptr<Task> taskToExecute = std::move(taskQueue.front());
        taskQueue.pop();
        
        std::string taskData = taskToExecute->toString();
        std::cout << "Creating child process for task: " << taskData << std::endl;
        
        if (!createChildProcess(taskData)) {
            std::cerr << "Failed to create child process for task: " << taskData << std::endl;
        }
    }
    
    //wait for child
    if (!processHandles.empty()) {
        std::cout << "Waiting for " << processHandles.size() << " child processes to complete..." << std::endl;
        
        //wait in batch instead of 64
        const size_t MAX_WAIT_OBJECTS = 64;
        size_t remaining = processHandles.size();
        size_t start = 0;
        
        while (remaining > 0) {
            size_t batchSize = (remaining > MAX_WAIT_OBJECTS) ? MAX_WAIT_OBJECTS : remaining;
            
            DWORD result = WaitForMultipleObjects(
                static_cast<DWORD>(batchSize), 
                &processHandles[start], 
                TRUE, 
                INFINITE
            );
            
            if (result == WAIT_FAILED) {
                std::cerr << "WaitForMultipleObjects failed with error: " << GetLastError() << std::endl;
                break;
            }
            
            remaining -= batchSize;
            start += batchSize;
        }
        
        std::cout << "All child processes completed successfully!" << std::endl;
    }
    
    cleanupProcesses();
}

bool ProcessManagement::createChildProcess(const std::string& taskData) {
    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));
    
    //cmd for child process
    std::string commandLine = "build\\cryption.exe \"" + taskData + "\"";
    
    //child process
    if (!CreateProcessA(
        NULL,                           // Application name
        const_cast<char*>(commandLine.c_str()), // Command line
        NULL,                           // Process security attributes
        NULL,                           // Thread security attributes
        FALSE,                          // Inherit handles
        0,                              // Creation flags
        NULL,                           // Environment
        NULL,                           // Current directory
        &si,                            // Startup info
        &pi                             // Process information
    )) {
        std::cerr << "CreateProcess failed with error: " << GetLastError() << std::endl;
        return false;
    }
    
    //cleanup
    processHandles.push_back(pi.hProcess);
    
    //close
    CloseHandle(pi.hThread);
    
    return true;
}

void ProcessManagement::cleanupProcesses() {
    for (HANDLE handle : processHandles) {
        if (handle != NULL) {
            CloseHandle(handle);
        }
    }
    processHandles.clear();
}