#ifndef READ_ENV_HPP
#define READ_ENV_HPP

#include <string>

class ReadEnv {
public:
    ReadEnv();
    std::string getenv();
    
private:
    std::string envKey;
};

#endif
