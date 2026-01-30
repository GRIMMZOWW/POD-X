const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processMusicFile } = require('../services/musicService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'audio/mpeg',
            'audio/mp3',
            'audio/mp4',
            'audio/m4a',
            'audio/x-m4a',
            'audio/wav',
            'audio/flac'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP3, M4A, WAV, and FLAC are allowed.'));
        }
    }
});

/**
 * POST /api/music/upload
 * Upload a music file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        console.log('[Music API] Processing upload:', req.file.originalname);

        const musicData = await processMusicFile(req.file);

        res.json({
            success: true,
            data: musicData
        });

    } catch (error) {
        console.error('[Music API] Upload error:', error.message);

        // Clean up temp file if it exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process music file',
            message: error.message
        });
    }
});

/**
 * POST /api/music/upload-multiple
 * Upload multiple music files
 */
router.post('/upload-multiple', upload.array('files', 20), async (req, res) => {
    try {
        console.log('[Music API] Upload request received');
        console.log('[Music API] Files:', req.files ? req.files.length : 0);

        // If no files uploaded, return success (files stored client-side)
        if (!req.files || req.files.length === 0) {
            console.log('[Music API] No files in request, returning success');
            return res.json({
                success: true,
                message: 'Upload endpoint ready',
                data: []
            });
        }

        const results = [];
        const errors = [];

        for (const file of req.files) {
            try {
                const musicData = await processMusicFile(file);
                results.push(musicData);
            } catch (error) {
                errors.push({
                    file: file.originalname,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            data: results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[Music API] Multiple upload error:', error.message);

        res.status(500).json({
            success: false,
            error: 'Failed to process music files',
            message: error.message
        });
    }
});

module.exports = router;
