import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Youtube } from 'lucide-react';
import YouTubeInput from '../components/youtube/YouTubeInput';
import { addToHistory } from '../lib/indexedDB';
import { useYouTube } from '../contexts/YouTubeContext';
import usePlayerStore from '../store/playerStore';
import ttsService from '../lib/tts';

export default function StreamPage() {
    const location = useLocation();
    const { activeVideo, setActiveVideo, clearVideo } = useYouTube();
    const { clearTrack } = usePlayerStore();

    // Handle navigation from Library history
    useEffect(() => {
        if (location.state?.videoData) {
            const videoData = location.state.videoData;
            // Stop any playing music when YouTube video starts
            clearTrack();
            // Stop any playing book (TTS)
            ttsService.stop();
            setActiveVideo({
                videoId: videoData.videoId,
                title: videoData.title,
                channel: videoData.channel,
                thumbnail: videoData.thumbnail,
                url: videoData.url,
            });
            // Clear the navigation state
            window.history.replaceState({}, document.title);
        }
    }, [location.state, setActiveVideo, clearTrack]);

    // Save to history when video is selected
    useEffect(() => {
        if (activeVideo) {
            addToHistory(activeVideo)
                .then(() => console.log('[StreamPage] Video added to history'))
                .catch((error) => console.error('[StreamPage] Failed to add to history:', error));
        }
    }, [activeVideo]);

    const handleVideoSelect = (videoData) => {
        console.log('[StreamPage] Video selected:', videoData);
        // Stop any playing music when YouTube video starts
        clearTrack();
        // Stop any playing book (TTS)
        ttsService.stop();
        setActiveVideo(videoData);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Stream Content</h2>
                <p className="text-gray-400">Paste a YouTube URL to start streaming</p>
            </div>

            {/* YouTube input component */}
            <YouTubeInput onVideoSelect={handleVideoSelect} />

            {/* Info card - show when no video is playing */}
            {!activeVideo && (
                <div className="card bg-surface-light">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Youtube size={20} className="text-primary" />
                        How it works
                    </h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Paste any YouTube URL above</li>
                        <li>• Video plays instantly using YouTube's embedded player</li>
                        <li>• Your viewing history is saved automatically</li>
                        <li>• Navigate to other pages to see the mini player</li>
                        <li>• Access your history from the Library page</li>
                    </ul>
                </div>
            )}

            {/* UnifiedYouTubePlayer in Layout handles rendering - shows as main player here */}
        </div>
    );
}
