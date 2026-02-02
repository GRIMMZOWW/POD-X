import { useEffect } from 'react';
import { Book, Play, Pause, SkipBack, SkipForward, Maximize2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ttsService from '../../lib/tts';
import { useBook } from '../../contexts/BookContext';
import { saveReadingPosition } from '../../lib/indexedDB';
import usePlayerStore from '../../store/playerStore';
import { useYouTube } from '../../contexts/YouTubeContext';

export default function BookMiniPlayer() {
    const navigate = useNavigate();
    const { clearVideo } = useYouTube();
    const {
        activeBook,
        clearBook,
        playbackState,
        setIsPlaying,
        setCurrentSentence,
        setTotalSentences,
        setCurrentChapter
    } = useBook();

    const {
        isPlaying,
        currentSentenceIndex,
        totalSentences,
        currentChapterIndex,
        chapters
    } = playbackState;

    // Mini player does NOT set TTS callbacks - only BookPlayer does
    // This prevents callback conflicts

    // Auto-save position when navigating away or closing
    useEffect(() => {
        // Save when component unmounts (user navigates away while mini player is active)
        return () => {
            if (activeBook && (currentSentenceIndex > 0 || currentChapterIndex > 0)) {
                console.log('[BookMiniPlayer] Saving position on unmount');
                saveReadingPosition(activeBook.id, {
                    chapterIndex: currentChapterIndex,
                    sentenceIndex: currentSentenceIndex
                });
            }
        };
    }, [activeBook, currentChapterIndex, currentSentenceIndex]);

    const togglePlayPause = () => {
        if (isPlaying) {
            // Use stop instead of pause to prevent TTS errors
            ttsService.stop();
            setIsPlaying(false);

            // Save position when stopping (for resume)
            if (activeBook) {
                saveReadingPosition(activeBook.id, {
                    chapterIndex: currentChapterIndex,
                    sentenceIndex: currentSentenceIndex
                });
            }
        } else {
            // Stop music player if playing
            const { isPlaying: musicPlaying, pauseTrack, clearTrack, currentTrack } = usePlayerStore.getState();
            if (musicPlaying) {
                pauseTrack();
            }
            if (currentTrack) {
                clearTrack();
            }

            // Stop YouTube video if playing
            clearVideo();

            // Start playback from current position
            if (chapters[currentChapterIndex]) {
                ttsService.speak(chapters[currentChapterIndex].text, {
                    voice: playbackState.selectedVoice,
                    rate: playbackState.readingSpeed,
                    startIndex: currentSentenceIndex
                });
                setIsPlaying(true);
            }
        }
    };

    const handlePrevious = () => {
        if (currentChapterIndex > 0) {
            // Go to previous chapter
            ttsService.stop();
            setCurrentChapter(currentChapterIndex - 1);
        } else {
            // Restart current chapter
            ttsService.stop();
            setCurrentSentence(0);
        }
    };

    const handleNext = () => {
        if (currentChapterIndex < chapters.length - 1) {
            // Go to next chapter
            ttsService.stop();
            setCurrentChapter(currentChapterIndex + 1);
        } else {
            // Skip current utterance
            ttsService.synth.cancel();
        }
    };

    const handleExpand = () => {
        // Navigate to library without triggering resume prompt
        // The main player will use the shared context state
        navigate('/library');
    };

    const handleClose = () => {
        ttsService.stop();

        // Save position before closing (for resume)
        if (activeBook) {
            saveReadingPosition(activeBook.id, {
                chapterIndex: currentChapterIndex,
                sentenceIndex: currentSentenceIndex
            });
        }

        clearBook();
    };

    const handleProgressClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const targetSentence = Math.floor((percentage / 100) * totalSentences);

        if (targetSentence >= 0 && targetSentence < totalSentences) {
            const wasPlaying = isPlaying;

            // Stop current playback
            ttsService.stop();

            // Update sentence position
            setCurrentSentence(targetSentence);

            // Resume playback if it was playing
            if (wasPlaying && chapters[currentChapterIndex]) {
                setTimeout(() => {
                    ttsService.speak(chapters[currentChapterIndex].text, {
                        voice: playbackState.selectedVoice,
                        rate: playbackState.readingSpeed,
                        startIndex: targetSentence
                    });
                    setIsPlaying(true);
                }, 100);
            }
        }
    };

    if (!activeBook) return null;

    // Calculate progress
    const progress = totalSentences > 0 ? (currentSentenceIndex / totalSentences) * 100 : 0;

    return (
        <div className="fixed bottom-20 left-0 right-0 z-40 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-2xl">
            {/* Interactive Progress Bar - Click to Seek */}
            <div
                className="h-1 bg-gray-800 cursor-pointer hover:h-1.5 transition-all"
                onClick={handleProgressClick}
            >
                <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="max-w-md mx-auto px-4 py-2.5">
                <div className="flex items-center gap-3">
                    {/* Book Info */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-11 h-11 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                            <Book className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white text-sm font-semibold truncate">
                                {activeBook.title}
                            </h4>
                            <p className="text-gray-400 text-xs truncate">
                                Sentence {currentSentenceIndex + 1} of {totalSentences}
                            </p>
                        </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-1.5">
                        {/* Previous */}
                        <button
                            onClick={handlePrevious}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <SkipBack className="w-4 h-4" />
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlayPause}
                            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 text-black" fill="black" />
                            ) : (
                                <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
                            )}
                        </button>

                        {/* Next */}
                        <button
                            onClick={handleNext}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <SkipForward className="w-4 h-4" />
                        </button>

                        {/* Expand */}
                        <button
                            onClick={handleExpand}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors ml-1"
                            title="Open in player"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>

                        {/* Close */}
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            title="Stop"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
