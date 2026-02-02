import { createContext, useContext, useState, useCallback } from 'react';
import ttsService from '../lib/tts';

const YouTubeContext = createContext();

export function YouTubeProvider({ children }) {
    const [activeVideo, setActiveVideoState] = useState(null);

    const setActiveVideo = useCallback((videoData) => {
        console.log('[YouTubeContext] Setting active video:', videoData);

        // Stop book TTS if playing
        if (ttsService.isSpeaking()) {
            console.log('[YouTubeContext] Stopping book TTS');
            ttsService.stop();
        }

        // Stop music player if playing - use dynamic import to avoid circular dependency
        import('../store/playerStore').then(({ default: usePlayerStore }) => {
            const { isPlaying, pauseTrack, clearTrack } = usePlayerStore.getState();
            if (isPlaying) {
                console.log('[YouTubeContext] Stopping music player');
                pauseTrack();
                clearTrack();
            }
        });

        setActiveVideoState(videoData);
    }, []);

    const clearVideo = useCallback(() => {
        console.log('[YouTubeContext] Clearing active video');
        setActiveVideoState(null);
    }, []);

    return (
        <YouTubeContext.Provider value={{
            activeVideo,
            setActiveVideo,
            clearVideo
        }}>
            {children}
        </YouTubeContext.Provider>
    );
}

export function useYouTube() {
    const context = useContext(YouTubeContext);
    if (!context) {
        throw new Error('useYouTube must be used within YouTubeProvider');
    }
    return context;
}
