const youtubedl = require('youtube-dl-exec');

// Fallback modes: ytdlp -> cobalt -> mock
let currentMode = process.env.YOUTUBE_MODE || 'ytdlp';
let failureCount = 0;

// Mock data for development/fallback
const MOCK_DATA = {
    title: 'Test Audio Stream',
    channel: 'POD-X Demo',
    duration: 180,
    thumbnail: 'https://via.placeholder.com/300x300/6B46C1/FFFFFF?text=POD-X',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
};

/**
 * Extract YouTube metadata and stream URL
 * Implements fallback: yt-dlp -> Cobalt API -> Mock
 */
async function extractYouTubeData(url) {
    console.log(`[YouTube Service] Extracting: ${url} (Mode: ${currentMode})`);

    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
        throw new Error('Invalid YouTube URL');
    }

    try {
        if (currentMode === 'ytdlp') {
            return await extractWithYtDlp(url);
        } else if (currentMode === 'cobalt') {
            return await extractWithCobalt(url);
        } else {
            return getMockData(url);
        }
    } catch (error) {
        console.error(`[YouTube Service] Error in ${currentMode} mode:`, error.message);

        // Implement fallback logic
        failureCount++;

        if (failureCount >= 2 && currentMode === 'ytdlp') {
            console.warn('[YouTube Service] Switching to Cobalt API fallback');
            currentMode = 'cobalt';
            return extractYouTubeData(url);
        } else if (currentMode === 'cobalt') {
            console.warn('[YouTube Service] Switching to Mock mode');
            currentMode = 'mock';
            return getMockData(url);
        }

        throw error;
    }
}

/**
 * Extract using yt-dlp
 */
async function extractWithYtDlp(url) {
    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            format: 'bestaudio/best',
        });

        // Extract audio stream URL
        const audioFormat = info.formats?.find(f =>
            f.acodec !== 'none' && f.vcodec === 'none'
        ) || info.formats?.[0];

        if (!audioFormat?.url) {
            throw new Error('No audio stream found');
        }

        // Reset failure count on success
        failureCount = 0;

        return {
            title: info.title || 'Unknown Title',
            channel: info.uploader || info.channel || 'Unknown Channel',
            duration: info.duration || 0,
            thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
            streamUrl: audioFormat.url,
            videoId: info.id,
            description: info.description?.substring(0, 200) || '',
        };
    } catch (error) {
        console.error('[yt-dlp] Extraction failed:', error.message);

        // Check if error is due to bot detection or cookies
        const errorMsg = error.message.toLowerCase();
        const isBotError = errorMsg.includes('sign in') ||
            errorMsg.includes('bot') ||
            errorMsg.includes('cookies') ||
            errorMsg.includes('confirm you');

        if (isBotError) {
            console.warn('[yt-dlp] Bot detection triggered, switching to Cobalt API');
            currentMode = 'cobalt';
            throw new Error('YouTube bot detection - switching to Cobalt API fallback');
        }

        throw new Error(`yt-dlp failed: ${error.message}`);
    }
}

/**
 * Extract using Cobalt API (fallback)
 */
async function extractWithCobalt(url) {
    try {
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                isAudioOnly: true,
                aFormat: 'mp3',
            }),
        });

        if (!response.ok) {
            throw new Error(`Cobalt API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'success' && data.status !== 'stream') {
            throw new Error('Cobalt extraction failed');
        }

        // Cobalt returns audio URL directly
        return {
            title: extractTitleFromUrl(url),
            channel: 'YouTube',
            duration: 0, // Cobalt doesn't provide duration
            thumbnail: `https://img.youtube.com/vi/${extractVideoId(url)}/maxresdefault.jpg`,
            streamUrl: data.url,
            videoId: extractVideoId(url),
            description: '',
        };
    } catch (error) {
        console.error('[Cobalt] Extraction failed:', error.message);
        throw new Error(`Cobalt API failed: ${error.message}`);
    }
}

/**
 * Mock mode for development
 */
function getMockData(url) {
    console.log('[Mock Mode] Returning test data');
    return {
        ...MOCK_DATA,
        videoId: extractVideoId(url) || 'mock-id',
    };
}

/**
 * Validate YouTube URL
 */
function isValidYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
}

/**
 * Extract video ID from URL
 */
function extractVideoId(url) {
    const match = url.match(/(?:v=|\/)([\w-]{11})/);
    return match ? match[1] : null;
}

/**
 * Extract title from URL (fallback)
 */
function extractTitleFromUrl(url) {
    const videoId = extractVideoId(url);
    return videoId ? `YouTube Video ${videoId}` : 'YouTube Video';
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
    if (['ytdlp', 'cobalt', 'mock'].includes(mode)) {
        currentMode = mode;
        failureCount = 0;
        console.log(`[YouTube Service] Mode set to: ${mode}`);
    }
}

module.exports = {
    extractYouTubeData,
    getCurrentMode,
    setMode,
};
