import { useState } from 'react';
import { Youtube, Play, AlertCircle } from 'lucide-react';

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url) {
    if (!url) return null;

    // Remove whitespace
    url = url.trim();

    // Pattern 1: youtube.com/watch?v=VIDEO_ID
    const watchPattern = /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
    const watchMatch = url.match(watchPattern);
    if (watchMatch) return watchMatch[1];

    // Pattern 2: youtu.be/VIDEO_ID
    const shortPattern = /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const shortMatch = url.match(shortPattern);
    if (shortMatch) return shortMatch[1];

    // Pattern 3: youtube.com/embed/VIDEO_ID
    const embedPattern = /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const embedMatch = url.match(embedPattern);
    if (embedMatch) return embedMatch[1];

    // Pattern 4: Just the video ID itself
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    return null;
}

/**
 * Fetch video metadata from YouTube oEmbed API (no authentication needed)
 */
async function fetchVideoMetadata(videoId) {
    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch video metadata');
        }

        const data = await response.json();
        return {
            title: data.title || 'Unknown Title',
            channel: data.author_name || 'Unknown Channel',
            thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
    } catch (error) {
        console.warn('[YouTubeInput] Failed to fetch metadata:', error);
        // Return defaults if API fails
        return {
            title: 'YouTube Video',
            channel: 'Unknown Channel',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
    }
}

export default function YouTubeInput({ onVideoSelect }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!url.trim()) {
            setError('Please enter a YouTube URL');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Extract video ID from URL
            const videoId = extractVideoId(url);

            if (!videoId) {
                throw new Error('Invalid YouTube URL. Please paste a valid YouTube video link.');
            }

            console.log('[YouTubeInput] Extracted video ID:', videoId);

            // Fetch metadata from YouTube oEmbed API
            const metadata = await fetchVideoMetadata(videoId);

            console.log('[YouTubeInput] Fetched metadata:', metadata);

            // Pass video data to parent component
            if (onVideoSelect) {
                onVideoSelect({
                    videoId,
                    title: metadata.title,
                    channel: metadata.channel,
                    thumbnail: metadata.thumbnail,
                    url: url.trim(),
                });
            }

            // Clear input
            setUrl('');

        } catch (err) {
            console.error('[YouTubeInput] Error:', err);
            setError(err.message || 'Failed to process YouTube URL. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-4">
                <Youtube className="text-red-500" size={24} />
                <h3 className="font-semibold">YouTube</h3>
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Paste YouTube URL here..."
                        className="input w-full pr-12"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !url.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Play size={20} fill="white" />
                        )}
                    </button>
                </div>

                {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg text-sm bg-red-500/10 text-red-400">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <p className="text-xs text-gray-500">
                    Paste any YouTube video URL • Plays instantly using YouTube's player
                </p>
            </div>
        </div>
    );
}
