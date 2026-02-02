import { useState, useEffect, useRef } from 'react';
import { Book, Play, Pause, SkipBack, SkipForward, Settings, Volume2, Moon } from 'lucide-react';
import ttsService from '../../lib/tts';
import usePlayerStore from '../../store/playerStore';
import { saveReadingPosition, getReadingPosition } from '../../lib/indexedDB';
import ResumePrompt from './ResumePrompt';
import SleepTimer from './SleepTimer';
import { useBook } from '../../contexts/BookContext';
import { useYouTube } from '../../contexts/YouTubeContext';

export default function BookPlayer({ book }) {
    const { clearVideo } = useYouTube();

    // Use shared context state
    const {
        playbackState,
        setIsPlaying,
        setCurrentChapter,
        setCurrentSentence,
        setTotalSentences,
        updatePlaybackState
    } = useBook();

    // Destructure shared state
    const {
        isPlaying,
        currentChapterIndex,
        currentSentenceIndex,
        totalSentences,
        chapters,
        selectedVoice,
        readingSpeed
    } = playbackState;

    // Local UI state
    const [currentSentenceText, setCurrentSentenceText] = useState('');
    const [voices, setVoices] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [savedPosition, setSavedPosition] = useState(null);
    const [showSleepTimer, setShowSleepTimer] = useState(false);
    const [sleepTimerActive, setSleepTimerActive] = useState(false);
    const [sleepTimerEnd, setSleepTimerEnd] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const sentenceRefs = useRef([]);
    const autoSaveInterval = useRef(null);
    const sleepTimerInterval = useRef(null);
    const originalVolume = useRef(1.0);
    const hasCheckedPosition = useRef(false); // Track if we've already checked for saved position

    // Load voices
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = ttsService.getEnglishVoices();
            setVoices(availableVoices);
            if (availableVoices.length > 0 && !selectedVoice) {
                updatePlaybackState({ selectedVoice: availableVoices[0] });
            }
        };

        // Voices may not be loaded immediately
        if (window.speechSynthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, [selectedVoice, updatePlaybackState]);

    // Check for saved reading position - ONLY ONCE on mount, not during playback
    useEffect(() => {
        const checkSavedPosition = async () => {
            // Only check once when component first mounts
            if (hasCheckedPosition.current || !book || chapters.length === 0) {
                return;
            }

            // Skip resume prompt if already playing OR if context has active playback state
            const isAlreadyPlaying = ttsService.isSpeaking();
            const hasActivePlayback = currentSentenceIndex > 0 || currentChapterIndex > 0;

            if (isAlreadyPlaying || hasActivePlayback) {
                console.log('[BookPlayer] Playback already active, skipping resume prompt');
                hasCheckedPosition.current = true; // Mark as checked
                return;
            }

            const position = await getReadingPosition(book.id);
            if (position) {
                setSavedPosition(position);
                setShowResumePrompt(true);
            }

            hasCheckedPosition.current = true; // Mark as checked
        };
        checkSavedPosition();
    }, [book, chapters.length]); // Only depend on book and chapters.length, NOT on current indices

    // Auto-save reading position every 10 seconds
    useEffect(() => {
        if (isPlaying && book) {
            // Clear any existing interval
            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
            }

            // Save every 10 seconds
            autoSaveInterval.current = setInterval(() => {
                saveReadingPosition(book.id, {
                    chapterIndex: currentChapterIndex,
                    sentenceIndex: currentSentenceIndex
                });
            }, 10000);

            // Cleanup on unmount or when reading stops
            return () => {
                if (autoSaveInterval.current) {
                    clearInterval(autoSaveInterval.current);
                }
                // Save one last time when stopping
                if (book) {
                    saveReadingPosition(book.id, {
                        chapterIndex: currentChapterIndex,
                        sentenceIndex: currentSentenceIndex
                    });
                }
            };
        }
    }, [isPlaying, book, currentChapterIndex, currentSentenceIndex]);

    // Save position when navigating away or closing tab/browser
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (book && (currentSentenceIndex > 0 || currentChapterIndex > 0)) {
                console.log('[BookPlayer] Saving position on page unload');
                saveReadingPosition(book.id, {
                    chapterIndex: currentChapterIndex,
                    sentenceIndex: currentSentenceIndex
                });
            }
        };

        // Save on browser close/refresh
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleBeforeUnload);

        // Save when component unmounts (navigating to another page)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleBeforeUnload);

            // Save position on component unmount
            if (book && (currentSentenceIndex > 0 || currentChapterIndex > 0)) {
                console.log('[BookPlayer] Saving position on component unmount');
                saveReadingPosition(book.id, {
                    chapterIndex: currentChapterIndex,
                    sentenceIndex: currentSentenceIndex
                });
            }
        };
    }, [book, currentChapterIndex, currentSentenceIndex]);

    // Set up TTS callbacks
    useEffect(() => {
        ttsService.setCallbacks({
            onSentenceStart: (index, sentence, total) => {
                setCurrentSentence(index);
                setCurrentSentenceText(sentence);
                if (total) setTotalSentences(total);
            },
            onSentenceEnd: (index, sentence) => {
                // Sentence completed
            },
            onComplete: () => {
                setIsPlaying(false);
                setCurrentSentence(0);
                // Auto-advance to next chapter
                if (currentChapterIndex < chapters.length - 1) {
                    setCurrentChapter(currentChapterIndex + 1);
                }
            }
        });
    }, [currentChapterIndex, chapters.length, setIsPlaying, setCurrentSentence, setTotalSentences, setCurrentChapter]);

    // No need for book-seek event listener - both players use shared context

    // Auto-scroll to current sentence
    useEffect(() => {
        if (isPlaying && sentenceRefs.current[currentSentenceIndex]) {
            sentenceRefs.current[currentSentenceIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentSentenceIndex, isPlaying]);

    // Sleep timer countdown
    useEffect(() => {
        if (sleepTimerActive && sleepTimerEnd) {
            // Clear any existing interval
            if (sleepTimerInterval.current) {
                clearInterval(sleepTimerInterval.current);
            }

            sleepTimerInterval.current = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((sleepTimerEnd - now) / 1000));
                setTimeRemaining(remaining);

                // Volume fade in last 30 seconds
                if (remaining <= 30 && remaining > 0) {
                    const fadeVolume = (remaining / 30) * originalVolume.current;
                    ttsService.setVolume(fadeVolume);
                } else if (remaining === 0) {
                    // Timer ended - pause and reset
                    ttsService.stop();
                    setIsReading(false);
                    setSleepTimerActive(false);
                    setSleepTimerEnd(null);
                    ttsService.setVolume(originalVolume.current);

                    // Save position
                    if (book) {
                        saveReadingPosition(book.id, {
                            chapterIndex: currentChapterIndex,
                            sentenceIndex: currentSentenceIndex
                        });
                    }

                    // Clear interval
                    if (sleepTimerInterval.current) {
                        clearInterval(sleepTimerInterval.current);
                        sleepTimerInterval.current = null;
                    }
                }
            }, 1000);

            // Cleanup
            return () => {
                if (sleepTimerInterval.current) {
                    clearInterval(sleepTimerInterval.current);
                }
            };
        }
    }, [sleepTimerActive, sleepTimerEnd, book, currentChapterIndex, currentSentenceIndex]);

    const handlePlayPause = () => {
        if (isPlaying) {
            // Stop instead of pause to prevent interrupted errors
            ttsService.stop();
            setIsPlaying(false);
            // Save position when pausing
            if (book) {
                saveReadingPosition(book.id, {
                    chapterIndex: currentChapterIndex,
                    sentenceIndex: currentSentenceIndex
                });
            }
        } else {
            // Stop music player if it's playing and clear it to hide MiniPlayer
            const { pauseTrack, clearTrack, isPlaying: musicPlaying, currentTrack } = usePlayerStore.getState();
            if (musicPlaying) {
                pauseTrack();
            }
            // Clear the music player to hide MiniPlayer UI
            if (currentTrack) {
                clearTrack();
            }

            // Stop YouTube video if playing
            clearVideo();

            // Start reading current chapter from current position
            if (chapters[currentChapterIndex]) {
                ttsService.speak(chapters[currentChapterIndex].text, {
                    voice: selectedVoice,
                    rate: readingSpeed,
                    startIndex: currentSentenceIndex // Resume from current position
                });
                setIsPlaying(true);
            }
        }
    };

    const handleStop = () => {
        ttsService.stop();
        setIsPlaying(false);
        setCurrentSentence(0);
        // Save position when stopping
        if (book) {
            saveReadingPosition(book.id, {
                chapterIndex: currentChapterIndex,
                sentenceIndex: 0
            });
        }
    };

    // Resume from saved position
    const handleResume = () => {
        setShowResumePrompt(false);

        if (savedPosition && chapters[savedPosition.chapterIndex]) {
            // Set the position in context
            setCurrentChapter(savedPosition.chapterIndex);
            setCurrentSentence(savedPosition.sentenceIndex);

            // Start playing from saved position
            setTimeout(() => {
                ttsService.speak(chapters[savedPosition.chapterIndex].text, {
                    voice: selectedVoice,
                    rate: readingSpeed,
                    startIndex: savedPosition.sentenceIndex
                });
                setIsPlaying(true);
            }, 100);
        }
    };

    // Start from beginning
    const handleStartOver = () => {
        setShowResumePrompt(false);

        // Reset position
        setCurrentChapter(0);
        setCurrentSentence(0);

        // Clear saved position
        if (book) {
            saveReadingPosition(book.id, {
                chapterIndex: 0,
                sentenceIndex: 0
            });
        }

        // Start playing from beginning
        if (chapters[0]) {
            setTimeout(() => {
                ttsService.speak(chapters[0].text, {
                    voice: selectedVoice,
                    rate: readingSpeed,
                    startIndex: 0
                });
                setIsPlaying(true);
            }, 100);
        }
    };

    // Sleep timer handlers
    const handleSetSleepTimer = (minutes) => {
        const endTime = Date.now() + (minutes * 60 * 1000);
        setSleepTimerEnd(endTime);
        setSleepTimerActive(true);
        setTimeRemaining(minutes * 60);
        setShowSleepTimer(false);
    };

    const handleCancelSleepTimer = () => {
        setSleepTimerActive(false);
        setSleepTimerEnd(null);
        setTimeRemaining(0);
        ttsService.setVolume(originalVolume.current);
        if (sleepTimerInterval.current) {
            clearInterval(sleepTimerInterval.current);
            sleepTimerInterval.current = null;
        }
    };


    const handlePreviousChapter = () => {
        if (currentChapterIndex > 0) {
            handleStop();
            setCurrentChapter(currentChapterIndex - 1);
        }
    };

    const handleNextChapter = () => {
        if (currentChapterIndex < chapters.length - 1) {
            handleStop();
            setCurrentChapter(currentChapterIndex + 1);
        }
    };

    const handleChapterSelect = (index) => {
        handleStop();
        setCurrentChapter(index);
    };

    const handleVoiceChange = (e) => {
        const voice = voices.find(v => v.name === e.target.value);
        updatePlaybackState({ selectedVoice: voice });
    };

    const handleSpeedChange = (e) => {
        updatePlaybackState({ readingSpeed: parseFloat(e.target.value) });
    };

    if (chapters.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-3 text-gray-400">Loading book...</span>
            </div>
        );
    }

    const currentChapter = chapters[currentChapterIndex];
    // Progress within current chapter (sentence-by-sentence)
    const chapterProgress = totalSentences > 0 ? (currentSentenceIndex / totalSentences) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Resume Prompt */}
            {showResumePrompt && savedPosition && (
                <ResumePrompt
                    onResume={handleResume}
                    onStartOver={handleStartOver}
                    lastReadTime={savedPosition.timestamp}
                />
            )}

            {/* Book Header */}
            <div className="flex items-start gap-4">
                <img
                    src={book.thumbnail_url}
                    alt={book.title}
                    className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">{book.title}</h2>
                    <p className="text-gray-400 mb-2">{book.artist || book.channel_name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{chapters.length} chapters</span>
                        <span>•</span>
                        <span>{book.metadata?.totalPages} pages</span>
                        <span>•</span>
                        <span>{book.metadata?.wordCount?.toLocaleString()} words</span>
                    </div>
                </div>
            </div>

            {/* Active Sleep Timer Display */}
            {sleepTimerActive && !showSleepTimer && (
                <SleepTimer
                    isActive={true}
                    timeRemaining={timeRemaining}
                    onCancel={handleCancelSleepTimer}
                />
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>Chapter {currentChapterIndex + 1} of {chapters.length}</span>
                    <span>{Math.round(chapterProgress)}% of chapter</span>
                </div>
                <div
                    className="h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = (x / rect.width) * 100;
                        const targetSentence = Math.floor((percentage / 100) * totalSentences);
                        if (targetSentence >= 0 && targetSentence < totalSentences) {
                            const wasPlaying = isPlaying;
                            handleStop();

                            // Resume playback if it was playing before
                            if (wasPlaying) {
                                setTimeout(() => {
                                    if (chapters[currentChapterIndex]) {
                                        ttsService.speak(chapters[currentChapterIndex].text, {
                                            voice: selectedVoice,
                                            rate: readingSpeed,
                                            startIndex: targetSentence
                                        });
                                        setIsPlaying(true);
                                    }
                                }, 100);
                            } else {
                                // Only update position if not playing
                                setCurrentSentence(targetSentence);
                            }
                        }
                    }}
                >
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${chapterProgress}%` }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={handlePreviousChapter}
                    disabled={currentChapterIndex === 0}
                    className="p-3 rounded-full bg-surface hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <SkipBack size={20} />
                </button>

                <button
                    onClick={handlePlayPause}
                    className="p-4 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>

                <button
                    onClick={handleNextChapter}
                    disabled={currentChapterIndex === chapters.length - 1}
                    className="p-3 rounded-full bg-surface hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <SkipForward size={20} />
                </button>

                <button
                    onClick={() => setShowSleepTimer(!showSleepTimer)}
                    className={`p-3 rounded-full transition-colors ${sleepTimerActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-surface hover:bg-surface-light'
                        }`}
                    title="Sleep Timer"
                >
                    <Moon size={20} className={sleepTimerActive ? 'animate-pulse' : ''} />
                </button>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 rounded-full bg-surface hover:bg-surface-light transition-colors"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="card bg-surface-light space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Settings size={18} />
                        Reading Settings
                    </h3>

                    {/* Voice Selection */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Voice</label>
                        <select
                            value={selectedVoice?.name || ''}
                            onChange={handleVoiceChange}
                            className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2 text-white"
                        >
                            {voices.map(voice => (
                                <option key={voice.name} value={voice.name}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reading Speed */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Reading Speed: {readingSpeed}x
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={readingSpeed}
                            onChange={handleSpeedChange}
                            className="w-full accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0.5x (Slow)</span>
                            <span>1.0x (Normal)</span>
                            <span>2.0x (Fast)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Sleep Timer Panel */}
            {showSleepTimer && (
                <div className="card bg-surface-light space-y-4">
                    <SleepTimer
                        onSetTimer={handleSetSleepTimer}
                        onCancel={handleCancelSleepTimer}
                        isActive={sleepTimerActive}
                        timeRemaining={timeRemaining}
                    />
                </div>
            )}

            {/* Current Chapter */}
            <div className="card bg-surface-light">
                <h3 className="font-semibold mb-3">{currentChapter.title}</h3>
                <div className="text-gray-300 leading-relaxed max-h-96 overflow-y-auto">
                    {currentChapter.text.split(/(?<=[.!?])\s+/).map((sentence, index) => (
                        <span
                            key={index}
                            ref={(el) => (sentenceRefs.current[index] = el)}
                            className={`${index === currentSentenceIndex && isPlaying
                                ? 'bg-blue-500/30 text-white font-medium px-1 rounded'
                                : ''
                                }`}
                        >
                            {sentence}{' '}
                        </span>
                    ))}
                </div>
            </div>

            {/* Chapter List */}
            <div className="card bg-surface-light">
                <h3 className="font-semibold mb-3">Chapters</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {chapters.map((chapter, index) => (
                        <button
                            key={index}
                            onClick={() => handleChapterSelect(index)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${index === currentChapterIndex
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'hover:bg-surface text-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{chapter.title}</span>
                                {index === currentChapterIndex && isPlaying && (
                                    <Volume2 size={16} className="text-blue-400 animate-pulse" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
