CXX = g++
CXXFLAGS = -std=c++17 -g -Wall -I. -Isrc/app/encryptDecrypt -Isrc/app/fileHandling -Isrc/app/processes
LDFLAGS = -lssl -lcrypto

# Windows targets
ifeq ($(OS),Windows_NT)
    MAIN_TARGET = build/encrypt_decrypt.exe
    CRYPTION_TARGET = build/cryption.exe
    RM = del /Q
    MKDIR = mkdir
    RMDIR = rmdir /S /Q
else
    MAIN_TARGET = encrypt_decrypt
    CRYPTION_TARGET = cryption
    RM = rm -f
    MKDIR = mkdir -p
    RMDIR = rm -rf
endif

MAIN_SRC = main.cpp \
           src/app/processes/ProcessManagement.cpp \
           src/app/fileHandling/IO.cpp \
           src/app/fileHandling/ReadEnv.cpp \
           src/app/encryptDecrypt/Cryption.cpp

CRYPTION_SRC = src/app/encryptDecrypt/CryptionMain.cpp \
               src/app/encryptDecrypt/Cryption.cpp \
               src/app/fileHandling/IO.cpp \
               src/app/fileHandling/ReadEnv.cpp

MAIN_OBJ = $(MAIN_SRC:.cpp=.o)
CRYPTION_OBJ = $(CRYPTION_SRC:.cpp=.o)

all: $(MAIN_TARGET) $(CRYPTION_TARGET)

$(MAIN_TARGET): $(MAIN_OBJ)
	@$(MKDIR) build
	$(CXX) $(CXXFLAGS) $^ $(LDFLAGS) -o $@

$(CRYPTION_TARGET): $(CRYPTION_OBJ)
	@$(MKDIR) build
	$(CXX) $(CXXFLAGS) $^ $(LDFLAGS) -o $@

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Create test files
create-test-files: $(MAIN_TARGET)
	@echo "Creating 100 test files..."
	@$(MAIN_TARGET) create-test-files

# Clean test files
clean-test:
	@echo "Cleaning test files..."
	@$(RMDIR) test
	@$(MKDIR) test

# Run multiprocessing test with all test files
test-multiprocessing: $(MAIN_TARGET) $(CRYPTION_TARGET) create-test-files
	@echo "Running multiprocessing test with 100 files..."
	@echo "This will encrypt all test files using multiprocessing..."
	@$(MAIN_TARGET) process-all

# Decrypt all test files using multiprocessing
decrypt-all: $(MAIN_TARGET) $(CRYPTION_TARGET)
	@echo "Decrypting all test files using multiprocessing..."
	@$(MAIN_TARGET) decrypt-all

clean:
	$(RM) $(MAIN_OBJ) $(CRYPTION_OBJ) $(MAIN_TARGET) $(CRYPTION_TARGET)

.PHONY: clean all create-test-files clean-test test-multiprocessing decrypt-all