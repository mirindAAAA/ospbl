# Encryptyor Frontend

A modern web-based frontend for the Encryptyor file encryption/decryption tool with multiprocessing capabilities.

## Features

### 🔐 Encryption Management
- **Configurable Encryption Key**: Set custom encryption keys (1-255)
- **Real-time Key Status**: Visual indicator of current encryption key
- **Environment Integration**: Simulates setting ENCRYPTION_KEY environment variable

### 📁 File Operations
- **Single File Processing**: Encrypt/decrypt individual files
- **Batch Processing**: Process multiple files concurrently using multiprocessing
- **Test File Generation**: Create 100 test files for demonstration
- **File Browser**: Browse and manage files with filtering options

### ⚡ Advanced Features
- **Multiprocessing Simulation**: Visual representation of parallel processing
- **Real-time Progress Tracking**: Progress bars and operation logs
- **Operation History**: Detailed log of all operations with timestamps
- **Keyboard Shortcuts**: Quick access to common operations
- **Responsive Design**: Works on desktop and mobile devices

### 🎨 Modern UI/UX
- **Gradient Design**: Beautiful gradient backgrounds and buttons
- **Loading Animations**: Smooth loading overlays and progress indicators
- **Notification System**: Toast notifications for user feedback
- **Font Awesome Icons**: Professional iconography throughout
- **Glass Morphism**: Modern backdrop blur effects

## Quick Start

### Prerequisites
- Node.js (version 14 or higher) - Download from [nodejs.org](https://nodejs.org/)
- Your C++ executables built in the `build/` directory

### Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Backend Server**:
   ```bash
   # Windows
   npm start
   # or use the batch file
   start.bat
   
   # PowerShell
   .\start.ps1
   ```

3. **Access the Frontend**:
   - Open your browser and go to: `http://localhost:3001`
   - The frontend will automatically connect to the backend

4. **Set Encryption Key**:
   - Enter a key value (1-255) in the encryption settings
   - Click "Set Key" to apply

5. **Process Files**:
   - **Single File**: Enter file path and click Encrypt/Decrypt
   - **Batch Processing**: Use the batch operation buttons
   - **Quick Actions**: Use the file browser for quick operations
   - **View Content**: Click the eye icon to view file contents

## Keyboard Shortcuts

- `Ctrl + E`: Encrypt selected file
- `Ctrl + D`: Decrypt selected file  
- `Ctrl + R`: Refresh file list
- `Enter`: Process file when in file path input

## File Operations

### Single File Processing
1. Enter the file path (e.g., `test/test_file_1.txt`)
2. Click "Encrypt" or "Decrypt"
3. Monitor progress in the operation log

### Batch Processing
1. **Create Test Files**: Generates 100 test files in the `test/` directory
2. **Encrypt All**: Encrypts all available files using multiprocessing
3. **Decrypt All**: Decrypts all available files using multiprocessing

### File Browser
- **Filter Options**: All Files, Text Files, Test Files
- **Quick Actions**: Direct encrypt/decrypt buttons for each file
- **Auto-refresh**: Updates when operations complete

## Integration with C++ Backend

This frontend is designed to interface with your C++ executables:

### Backend Commands
- `./build/encrypt_decrypt.exe` - Single file processing
- `./build/encrypt_decrypt.exe create-test-files` - Create test files
- `./build/encrypt_decrypt.exe process-all` - Encrypt all files
- `./build/encrypt_decrypt.exe decrypt-all` - Decrypt all files

### Environment Variables
- `ENCRYPTION_KEY` - Sets the encryption key for operations

## Technical Details

### Architecture
- **Pure HTML/CSS/JavaScript**: No frameworks required
- **Modular Design**: Clean separation of concerns
- **Event-driven**: Responsive user interactions
- **Async Operations**: Non-blocking file operations

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Performance Features
- **Lazy Loading**: Efficient file list rendering
- **Debounced Operations**: Prevents duplicate requests
- **Memory Management**: Automatic log cleanup
- **Responsive Updates**: Smooth UI animations

## Customization

### Styling
- Modify `styles.css` for visual customization
- Update color schemes in CSS variables
- Adjust animations and transitions

### Functionality
- Extend `script.js` for additional features
- Add new operation types
- Implement custom file filters

### Integration
- Connect to real backend APIs
- Add WebSocket support for real-time updates
- Implement file upload functionality

## Project Structure

```
frontend/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and animations
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

## Future Enhancements

- **Real Backend Integration**: Connect to actual C++ executables
- **File Upload**: Drag-and-drop file upload functionality
- **Advanced Encryption**: Support for multiple encryption algorithms
- **User Management**: Multi-user support with authentication
- **Cloud Storage**: Integration with cloud storage services
- **Mobile App**: React Native mobile application

## Troubleshooting

### Common Issues
1. **Files not loading**: Check file paths and permissions
2. **Operations failing**: Verify C++ executables are built
3. **UI not responsive**: Check browser compatibility

### Debug Mode
- Open browser developer tools (F12)
- Check console for error messages
- Monitor network requests for backend calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details
