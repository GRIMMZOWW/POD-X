import { createContext, useContext, useState, useCallback } from 'react';

const YouTubeContext = createContext();

export function YouTubeProvider({ children }) {
    const [activeVideo, setActiveVideoState] = useState(null);

    const setActiveVideo = useCallback((videoData) => {
        console.log('[YouTubeContext] Setting active video:', videoData);
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
