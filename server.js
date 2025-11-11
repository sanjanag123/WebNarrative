const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const country = req.params.country || 'general';
        const countryDir = path.join(uploadsDir, country);
        if (!fs.existsSync(countryDir)) {
            fs.mkdirSync(countryDir, { recursive: true });
        }
        cb(null, countryDir);
    },
    filename: function (req, file, cb) {
        // Add timestamp to prevent filename conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '-' + originalName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// File metadata storage (JSON file)
const metadataFile = path.join(__dirname, 'uploads', 'metadata.json');

function getMetadata() {
    if (fs.existsSync(metadataFile)) {
        try {
            const content = fs.readFileSync(metadataFile, 'utf8');
            if (!content || content.trim() === '') {
                return {};
            }
            return JSON.parse(content);
        } catch (e) {
            console.error('Error reading metadata file:', e.message);
            // Return empty object if file is corrupted
            return {};
        }
    }
    return {};
}

function saveMetadata(metadata) {
    try {
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
        if (error.code === 'ENOSPC') {
            console.error('ERROR: No space left on device! Cannot save metadata.');
            throw new Error('Storage full: Please free up disk space');
        } else {
            console.error('Error saving metadata:', error);
            throw error;
        }
    }
}

// API: Upload files for a country
app.post('/api/upload/:country', upload.array('files', 10), (req, res) => {
    try {
        const country = req.params.country;
        const metadata = getMetadata();
        
        if (!metadata[country]) {
            metadata[country] = [];
        }
        
        // Generate a unique user ID for this session (store in cookie or use IP + timestamp)
        const userId = req.headers['x-user-id'] || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const uploadedFiles = req.files.map((file, index) => ({
            id: Date.now() + '-' + index + '-' + Math.random().toString(36).substr(2, 9),
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            type: file.mimetype,
            uploadedAt: new Date().toISOString(),
            path: `/api/files/${country}/${file.filename}`,
            uploadedBy: userId
        }));
        
        metadata[country].push(...uploadedFiles);
        
        try {
            saveMetadata(metadata);
        } catch (error) {
            // If metadata save fails, remove the uploaded files
            req.files.forEach(file => {
                const filePath = path.join(uploadsDir, country, file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            return res.status(500).json({ 
                success: false, 
                error: error.message || 'Failed to save file metadata. Check disk space.' 
            });
        }
        
        res.json({ 
            success: true, 
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Get all files for a country
app.get('/api/files/:country', (req, res) => {
    try {
        const country = req.params.country;
        console.log(`GET /api/files/${country} - Request received`);
        const metadata = getMetadata();
        const files = metadata[country] || [];
        
        // Get user ID from header
        const userId = req.headers['x-user-id'] || null;
        
        // Ensure files is an array
        const filesArray = (Array.isArray(files) ? files : []).map(file => ({
            ...file,
            canEditCaption: userId && file.uploadedBy === userId // Only uploader can delete
        }));
        
        console.log(`Returning ${filesArray.length} files for ${country}`);
        res.json({ success: true, files: filesArray });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Serve/download a specific file
app.get('/api/files/:country/:filename', (req, res) => {
    try {
        const country = req.params.country;
        let filename = req.params.filename;
        
        // Try to decode, but if it fails, use the original
        try {
            filename = decodeURIComponent(filename);
        } catch (e) {
            // If decoding fails, use the original filename
        }
        
        const filePath = path.join(uploadsDir, country, filename);
        
        console.log(`Serving file: ${filePath}`);
        console.log(`Requested filename: ${req.params.filename}`);
        
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            console.error(`File not found: ${filePath}`);
            // Try without decoding in case it's already decoded
            const altPath = path.join(uploadsDir, country, req.params.filename);
            if (fs.existsSync(altPath)) {
                console.log(`Found file with alternative path: ${altPath}`);
                res.sendFile(altPath);
            } else {
                res.status(404).json({ success: false, error: 'File not found' });
            }
        }
    } catch (error) {
        console.error('File serve error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Delete a file
app.delete('/api/files/:country/delete/:fileId', (req, res) => {
    try {
        const country = req.params.country;
        const fileId = req.params.fileId;
        const userId = req.headers['x-user-id'] || null;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }
        
        const metadata = getMetadata();
        
        if (!metadata[country]) {
            return res.status(404).json({ success: false, error: 'Country not found' });
        }
        
        const fileIndex = metadata[country].findIndex(f => f.id === fileId);
        
        if (fileIndex === -1) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }
        
        const file = metadata[country][fileIndex];
        
        // Only allow deletion by the uploader
        if (!file.uploadedBy || file.uploadedBy !== userId) {
            return res.status(403).json({ success: false, error: 'Only the file uploader can delete files' });
        }
        
        // Delete the physical file
        const filePath = path.join(uploadsDir, country, file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remove from metadata
        metadata[country].splice(fileIndex, 1);
        saveMetadata(metadata);
        
        res.json({ 
            success: true, 
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route for the root path (before static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const countryPagePath = path.join(__dirname, 'country.html');
app.get('/country/:slug', (req, res) => {
    res.sendFile(countryPagePath);
});

// Serve static files from the current directory (but exclude /api routes)
const staticFiles = express.static(path.join(__dirname));
app.use((req, res, next) => {
    // Don't serve static files for API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    staticFiles(req, res, next);
});

// 404 handler for API routes (must be last, after all other routes)
app.use('/api', (req, res) => {
    console.log(`404: API route not found: ${req.method} ${req.path}`);
    res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Start the server - listen on all interfaces (0.0.0.0) so it's accessible from browsers
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Server is also accessible at http://127.0.0.1:${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
        console.error(`Try: PORT=${PORT + 1} npm start`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit, just log the error
});

