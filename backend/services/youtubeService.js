const youtubedl = require('youtube-dl-exec');

// Fallback modes: cobalt (API-based, works in production) -> ytdlp (requires binary) -> mock
// Default to cobalt for production since it doesn't require yt-dlp binary installation
let currentMode = process.env.YOUTUBE_MODE || 'cobalt';
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
 * Implements fallback: Cobalt API -> yt-dlp -> Mock
 */
async function extractYouTubeData(url) {
    console.log(`[YouTube Service] Extracting: ${url} (Mode: ${currentMode})`);

    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
        throw new Error('Invalid YouTube URL');
    }

    try {
        if (currentMode === 'cobalt') {
            return await extractWithCobalt(url);
        } else if (currentMode === 'ytdlp') {
            return await extractWithYtDlp(url);
        } else {
            return getMockData(url);
        }
    } catch (error) {
        console.error(`[YouTube Service] Error in ${currentMode} mode:`, error.message);

        // Implement fallback logic
        failureCount++;

        if (currentMode === 'cobalt') {
            console.warn('[YouTube Service] Cobalt failed, trying yt-dlp');
            currentMode = 'ytdlp';
            return extractYouTubeData(url);
        } else if (currentMode === 'ytdlp') {
            console.warn('[YouTube Service] yt-dlp failed, switching to Mock mode');
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
 * Works without requiring yt-dlp binary - perfect for production
 */
async function extractWithCobalt(url) {
    try {
        console.log('[Cobalt] Attempting extraction...');

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
                filenamePattern: 'basic',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Cobalt] API error:', response.status, errorText);
            throw new Error(`Cobalt API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('[Cobalt] Response:', JSON.stringify(data).substring(0, 200));

        // Cobalt API returns different response formats
        let audioUrl = null;

        if (data.status === 'stream' || data.status === 'success') {
            audioUrl = data.url;
        } else if (data.url) {
            audioUrl = data.url;
        }

        if (!audioUrl) {
            console.error('[Cobalt] No audio URL in response:', data);
            throw new Error('Cobalt extraction failed - no audio URL');
        }

        const videoId = extractVideoId(url);

        // Reset failure count on success
        failureCount = 0;

        return {
            title: data.title || extractTitleFromUrl(url),
            channel: 'YouTube',
            duration: 0, // Cobalt doesn't provide duration
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            streamUrl: audioUrl,
            videoId: videoId,
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
