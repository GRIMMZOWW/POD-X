import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Youtube, Sparkles } from 'lucide-react';
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center animate-slide-up">
                <div className="inline-flex items-center gap-2 mb-3">
                    <Sparkles className="text-primary" size={28} />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                        Stream Content
                    </h2>
                </div>
                <p className="text-gray-400">Paste a YouTube URL to start streaming</p>
            </div>

            {/* YouTube input component */}
            <div className="animate-stagger-1">
                <YouTubeInput onVideoSelect={handleVideoSelect} />
            </div>

            {/* Info card - show when no video is playing */}
            {!activeVideo && (
                <div className="card bg-surface-light gradient-overlay animate-stagger-2">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                        <Youtube size={22} className="text-primary" />
                        How it works
                    </h3>
                    <ul className="text-sm text-gray-400 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Paste any YouTube URL above</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Video plays instantly using YouTube's embedded player</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Your viewing history is saved automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Navigate to other pages to see the mini player</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Access your history from the Library page</span>
                        </li>
                    </ul>
                </div>
            )}

            {/* UnifiedYouTubePlayer in Layout handles rendering - shows as main player here */}
        </div>
    );
}
