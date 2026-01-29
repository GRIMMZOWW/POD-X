const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processBookFile } = require('../services/bookService');

const router = express.Router();

// Configure multer for book uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../temp');
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
        const allowedExtensions = ['.pdf', '.txt', '.epub'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, TXT, and EPUB files are allowed.'));
        }
    }
});

/**
 * Upload single book
 */
router.post('/upload', upload.single('book'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('[Book Upload] Processing:', req.file.originalname);

        const result = await processBookFile(req.file);

        res.json({
            success: true,
            book: result
        });

    } catch (error) {
        console.error('[Book Upload] Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to process book'
        });
    }
});

/**
 * Upload multiple books
 */
router.post('/upload-multiple', upload.array('books', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        console.log(`[Book Upload] Processing ${req.files.length} books`);

        const results = [];
        const errors = [];

        for (const file of req.files) {
            try {
                const result = await processBookFile(file);
                results.push(result);
            } catch (error) {
                console.error(`[Book Upload] Failed to process ${file.originalname}:`, error);
                errors.push({
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            books: results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[Book Upload] Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to process books'
        });
    }
});

module.exports = router;
