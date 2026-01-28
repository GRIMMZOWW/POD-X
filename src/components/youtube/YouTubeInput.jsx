import { useState } from 'react';
import { Youtube, Play, AlertCircle, Check } from 'lucide-react';
import usePlayerStore from '../../store/playerStore';
import DisclaimerModal from '../common/DisclaimerModal';
import { saveToLibrary } from '../../lib/indexedDB';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function YouTubeInput() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [pendingUrl, setPendingUrl] = useState('');
    const { loadTrack, playTrack } = usePlayerStore();

    const handleSubmit = () => {
        if (!url.trim()) {
            setError('Please enter a YouTube URL');
            return;
        }

        // Show disclaimer first
        setPendingUrl(url);
        setShowDisclaimer(true);
    };

    const handleDisclaimerAccept = async () => {
        setShowDisclaimer(false);
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('[YouTubeInput] Extracting:', pendingUrl);

            const response = await fetch(`${API_URL}/api/youtube/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: pendingUrl }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to extract YouTube data');
            }

            console.log('[YouTubeInput] Extraction successful:', result.mode);

            // Create track object for player
            const track = {
                id: result.data.videoId || Date.now().toString(),
                title: result.data.title,
                description: result.data.description,
                channel_name: result.data.channel,
                thumbnail_url: result.data.thumbnail,
                stream_url: result.data.streamUrl,
                source_url: pendingUrl,
                type: 'youtube',
                mode: 'stream',
                duration: result.data.duration || 0,
                current_position: 0,
                is_favorite: false,
            };

            // Save to library automatically
            try {
                await saveToLibrary(track);
                setSuccess('✓ Saved to library');
                setTimeout(() => setSuccess(''), 3000);
            } catch (saveError) {
                console.warn('[YouTubeInput] Failed to save to library:', saveError);
                // Don't block playback if save fails
            }

            // Load track into player
            loadTrack(track);

            // Attempt to play (may be blocked by autoplay policy)
            setTimeout(() => {
                playTrack();
            }, 100);

            // Clear input
            setUrl('');
            setPendingUrl('');

            // Show mode indicator
            if (result.mode === 'mock') {
                setError('⚠️ Demo Mode: Using test audio (YouTube extraction unavailable)');
            } else if (result.mode === 'cobalt') {
                setError('ℹ️ Using Cobalt API fallback');
            } else {
                setSuccess('✓ Playing! If audio doesn\'t start, click play button on mini player');
            }

        } catch (err) {
            console.error('[YouTubeInput] Error:', err);
            setError(err.message || 'Failed to load audio. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisclaimerClose = () => {
        setShowDisclaimer(false);
        setPendingUrl('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <>
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
                        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${error.startsWith('⚠️') || error.startsWith('ℹ️')
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-start gap-2 p-3 rounded-lg text-sm bg-green-500/10 text-green-400">
                            <Check size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    <p className="text-xs text-gray-500">
                        Stream audio from any YouTube video • Auto-saves to library
                    </p>
                </div>
            </div>

            {/* Legal Disclaimer Modal */}
            <DisclaimerModal
                isOpen={showDisclaimer}
                onClose={handleDisclaimerClose}
                onAccept={handleDisclaimerAccept}
            />
        </>
    );
}
