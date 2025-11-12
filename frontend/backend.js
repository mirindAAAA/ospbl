// Simple Node.js backend to interface with C++ executables
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = 3001;

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(uploadsDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Preserve original filename with timestamp to avoid conflicts
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}_${originalName}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        // Accept all file types (PNG, JPG, PDF, TXT, etc.)
        cb(null, true);
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files from uploads and test directories
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/test', express.static(path.join(__dirname, '..', 'test')));

// Path to your C++ executables
const EXECUTABLE_PATH = path.join(__dirname, '..', 'build');
const ENCRYPT_DECRYPT_EXE = path.join(EXECUTABLE_PATH, 'encrypt_decrypt.exe');
const CRYPTION_EXE = path.join(EXECUTABLE_PATH, 'cryption.exe');

// Set environment variable for encryption key
function setEncryptionKey(key) {
    process.env.ENCRYPTION_KEY = key.toString();
    console.log(`Encryption key set to: ${key}`);
}

// Execute C++ executable with input
function executeCppExecutable(command, input = null) {
    return new Promise((resolve, reject) => {
        const child = spawn(ENCRYPT_DECRYPT_EXE, [command], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '5' }
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, output: stdout, error: stderr });
            } else {
                reject(new Error(`Process exited with code ${code}: ${stderr}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });

        // If input is provided, send it to stdin
        if (input) {
            child.stdin.write(input);
            child.stdin.end();
        }
    });
}

// API Routes

// Set encryption key
app.post('/api/set-key', (req, res) => {
    const { key } = req.body;
    if (key && typeof key === 'string') {
        setEncryptionKey(key);
        res.json({ success: true, message: 'Key set successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Key must be a valid string' });
    }
});

// Create test files
app.post('/api/create-test-files', async (req, res) => {
    try {
        const result = await executeCppExecutable('create-test-files');
        res.json({ success: true, message: 'Test files created successfully', output: result.output });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Encrypt single file
app.post('/api/encrypt-file', async (req, res) => {
    const { filePath } = req.body;
    try {
        // Check if file exists
        const fullPath = path.join(__dirname, '..', filePath);
        if (!await fs.pathExists(fullPath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const input = `${filePath}\nencrypt\n`;
        const result = await executeCppExecutable('', input);
        res.json({ success: true, message: 'File encrypted successfully', output: result.output });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Decrypt single file
app.post('/api/decrypt-file', async (req, res) => {
    const { filePath } = req.body;
    try {
        // Check if file exists
        const fullPath = path.join(__dirname, '..', filePath);
        if (!await fs.pathExists(fullPath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const input = `${filePath}\ndecrypt\n`;
        const result = await executeCppExecutable('', input);
        res.json({ success: true, message: 'File decrypted successfully', output: result.output });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Encrypt all files
app.post('/api/encrypt-all', async (req, res) => {
    try {
        const result = await executeCppExecutable('process-all');
        res.json({ success: true, message: 'All files encrypted successfully', output: result.output });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Decrypt all files
app.post('/api/decrypt-all', async (req, res) => {
    try {
        const result = await executeCppExecutable('decrypt-all');
        res.json({ success: true, message: 'All files decrypted successfully', output: result.output });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload file endpoint
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const relativePath = `uploads/${req.file.filename}`;
        res.json({ 
            success: true, 
            message: 'File uploaded successfully',
            file: {
                name: req.file.originalname,
                path: relativePath,
                size: req.file.size,
                modified: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get file list - now scans multiple directories
app.get('/api/files', async (req, res) => {
    try {
        const files = [];
        const baseDir = path.join(__dirname, '..');
        
        // Directories to scan
        const directoriesToScan = ['test', 'uploads'];
        
        for (const dirName of directoriesToScan) {
            const dirPath = path.join(baseDir, dirName);
            if (await fs.pathExists(dirPath)) {
                try {
                    const fileList = await fs.readdir(dirPath);
                    for (const file of fileList) {
                        const filePath = path.join(dirPath, file);
                        const stats = await fs.stat(filePath);
                        if (stats.isFile()) {
                            files.push({
                                name: file,
                                path: `${dirName}/${file}`,
                                size: stats.size,
                                modified: stats.mtime,
                                type: path.extname(file).toLowerCase().substring(1) || 'unknown'
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error reading directory ${dirName}:`, err.message);
                }
            }
        }
        
        res.json({ success: true, files });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get file preview endpoint - returns preview data for images, PDFs, etc.
app.get('/api/file-preview/:filePath(*)', async (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', req.params.filePath);
        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const ext = path.extname(filePath).toLowerCase();
        const stats = await fs.stat(filePath);
        
        // For images, return base64 encoded image
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
        if (imageExts.includes(ext)) {
            try {
                const imageBuffer = await fs.readFile(filePath);
                const base64Image = imageBuffer.toString('base64');
                const mimeType = ext === '.png' ? 'image/png' : 
                               ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                               ext === '.gif' ? 'image/gif' :
                               ext === '.bmp' ? 'image/bmp' :
                               ext === '.svg' ? 'image/svg+xml' :
                               ext === '.webp' ? 'image/webp' : 'image/png';
                
                res.json({ 
                    success: true, 
                    type: 'image',
                    data: `data:${mimeType};base64,${base64Image}`,
                    size: stats.size
                });
            } catch (err) {
                res.status(500).json({ success: false, message: 'Error reading image file' });
            }
        }
        // For PDFs, return file path and metadata (frontend will use PDF.js)
        else if (ext === '.pdf') {
            res.json({ 
                success: true, 
                type: 'pdf',
                path: req.params.filePath,
                size: stats.size
            });
        }
        // For PPT and DOC files, return file data for preview
        else if (['.ppt', '.pptx', '.doc', '.docx'].includes(ext)) {
            try {
                const fileBuffer = await fs.readFile(filePath);
                const base64Data = fileBuffer.toString('base64');
                const mimeType = ext === '.ppt' || ext === '.pptx' ? 
                    (ext === '.ppt' ? 'application/vnd.ms-powerpoint' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation') :
                    (ext === '.doc' ? 'application/msword' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                
                res.json({ 
                    success: true, 
                    type: ext === '.ppt' || ext === '.pptx' ? 'ppt' : 'doc',
                    path: req.params.filePath,
                    size: stats.size,
                    name: path.basename(filePath),
                    data: `data:${mimeType};base64,${base64Data}`,
                    mimeType: mimeType
                });
            } catch (err) {
                res.status(500).json({ success: false, message: 'Error reading file' });
            }
        }
        else {
            res.json({ 
                success: false, 
                message: 'Preview not available for this file type' 
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get file content (for verification) - handles both text and binary files
app.get('/api/file-content/:filePath(*)', async (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', req.params.filePath);
        if (await fs.pathExists(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const isTextFile = ['.txt', '.json', '.xml', '.csv', '.log', '.md', '.js', '.html', '.css'].includes(ext);
            
            if (isTextFile) {
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    res.json({ success: true, content, isBinary: false });
                } catch (err) {
                    // If UTF-8 read fails, treat as binary
                    res.json({ success: true, content: '[Binary file - cannot display as text]', isBinary: true });
                }
            } else {
                // For binary files (images, PDFs, etc.), just indicate it's binary
                const stats = await fs.stat(filePath);
                res.json({ 
                    success: true, 
                    content: `[Binary file: ${ext || 'unknown'} - ${(stats.size / 1024).toFixed(2)} KB]`,
                    isBinary: true 
                });
            }
        } else {
            res.status(404).json({ success: false, message: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Encryptyor Backend running on http://localhost:${PORT}`);
    console.log(`C++ executables path: ${EXECUTABLE_PATH}`);
    console.log(`Make sure your C++ executables are built in the build/ directory`);
});

