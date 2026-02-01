const express = require('express');
const router = express.Router();

/**
 * GET /api/youtube/health
 * Health check for YouTube API (kept for compatibility)
 * Note: YouTube now uses client-side iframe embed instead of server-side extraction
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'YouTube API is available (using client-side iframe embed)',
        mode: 'iframe-embed',
    });
});

module.exports = router;
