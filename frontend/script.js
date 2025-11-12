// Encryptyor Frontend JavaScript
class EncryptyorFrontend {
    constructor() {
        this.currentKey = '';
        this.isProcessing = false;
        this.operationLog = [];
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.stats = {
            encrypted: 0,
            decrypted: 0,
            totalProcessed: 0,
            processingTimes: []
        };
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.isGridView = false;
        this.searchQuery = '';
        
        this.initializeEventListeners();
        this.loadFileList();
        this.updateKeyStatus();
        this.checkBackendConnection();
        this.applyTheme();
        this.initializeDragDrop();
    }

    initializeEventListeners() {
        // Key management
        document.getElementById('setKeyBtn').addEventListener('click', () => this.setEncryptionKey());
        document.getElementById('encryptionKey').addEventListener('input', (e) => {
            this.currentKey = e.target.value;
            this.updateKeyStrength();
        });
        document.getElementById('toggleKeyVisibility').addEventListener('click', () => this.toggleKeyVisibility());
        document.getElementById('generateKeyBtn').addEventListener('click', () => this.generateRandomKey());

        // Single file operations
        document.getElementById('encryptSingleBtn').addEventListener('click', () => this.encryptSingleFile());
        document.getElementById('decryptSingleBtn').addEventListener('click', () => this.decryptSingleFile());
        document.getElementById('browseFileBtn').addEventListener('click', () => document.getElementById('fileUpload').click());
        document.getElementById('fileUpload').addEventListener('change', (e) => this.handleFileUpload(e));

        // Batch operations
        document.getElementById('createTestFilesBtn').addEventListener('click', () => this.createTestFiles());
        document.getElementById('encryptAllBtn').addEventListener('click', () => this.encryptAllFiles());
        document.getElementById('decryptAllBtn').addEventListener('click', () => this.decryptAllFiles());

        // File browser
        document.getElementById('refreshFilesBtn').addEventListener('click', () => this.loadFileList());
        document.getElementById('fileFilter').addEventListener('change', () => this.loadFileList());
        document.getElementById('fileSearch').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.loadFileList();
        });
        document.getElementById('toggleViewBtn').addEventListener('click', () => this.toggleView());

        // File path input - allow Enter key
        document.getElementById('singleFilePath').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.encryptSingleFile();
            }
        });

        // Log controls
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());
        document.getElementById('exportLogBtn').addEventListener('click', () => this.exportLog());

        // Theme and modal
        document.getElementById('toggleThemeBtn').addEventListener('click', () => this.toggleTheme());
        document.getElementById('aboutBtn').addEventListener('click', () => this.showAboutModal());
        document.querySelector('.modal-close')?.addEventListener('click', () => this.hideAboutModal());
        document.getElementById('aboutModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'aboutModal') this.hideAboutModal();
        });
    }

    generateRandomKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.getElementById('encryptionKey').value = key;
        this.currentKey = key;
        this.updateKeyStrength();
    }

    toggleKeyVisibility() {
        const input = document.getElementById('encryptionKey');
        const icon = document.querySelector('#toggleKeyVisibility i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    updateKeyStrength() {
        const key = this.currentKey;
        const strengthEl = document.getElementById('keyStrength');
        if (!key) {
            strengthEl.textContent = '';
            strengthEl.className = 'key-strength';
            return;
        }
        
        let strength = 'weak';
        if (key.length >= 16 && /[A-Z]/.test(key) && /[a-z]/.test(key) && /[0-9]/.test(key)) {
            strength = 'strong';
        } else if (key.length >= 8) {
            strength = 'medium';
        }
        
        strengthEl.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);
        strengthEl.className = `key-strength ${strength}`;
    }

    async setEncryptionKey() {
        const keyInput = document.getElementById('encryptionKey');
        const newKey = keyInput.value.trim();
        
        if (newKey) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/set-key`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ key: newKey })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.currentKey = newKey;
                    this.updateKeyStatus();
                    this.logOperation(`Encryption key set successfully`, 'success');
                    this.showNotification('Key set successfully!', 'success');
                } else {
                    this.showNotification(result.message, 'error');
                }
            } catch (error) {
                this.logOperation(`Error setting key: ${error.message}`, 'error');
                this.showNotification('Failed to set encryption key', 'error');
            }
        } else {
            this.showNotification('Please enter an encryption key', 'error');
        }
    }

    updateKeyStatus() {
        const statusEl = document.getElementById('keyStatus');
        if (this.currentKey) {
            const masked = this.currentKey.length > 10 
                ? this.currentKey.substring(0, 4) + '...' + this.currentKey.substring(this.currentKey.length - 4)
                : '*'.repeat(this.currentKey.length);
            statusEl.innerHTML = `<i class="fas fa-check-circle"></i> Key set: ${masked}`;
        } else {
            statusEl.innerHTML = `<i class="fas fa-info-circle"></i> No key set (using default)`;
        }
    }

    async encryptSingleFile() {
        const filePath = document.getElementById('singleFilePath').value.trim();
        if (!filePath) {
            this.showNotification('Please enter a file path', 'error');
            return;
        }

        await this.executeRealOperation('encrypt', filePath);
    }

    async decryptSingleFile() {
        const filePath = document.getElementById('singleFilePath').value.trim();
        if (!filePath) {
            this.showNotification('Please enter a file path', 'error');
            return;
        }

        await this.executeRealOperation('decrypt', filePath);
    }

    async createTestFiles() {
        this.showLoading('Creating 100 test files...');
        this.logOperation('Starting test file creation...', 'info');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/create-test-files`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.logOperation('Successfully created 100 test files', 'success');
                this.showNotification('Test files created successfully!', 'success');
                this.loadFileList(); // Refresh file list
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.logOperation(`Error creating test files: ${error.message}`, 'error');
            this.showNotification('Failed to create test files', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async encryptAllFiles() {
        this.showLoading('Encrypting all files with multiprocessing...');
        this.logOperation('Starting batch encryption with multiprocessing...', 'info');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/encrypt-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.stats.encrypted += 100; // Approximate for batch
                this.stats.totalProcessed += 100;
                this.updateStatsDisplay();
                this.logOperation('All files encrypted successfully!', 'success');
                this.showNotification('All files encrypted successfully!', 'success');
                this.loadFileList();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.logOperation(`Error during batch encryption: ${error.message}`, 'error');
            this.showNotification('Failed to encrypt all files', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async decryptAllFiles() {
        this.showLoading('Decrypting all files with multiprocessing...');
        this.logOperation('Starting batch decryption with multiprocessing...', 'info');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/decrypt-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.stats.decrypted += 100; // Approximate for batch
                this.stats.totalProcessed += 100;
                this.updateStatsDisplay();
                this.logOperation('All files decrypted successfully!', 'success');
                this.showNotification('All files decrypted successfully!', 'success');
                this.loadFileList();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.logOperation(`Error during batch decryption: ${error.message}`, 'error');
            this.showNotification('Failed to decrypt all files', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async executeRealOperation(action, filePath) {
        if (this.isProcessing) {
            this.showNotification('Another operation is in progress', 'error');
            return;
        }

        const startTime = Date.now();
        this.isProcessing = true;
        this.showLoading(`${action === 'encrypt' ? 'Encrypting' : 'Decrypting'} file...`);
        this.logOperation(`Starting ${action} operation on: ${filePath}`, 'info');

        try {
            const endpoint = action === 'encrypt' ? 'encrypt-file' : 'decrypt-file';
            const response = await fetch(`${this.apiBaseUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filePath })
            });
            
            const result = await response.json();
            const duration = Date.now() - startTime;
            
            if (result.success) {
                this.logOperation(`Successfully ${action}ed: ${filePath}`, 'success');
                this.showNotification(`File ${action}ed successfully!`, 'success');
                this.updateStats(action, duration);
                this.loadFileList();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.logOperation(`Error ${action}ing file: ${error.message}`, 'error');
            this.showNotification(`Failed to ${action} file`, 'error');
        } finally {
            this.isProcessing = false;
            this.hideLoading();
        }
    }

    updateStats(action, duration) {
        if (action === 'encrypt') {
            this.stats.encrypted++;
        } else {
            this.stats.decrypted++;
        }
        this.stats.totalProcessed++;
        this.stats.processingTimes.push(duration);
        if (this.stats.processingTimes.length > 100) {
            this.stats.processingTimes.shift();
        }
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        document.getElementById('encryptedCount').textContent = this.stats.encrypted;
        document.getElementById('decryptedCount').textContent = this.stats.decrypted;
        document.getElementById('totalProcessed').textContent = this.stats.totalProcessed;
        
        const avgTime = this.stats.processingTimes.length > 0
            ? Math.round(this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length)
            : 0;
        document.getElementById('avgTime').textContent = avgTime > 1000 
            ? `${(avgTime / 1000).toFixed(2)}s` 
            : `${avgTime}ms`;
    }

    initializeDragDrop() {
        const dropZone = document.getElementById('dragDropZone');
        const fileInput = document.getElementById('fileUpload');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        dropZone.addEventListener('drop', async (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                // Process all dropped files
                for (let i = 0; i < files.length; i++) {
                    await this.handleDroppedFile(files[i]);
                }
            }
        }, false);

        dropZone.addEventListener('click', () => fileInput.click());
    }

    async handleDroppedFile(file) {
        // Accept all file types - encryption works on binary data (PNG, JPG, PDF, TXT, etc.)
        this.showLoading(`Uploading ${file.name}...`);
        this.logOperation(`Uploading file: ${file.name}`, 'info');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiBaseUrl}/upload-file`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Set the file path in the input field
                document.getElementById('singleFilePath').value = result.file.path;
                this.showNotification(`File "${file.name}" uploaded successfully! Ready to encrypt/decrypt.`, 'success');
                this.logOperation(`File uploaded: ${file.name} -> ${result.file.path}`, 'success');
                this.loadFileList(); // Refresh file list
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.logOperation(`Error uploading file: ${error.message}`, 'error');
            this.showNotification(`Failed to upload file: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileUpload(e) {
        const files = e.target.files;
        if (files && files.length > 0) {
            // Process all selected files
            for (let i = 0; i < files.length; i++) {
                await this.handleDroppedFile(files[i]);
            }
            // Reset the input so the same file can be selected again
            e.target.value = '';
        }
    }

    toggleView() {
        this.isGridView = !this.isGridView;
        const fileList = document.getElementById('fileList');
        const icon = document.querySelector('#toggleViewBtn i');
        
        if (this.isGridView) {
            fileList.classList.add('grid-view');
            icon.classList.remove('fa-th');
            icon.classList.add('fa-list');
        } else {
            fileList.classList.remove('grid-view');
            icon.classList.remove('fa-list');
            icon.classList.add('fa-th');
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.querySelector('#toggleThemeBtn i').classList.remove('fa-moon');
            document.querySelector('#toggleThemeBtn i').classList.add('fa-sun');
            document.querySelector('#toggleThemeBtn').innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
            document.querySelector('#toggleThemeBtn i').classList.remove('fa-sun');
            document.querySelector('#toggleThemeBtn i').classList.add('fa-moon');
            document.querySelector('#toggleThemeBtn').innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    }

    showAboutModal() {
        document.getElementById('aboutModal').classList.add('show');
    }

    hideAboutModal() {
        document.getElementById('aboutModal').classList.remove('show');
    }

    clearLog() {
        this.operationLog = [];
        this.updateOperationLog();
        this.showNotification('Log cleared', 'info');
    }

    exportLog() {
        const logText = this.operationLog.map(entry => 
            `[${entry.timestamp}] ${entry.type.toUpperCase()}: ${entry.message}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `encryptyor-log-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Log exported', 'success');
    }

    // Simulate C++ process execution
    async simulateProcess(command, filePath = null) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success/failure based on command
                if (command === 'create-test-files') {
                    resolve('Test files created');
                } else if (command === 'encrypt' || command === 'decrypt') {
                    // Simulate file processing
                    this.updateProgress(50);
                    setTimeout(() => {
                        this.updateProgress(100);
                        resolve(`${command} completed`);
                    }, 1000);
                } else {
                    reject(new Error('Unknown command'));
                }
            }, 500);
        });
    }

    // Simulate batch processing with progress updates
    async simulateBatchProcess(command, action) {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve('Batch processing completed');
                }
                this.updateProgress(progress);
                
                // Log progress updates
                if (progress % 20 === 0) {
                    this.logOperation(`Processed ${Math.floor(progress)}% of files`, 'info');
                }
            }, 200);
        });
    }

    updateProgress(percent) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressPercent = document.getElementById('progressPercent');
        
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${Math.floor(percent)}%`;
        
        if (percent === 0) {
            progressText.textContent = 'Ready';
        } else if (percent < 100) {
            progressText.textContent = 'Processing...';
        } else {
            progressText.textContent = 'Completed';
        }
    }

    logOperation(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type
        };
        
        this.operationLog.unshift(logEntry);
        if (this.operationLog.length > 50) {
            this.operationLog = this.operationLog.slice(0, 50);
        }
        
        this.updateOperationLog();
    }

    updateOperationLog() {
        const logContainer = document.getElementById('operationLog');
        logContainer.innerHTML = '';
        
        this.operationLog.forEach(entry => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${entry.type}`;
            logElement.innerHTML = `
                <span style="color: #718096; font-size: 0.8rem;">[${entry.timestamp}]</span>
                ${entry.message}
            `;
            logContainer.appendChild(logElement);
        });
    }

    async loadFileList() {
        const fileList = document.getElementById('fileList');
        const filter = document.getElementById('fileFilter').value;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/files`);
            const result = await response.json();
            
            if (result.success) {
                let filteredFiles = result.files.filter(file => {
                    // Apply filter
                    if (filter === 'txt' && file.type !== 'txt' && !file.name.endsWith('.txt')) return false;
                    if (filter === 'test' && !file.name.includes('test_file_')) return false;
                    if (filter === 'image') {
                        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
                        const ext = file.name.split('.').pop().toLowerCase();
                        if (!imageExts.includes(ext)) return false;
                    }
                    if (filter === 'pdf' && !file.name.toLowerCase().endsWith('.pdf')) return false;
                    
                    // Apply search query
                    if (this.searchQuery && !file.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                        return false;
                    }
                    
                    return true;
                });
                
                // Update file stats
                const totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);
                document.getElementById('fileCount').textContent = `${filteredFiles.length} file${filteredFiles.length !== 1 ? 's' : ''}`;
                document.getElementById('totalSize').textContent = this.formatBytes(totalSize);
                
                fileList.innerHTML = '';
                
                if (filteredFiles.length === 0) {
                    fileList.innerHTML = '<div class="file-item"><span style="color: #718096;">No files found</span></div>';
                    return;
                }
                
                // Render files with previews
                for (const file of filteredFiles) {
                    await this.renderFileItem(file, fileList);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            fileList.innerHTML = `<div class="file-item"><span style="color: #e53e3e;">Error loading files: ${error.message}</span></div>`;
            this.logOperation(`Error loading file list: ${error.message}`, 'error');
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    async renderFileItem(file, fileList) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.filePath = file.path;
        
        // Get preview
        const preview = await this.getFilePreview(file);
        
        fileItem.innerHTML = `
            <div class="file-preview-container">
                ${preview}
            </div>
            <div style="flex: 1; margin-left: 15px;">
                <span class="file-name">${file.name}</span>
                <div style="font-size: 0.8rem; color: #718096;">
                    Size: ${this.formatBytes(file.size)} | Modified: ${new Date(file.modified).toLocaleString()}
                </div>
            </div>
            <div class="file-actions">
                <button class="btn btn-success" onclick="app.quickEncrypt('${file.path}')" style="padding: 4px 8px; font-size: 0.8rem;" title="Encrypt">
                    <i class="fas fa-lock"></i>
                </button>
                <button class="btn btn-warning" onclick="app.quickDecrypt('${file.path}')" style="padding: 4px 8px; font-size: 0.8rem;" title="Decrypt">
                    <i class="fas fa-unlock"></i>
                </button>
                <button class="btn btn-info" onclick="app.viewFileContent('${file.path}')" style="padding: 4px 8px; font-size: 0.8rem;" title="View">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
        fileList.appendChild(fileItem);
        
        // Render previews based on file type
        const ext = file.name.split('.').pop().toLowerCase();
        if (file.type === 'pdf' || ext === 'pdf') {
            this.renderPDFPreview(file.path, fileItem.querySelector('.file-preview-container'));
        } else if (['doc', 'docx'].includes(ext)) {
            this.renderDOCPreview(file.path, fileItem.querySelector('.file-preview-container'));
        } else if (['ppt', 'pptx'].includes(ext)) {
            this.renderPPTPreview(file.path, fileItem.querySelector('.file-preview-container'));
        }
    }

    async getFilePreview(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
        
        if (imageExts.includes(ext)) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/file-preview/${encodeURIComponent(file.path)}`);
                const result = await response.json();
                if (result.success && result.type === 'image') {
                    return `<img src="${result.data}" alt="${file.name}" class="file-preview-image" />`;
                }
            } catch (error) {
                console.error('Error loading image preview:', error);
            }
        } else if (ext === 'pdf') {
            return `<div class="file-preview-pdf" data-pdf-path="${file.path}">
                <i class="fas fa-file-pdf"></i>
                <span>Loading PDF preview...</span>
            </div>`;
        } else if (['ppt', 'pptx'].includes(ext)) {
            return `<div class="file-preview-ppt-container" data-ppt-path="${file.path}">
                <i class="fas fa-file-powerpoint"></i>
                <span>Loading PPT preview...</span>
            </div>`;
        } else if (['doc', 'docx'].includes(ext)) {
            return `<div class="file-preview-doc-container" data-doc-path="${file.path}">
                <i class="fas fa-file-word"></i>
                <span>Loading DOC preview...</span>
            </div>`;
        }
        
        // Default placeholder for other file types
        return `<div class="file-preview-placeholder">
            <i class="fas fa-file"></i>
        </div>`;
    }

    async renderPDFPreview(filePath, container) {
        try {
            // Set up PDF.js worker
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                const response = await fetch(`${this.apiBaseUrl}/file-preview/${encodeURIComponent(filePath)}`);
                const result = await response.json();
                
                if (result.success && result.type === 'pdf') {
                    // Load the PDF file - use the backend endpoint to serve the file
                    const fileUrl = `${this.apiBaseUrl.replace('/api', '')}/${filePath}`;
                    // Use fetch to get the file as blob, then create object URL
                    const fileResponse = await fetch(fileUrl);
                    const blob = await fileResponse.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    
                    const loadingTask = pdfjsLib.getDocument(blobUrl);
                    const pdf = await loadingTask.promise;
                    
                    // Get the first page
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 0.5 });
                    
                    // Create canvas for rendering
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // Render PDF page to canvas
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;
                    
                    // Replace container content with canvas
                    container.innerHTML = '';
                    canvas.className = 'file-preview-pdf-canvas';
                    container.appendChild(canvas);
                }
            }
        } catch (error) {
            console.error('Error rendering PDF preview:', error);
            container.innerHTML = `<div class="file-preview-placeholder">
                <i class="fas fa-file-pdf"></i>
                <span>PDF (preview unavailable)</span>
            </div>`;
        }
    }

    async renderDOCPreview(filePath, container) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/file-preview/${encodeURIComponent(filePath)}`);
            const result = await response.json();
            
            if (result.success && (result.type === 'doc' || result.type === 'docx')) {
                // For DOCX files, use mammoth.js to convert to HTML
                if (filePath.toLowerCase().endsWith('.docx') && typeof mammoth !== 'undefined') {
                    // Convert base64 data URL to array buffer
                    const base64Data = result.data.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const arrayBuffer = bytes.buffer;
                    
                    // Convert DOCX to HTML using mammoth
                    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                    
                    // Strip HTML tags and get plain text for preview
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlResult.value;
                    let textContent = tempDiv.textContent || tempDiv.innerText || '';
                    
                    // Limit to first ~200 characters (roughly first page)
                    textContent = textContent.substring(0, 200).trim();
                    if (textContent.length >= 200) {
                        textContent += '...';
                    }
                    
                    // Create a preview div with the first page content
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'file-preview-doc-content';
                    previewDiv.textContent = textContent || 'Word Document';
                    
                    container.innerHTML = '';
                    container.appendChild(previewDiv);
                } else {
                    // For .doc files or if mammoth is not available, show placeholder
                    container.innerHTML = `<div class="file-preview-placeholder file-preview-doc">
                        <i class="fas fa-file-word"></i>
                        <span>Word Document</span>
                    </div>`;
                }
            }
        } catch (error) {
            console.error('Error rendering DOC preview:', error);
            container.innerHTML = `<div class="file-preview-placeholder file-preview-doc">
                <i class="fas fa-file-word"></i>
                <span>Word Document</span>
            </div>`;
        }
    }

    async renderPPTPreview(filePath, container) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/file-preview/${encodeURIComponent(filePath)}`);
            const result = await response.json();
            
            if (result.success && result.type === 'ppt') {
                // For PPT files, we'll show a placeholder with file info
                // Full PPT preview would require server-side conversion or specialized library
                container.innerHTML = `<div class="file-preview-placeholder file-preview-ppt">
                    <i class="fas fa-file-powerpoint"></i>
                    <span>PowerPoint</span>
                    <div style="font-size: 0.6rem; margin-top: 3px;">${this.formatBytes(result.size)}</div>
                </div>`;
            }
        } catch (error) {
            console.error('Error rendering PPT preview:', error);
            container.innerHTML = `<div class="file-preview-placeholder file-preview-ppt">
                <i class="fas fa-file-powerpoint"></i>
                <span>PowerPoint</span>
            </div>`;
        }
    }

    generateMockFileList() {
        const files = [];
        
        // Add test files
        for (let i = 1; i <= 100; i++) {
            files.push(`test/test_file_${i}.txt`);
        }
        
        // Add some other files
        files.push('documents/important.txt');
        files.push('data/config.txt');
        files.push('backup/archive.txt');
        
        return files;
    }

    quickEncrypt(filePath) {
        document.getElementById('singleFilePath').value = filePath;
        this.encryptSingleFile();
    }

    quickDecrypt(filePath) {
        document.getElementById('singleFilePath').value = filePath;
        this.decryptSingleFile();
    }

    async viewFileContent(filePath) {
        this.showLoading('Loading file preview...');
        try {
            // Get file preview data
            const response = await fetch(`${this.apiBaseUrl}/file-preview/${encodeURIComponent(filePath)}`);
            const result = await response.json();
            
            if (result.success) {
                // Show preview modal based on file type
                await this.showFilePreviewModal(filePath, result);
            } else {
                // Fallback to text content for unsupported types
                const contentResponse = await fetch(`${this.apiBaseUrl}/file-content/${encodeURIComponent(filePath)}`);
                const contentResult = await contentResponse.json();
                if (contentResult.success) {
                    this.showFileContentModal(filePath, contentResult.content, contentResult.isBinary);
                } else {
                    this.showNotification('Failed to load file preview', 'error');
                }
            }
        } catch (error) {
            console.error('Error loading file preview:', error);
            this.showNotification('Error loading file preview', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async showFilePreviewModal(filePath, previewData) {
        const fileName = filePath.split('/').pop();
        const ext = fileName.split('.').pop().toLowerCase();
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'file-preview-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'file-preview-modal-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 15px;
            max-width: 90%;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px;
            border-bottom: 1px solid #e2e8f0;
            background: #f7fafc;
        `;
        header.innerHTML = `
            <h3 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-eye"></i> ${fileName}
            </h3>
            <button class="modal-close-btn" style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 1.2rem;">&times;</button>
        `;

        // Preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview-modal-body';
        previewContainer.style.cssText = `
            padding: 20px;
            overflow: auto;
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f8fafc;
        `;

        modalContent.appendChild(header);
        modalContent.appendChild(previewContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Render preview based on type
        if (previewData.type === 'image') {
            const img = document.createElement('img');
            img.src = previewData.data;
            img.style.cssText = `
                max-width: 100%;
                max-height: 70vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            `;
            previewContainer.appendChild(img);
        } else if (previewData.type === 'pdf') {
            await this.renderPDFPreviewModal(filePath, previewContainer);
        } else if (previewData.type === 'doc' || previewData.type === 'docx') {
            await this.renderDOCPreviewModal(filePath, previewContainer, previewData);
        } else if (previewData.type === 'ppt') {
            this.renderPPTPreviewModal(filePath, previewContainer, previewData);
        } else {
            // Fallback for other types
            previewContainer.innerHTML = `
                <div style="text-align: center; color: #718096;">
                    <i class="fas fa-file" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <p>Preview not available for this file type</p>
                    <p style="font-size: 0.9rem;">File: ${fileName}</p>
                </div>
            `;
        }

        // Close handlers
        const closeBtn = header.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    async renderPDFPreviewModal(filePath, container) {
        container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading PDF...</div>';
        
        try {
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                const fileUrl = `${this.apiBaseUrl.replace('/api', '')}/${filePath}`;
                const fileResponse = await fetch(fileUrl);
                const blob = await fileResponse.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                const loadingTask = pdfjsLib.getDocument(blobUrl);
                const pdf = await loadingTask.promise;
                
                // Render first page at larger scale
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.5 });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                container.innerHTML = '';
                canvas.style.cssText = `
                    max-width: 100%;
                    max-height: 70vh;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                `;
                container.appendChild(canvas);
                
                // Show page info
                const pageInfo = document.createElement('div');
                pageInfo.style.cssText = 'margin-top: 15px; color: #718096; font-size: 0.9rem;';
                pageInfo.textContent = `Page 1 of ${pdf.numPages}`;
                container.appendChild(pageInfo);
                
                URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            container.innerHTML = `<div style="text-align: center; color: #e53e3e;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading PDF preview</p>
            </div>`;
        }
    }

    async renderDOCPreviewModal(filePath, container, previewData) {
        container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading document...</div>';
        
        try {
            if (filePath.toLowerCase().endsWith('.docx') && typeof mammoth !== 'undefined') {
                const base64Data = previewData.data.split(',')[1];
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const arrayBuffer = bytes.buffer;
                
                const htmlResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                
                const docContent = document.createElement('div');
                docContent.className = 'doc-preview-content';
                docContent.innerHTML = htmlResult.value;
                docContent.style.cssText = `
                    max-width: 800px;
                    max-height: 70vh;
                    overflow: auto;
                    padding: 30px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    text-align: left;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                `;
                
                container.innerHTML = '';
                container.appendChild(docContent);
            } else {
                container.innerHTML = `
                    <div style="text-align: center; color: #718096;">
                        <i class="fas fa-file-word" style="font-size: 3rem; margin-bottom: 15px;"></i>
                        <p>Word Document</p>
                        <p style="font-size: 0.9rem;">Preview available for .docx files only</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = `<div style="text-align: center; color: #e53e3e;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading document preview</p>
            </div>`;
        }
    }

    renderPPTPreviewModal(filePath, container, previewData) {
        container.innerHTML = `
            <div style="text-align: center; color: #718096; padding: 40px;">
                <i class="fas fa-file-powerpoint" style="font-size: 4rem; margin-bottom: 20px; color: #ed8936;"></i>
                <h3 style="color: #4a5568; margin-bottom: 10px;">PowerPoint Presentation</h3>
                <p>File: ${filePath.split('/').pop()}</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Size: ${this.formatBytes(previewData.size)}</p>
                <p style="font-size: 0.85rem; margin-top: 20px; color: #a0aec0;">
                    Full preview requires specialized libraries. Use PowerPoint to view the file.
                </p>
            </div>
        `;
    }

    showFileContentModal(filePath, content, isBinary = false) {
        const fileName = filePath.split('/').pop();
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'file-preview-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 15px;
            max-width: 90%;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-file-alt"></i> ${fileName}
                </h3>
                <button class="modal-close-btn" style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 1.2rem;">&times;</button>
            </div>
            <pre style="background: #f8fafc; padding: 15px; border-radius: 5px; overflow: auto; max-height: 70vh; font-family: 'Courier New', monospace; font-size: 0.9rem; white-space: pre-wrap; border: 1px solid #e2e8f0;">${isBinary ? `<span style="color: #718096;">${content}</span>` : content}</pre>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close handlers
        const closeBtn = modalContent.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    async checkBackendConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/files`);
            if (response.ok) {
                this.logOperation('Backend connection established', 'success');
            } else {
                throw new Error('Backend not responding');
            }
        } catch (error) {
            this.logOperation('Backend connection failed - make sure to run: npm start', 'error');
            this.showNotification('Backend not running! Run "npm start" in the frontend directory', 'error');
        }
    }

    showLoading(text = 'Processing...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
        this.updateProgress(0);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#e53e3e',
            info: '#4299e1',
            warning: '#ed8936'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EncryptyorFrontend();
    
    // Add some initial log entries
    app.logOperation('Encryptyor Frontend initialized', 'success');
    app.logOperation('Ready to process files', 'info');
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+E for encrypt
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        app.encryptSingleFile();
    }
    
    // Ctrl+D for decrypt
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        app.decryptSingleFile();
    }
    
    // Ctrl+R for refresh files
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        app.loadFileList();
    }
});

