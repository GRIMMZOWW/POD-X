import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ttsService from '../lib/tts';

const BookContext = createContext();

export function BookProvider({ children }) {
    // Book metadata
    const [activeBook, setActiveBookState] = useState(null);

    // Playback state (shared between mini and main player)
    const [playbackState, setPlaybackState] = useState({
        isPlaying: false,
        currentChapterIndex: 0,
        currentSentenceIndex: 0,
        totalSentences: 0,
        chapters: [],
        // Voice settings
        selectedVoice: null,
        readingSpeed: 1.0,
    });

    const setActiveBook = useCallback((bookData) => {
        console.log('[BookContext] Setting active book:', bookData);
        setActiveBookState(bookData);

        // Initialize chapters if available
        if (bookData?.metadata?.chapters) {
            setPlaybackState(prev => ({
                ...prev,
                chapters: bookData.metadata.chapters,
                currentChapterIndex: 0,
                currentSentenceIndex: 0,
            }));
        }
    }, []);

    const clearBook = useCallback(() => {
        console.log('[BookContext] Clearing active book');
        setActiveBookState(null);
        // Reset playback state
        setPlaybackState({
            isPlaying: false,
            currentChapterIndex: 0,
            currentSentenceIndex: 0,
            totalSentences: 0,
            chapters: [],
            selectedVoice: null,
            readingSpeed: 1.0,
        });
    }, []);

    // Stop book playback (called when music/youtube starts)
    const stopBookPlayback = useCallback(() => {
        console.log('[BookContext] Stopping book playback (music/youtube started)');
        ttsService.stop();
        setIsPlaying(false);
    }, []);

    // Register callback with playerStore so music can stop books
    useEffect(() => {
        import('../store/playerStore').then(({ default: usePlayerStore }) => {
            usePlayerStore.getState().setOnMusicStart(stopBookPlayback);
        });
    }, [stopBookPlayback]);

    // Playback controls
    const updatePlaybackState = useCallback((updates) => {
        setPlaybackState(prev => ({ ...prev, ...updates }));
    }, []);

    const setIsPlaying = useCallback((isPlaying) => {
        setPlaybackState(prev => ({ ...prev, isPlaying }));
    }, []);

    const setCurrentChapter = useCallback((chapterIndex) => {
        setPlaybackState(prev => ({
            ...prev,
            currentChapterIndex: chapterIndex,
            currentSentenceIndex: 0, // Reset sentence when changing chapter
        }));
    }, []);

    const setCurrentSentence = useCallback((sentenceIndex) => {
        setPlaybackState(prev => ({ ...prev, currentSentenceIndex: sentenceIndex }));
    }, []);

    const setTotalSentences = useCallback((total) => {
        setPlaybackState(prev => ({ ...prev, totalSentences: total }));
    }, []);

    return (
        <BookContext.Provider value={{
            // Book info
            activeBook,
            setActiveBook,
            clearBook,
            // Playback state
            playbackState,
            updatePlaybackState,
            setIsPlaying,
            setCurrentChapter,
            setCurrentSentence,
            setTotalSentences,
        }}>
            {children}
        </BookContext.Provider>
    );
}

export function useBook() {
    const context = useContext(BookContext);
    if (!context) {
        throw new Error('useBook must be used within BookProvider');
    }
    return context;
}
