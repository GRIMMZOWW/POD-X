const express = require('express');
const router = express.Router();
const youtubeService = require('../services/youtubeService');

/**
 * POST /api/youtube/extract
 * Extract YouTube metadata and stream URL
 */
router.post('/extract', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'Missing URL',
                message: 'Please provide a YouTube URL',
            });
        }

        console.log(`[API] Extracting YouTube URL: ${url}`);

        const data = await youtubeService.extractYouTubeData(url);

        res.json({
            success: true,
            data,
            mode: youtubeService.getCurrentMode(),
        });
    } catch (error) {
        console.error('[API] YouTube extraction error:', error);

        res.status(500).json({
            error: 'Extraction failed',
            message: error.message,
            mode: youtubeService.getCurrentMode(),
        });
    }
});

/**
 * GET /api/youtube/mode
 * Get current extraction mode
 */
router.get('/mode', (req, res) => {
    res.json({
        mode: youtubeService.getCurrentMode(),
    });
});

/**
 * POST /api/youtube/mode
 * Set extraction mode (for testing)
 */
router.post('/mode', (req, res) => {
    const { mode } = req.body;

    if (!['ytdlp', 'cobalt', 'mock'].includes(mode)) {
        return res.status(400).json({
            error: 'Invalid mode',
            message: 'Mode must be: ytdlp, cobalt, or mock',
        });
    }

    youtubeService.setMode(mode);

    res.json({
        success: true,
        mode: youtubeService.getCurrentMode(),
    });
});

module.exports = router;
