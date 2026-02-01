const youtubedl = require('youtube-dl-exec');

/**
 * YouTube service using yt-dlp for real audio extraction
 * Returns metadata and actual YouTube audio stream URL
 */
async function extractYouTubeData(url) {
    console.log('[YouTube Service] Extracting with yt-dlp:', url);

    try {
        const videoId = extractVideoId(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        // Use yt-dlp to extract video info and audio URL
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            format: 'bestaudio/best',
        });

        // Extract the best audio format
        let audioUrl = null;

        // Try to get direct audio URL from formats
        if (info.formats && info.formats.length > 0) {
            // Find best audio-only format
            const audioFormats = info.formats.filter(f =>
                f.acodec && f.acodec !== 'none' && f.vcodec === 'none'
            );

            if (audioFormats.length > 0) {
                // Sort by quality (bitrate) and get the best
                audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
                audioUrl = audioFormats[0].url;
            } else {
                // Fallback to best format with audio
                const formatsWithAudio = info.formats.filter(f =>
                    f.acodec && f.acodec !== 'none'
                );
                if (formatsWithAudio.length > 0) {
                    formatsWithAudio.sort((a, b) => (b.abr || 0) - (a.abr || 0));
                    audioUrl = formatsWithAudio[0].url;
                }
            }
        }

        // Fallback to info.url if available
        if (!audioUrl && info.url) {
            audioUrl = info.url;
        }

        if (!audioUrl) {
            throw new Error('Could not extract audio URL from video');
        }

        // Return formatted data
        return {
            videoId: videoId,
            title: info.title || `YouTube Video ${videoId}`,
            channel: info.uploader || info.channel || 'Unknown Channel',
            thumbnail: info.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            duration: Math.floor(info.duration || 0),
            audioUrl: audioUrl,
            extractor: 'yt-dlp',
            description: info.description || '',
            type: 'audio',
            format: info.ext || 'webm'
        };

    } catch (error) {
        console.error('[YouTube Service] yt-dlp extraction error:', error.message);

        // Provide specific error messages for common issues
        if (error.message.includes('age')) {
            throw new Error('This video is age-restricted and cannot be accessed');
        } else if (error.message.includes('private') || error.message.includes('unavailable')) {
            throw new Error('This video is private or unavailable');
        } else if (error.message.includes('not available')) {
            throw new Error('This video is not available in your region');
        } else {
            throw new Error(`Failed to extract video: ${error.message}`);
        }
    }
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
    const patterns = [
        /(?:v=|\/)([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

function getCurrentMode() {
    return 'yt-dlp';
}

function setMode(mode) {
    console.log('[YouTube Service] Mode set to:', mode);
}

module.exports = {
    extractYouTubeData,
    getCurrentMode,
    setMode
};
