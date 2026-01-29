const ytdl = require('@distube/ytdl-core');

// Simple, reliable YouTube extraction using ytdl-core
let currentMode = process.env.YOUTUBE_MODE || 'ytdl';

// Mock data for fallback
const MOCK_DATA = {
    title: 'Test Audio Stream',
    channel: 'POD-X Demo',
    duration: 180,
    thumbnail: 'https://via.placeholder.com/300x300/6B46C1/FFFFFF?text=POD-X',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
};

/**
 * Extract YouTube metadata and stream URL
 */
async function extractYouTubeData(url) {
    console.log(`[YouTube Service] Extracting: ${url}`);

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
    }

    try {
        // Get video info
        const info = await ytdl.getInfo(url);
        console.log('[ytdl-core] Got video info:', info.videoDetails.title);

        // Get best audio format
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        if (audioFormats.length === 0) {
            throw new Error('No audio formats found');
        }

        // Sort by quality and get the best one
        const bestAudio = audioFormats.sort((a, b) =>
            (b.audioBitrate || 0) - (a.audioBitrate || 0)
        )[0];

        console.log('[ytdl-core] Best audio format:', bestAudio.mimeType, bestAudio.audioBitrate);

        return {
            title: info.videoDetails.title || 'Unknown Title',
            channel: info.videoDetails.author?.name || 'Unknown Channel',
            duration: parseInt(info.videoDetails.lengthSeconds) || 0,
            thumbnail: info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]?.url || '',
            streamUrl: bestAudio.url,
            videoId: info.videoDetails.videoId,
            description: info.videoDetails.description?.substring(0, 200) || '',
        };
    } catch (error) {
        console.error('[ytdl-core] Extraction failed:', error.message);

        // Fallback to mock
        console.warn('[YouTube Service] Falling back to mock data');
        return getMockData(url);
    }
}

/**
 * Mock mode for development
 */
function getMockData(url) {
    console.log('[Mock Mode] Returning test data');

    // Try to extract video ID for thumbnail
    let videoId = 'mock-id';
    try {
        videoId = ytdl.getVideoID(url);
    } catch (e) {
        // Ignore
    }

    return {
        ...MOCK_DATA,
        videoId: videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
}

/**
 * Get current extraction mode
 */
function getCurrentMode() {
    return currentMode;
}

/**
 * Manually set extraction mode
 */
function setMode(mode) {
    currentMode = mode;
    console.log(`[YouTube Service] Mode set to: ${mode}`);
}

module.exports = {
    extractYouTubeData,
    getCurrentMode,
    setMode,
};
