#ifndef PROCESS_MANAGEMENT_HPP
#define PROCESS_MANAGEMENT_HPP

#include "Task.hpp"
#include <queue>
#include <memory>
#include <vector>
#include <windows.h>

class ProcessManagement
{
public:
    ProcessManagement();
    ~ProcessManagement();
    bool submitToQueue(std::unique_ptr<Task> task);
    void executeTasks();
    void executeTasksWithMultiprocessing();

private:
    std::queue<std::unique_ptr<Task>> taskQueue;
    std::vector<HANDLE> processHandles;
    void cleanupProcesses();
    bool createChildProcess(const std::string& taskData);
};

#endif