// SIMPLE: Always return working audio for development
// This ensures the app works while we figure out YouTube extraction

const WORKING_AUDIO = {
    title: 'Sample Audio Track',
    channel: 'POD-X',
    duration: 372,
    thumbnail: 'https://via.placeholder.com/300x300/6B46C1/FFFFFF?text=POD-X',
    // Using a reliable, working MP3 URL
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    videoId: 'sample-1'
};

/**
 * Extract YouTube metadata
 * For now, returns working audio so the app functions
 */
async function extractYouTubeData(url) {
    console.log(`[YouTube Service] Processing: ${url}`);

    const videoId = extractVideoId(url);
    if (!videoId) {
        throw new Error('Invalid YouTube URL');
    }

    try {
        // Get metadata from YouTube oEmbed (free, reliable)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);

        if (response.ok) {
            const data = await response.json();
            console.log('[YouTube Service] Got metadata:', data.title);

            return {
                title: data.title || 'YouTube Video',
                channel: data.author_name || 'YouTube',
                duration: WORKING_AUDIO.duration,
                thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                streamUrl: WORKING_AUDIO.streamUrl, // Use working audio
                videoId: videoId,
                description: `Original: ${url}`,
            };
        }
    } catch (error) {
        console.warn('[YouTube Service] oEmbed failed:', error.message);
    }

    // Fallback: basic data with working audio
    return {
        title: `YouTube Video ${videoId}`,
        channel: 'YouTube',
        duration: WORKING_AUDIO.duration,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        streamUrl: WORKING_AUDIO.streamUrl,
        videoId: videoId,
        description: `Original: ${url}`,
    };
}

/**
 * Extract video ID from URL
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

/**
 * Get current extraction mode
 */
function getCurrentMode() {
    return 'simple';
}

/**
 * Manually set extraction mode
 */
function setMode(mode) {
    console.log(`[YouTube Service] Mode: ${mode}`);
}

module.exports = {
    extractYouTubeData,
    getCurrentMode,
    setMode,
};
