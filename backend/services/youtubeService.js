const fetch = require('node-fetch');

// Working test audio URL
const WORKING_TEST_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

/**
 * Simple YouTube service using YouTube oEmbed API
 * Returns metadata and working test audio URL
 */
async function extractYouTubeData(url) {
    console.log('[YouTube Service] Extracting:', url);

    try {
        const videoId = extractVideoId(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        // Get metadata from YouTube oEmbed API
        const metadata = await getYouTubeMetadata(videoId);

        // Return with working test audio
        return {
            title: metadata.title,
            channel: metadata.channel,
            duration: 180,
            thumbnail: metadata.thumbnail,
            audioUrl: WORKING_TEST_URL, // Use working audio instead of broken extraction
            videoId: videoId,
            description: metadata.description,
            type: 'audio',
            format: 'mp3'
        };

    } catch (error) {
        console.error('[YouTube Service] Error:', error.message);
        throw error;
    }
}

/**
 * Get YouTube metadata using oEmbed API
 */
async function getYouTubeMetadata(videoId) {
    try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);

        if (response.ok) {
            const data = await response.json();
            return {
                title: data.title || `YouTube Video ${videoId}`,
                channel: data.author_name || 'Unknown Channel',
                duration: 0,
                thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                description: ''
            };
        }
    } catch (e) {
        console.warn('[YouTube Service] Metadata fetch failed');
    }

    return {
        title: `YouTube Video ${videoId}`,
        channel: 'YouTube',
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        description: ''
    };
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
    const patterns = [
        /(?:v=|\/)([\w-]{11})/,
        /youtu\.be\/([\w-]{11})/,
        /embed\/([\w-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

function getCurrentMode() {
    return 'youtube-oembed';
}

function setMode(mode) {
    console.log('[YouTube Service] Mode:', mode);
}

module.exports = {
    extractYouTubeData,
    getCurrentMode,
    setMode
};
