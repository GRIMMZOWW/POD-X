import { useState, useEffect, useRef } from 'react';
import { Book, Play, Pause, SkipBack, SkipForward, Settings, Volume2 } from 'lucide-react';
import ttsService from '../../lib/tts';
import usePlayerStore from '../../store/playerStore';
import { saveReadingPosition, getReadingPosition } from '../../lib/indexedDB';
import ResumePrompt from './ResumePrompt';

export default function BookPlayer({ book }) {
    const [isReading, setIsReading] = useState(false);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
    const [totalSentences, setTotalSentences] = useState(0);
    const [currentSentence, setCurrentSentence] = useState('');
    const [chapters, setChapters] = useState([]);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [readingSpeed, setReadingSpeed] = useState(1.0);
    const [showSettings, setShowSettings] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [savedPosition, setSavedPosition] = useState(null);
    const sentenceRefs = useRef([]);
    const autoSaveInterval = useRef(null);

    // Load book data
    useEffect(() => {
        const loadBookData = async () => {
            try {
                console.log('[BookPlayer] Loading book:', book);
                console.log('[BookPlayer] Book metadata:', book.metadata);

                // Chapters are now stored directly in book metadata
                if (book.metadata?.chapters && Array.isArray(book.metadata.chapters)) {
                    console.log('[BookPlayer] Found chapters:', book.metadata.chapters.length);
                    setChapters(book.metadata.chapters);
                } else {
                    console.error('[BookPlayer] No chapters found in book metadata');
                    console.error('[BookPlayer] Available metadata keys:', Object.keys(book.metadata || {}));

                    // Fallback: create a single chapter from the book
                    setChapters([{
                        index: 0,
                        title: 'Full Book',
                        text: 'No chapters detected. Please re-upload the book.',
                        startPosition: 0
                    }]);
                }
            } catch (error) {
                console.error('[BookPlayer] Failed to load book data:', error);
                setChapters([]);
            }
        };

        loadBookData();

        // Load voices
        const loadVoices = () => {
            const availableVoices = ttsService.getEnglishVoices();
            setVoices(availableVoices);
            if (availableVoices.length > 0) {
                setSelectedVoice(availableVoices[0]);
            }
        };

        // Voices may not be loaded immediately
        if (window.speechSynthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, [book]);

    // Check for saved reading position
    useEffect(() => {
        const checkSavedPosition = async () => {
            if (book && chapters.length > 0) {
                const position = await getReadingPosition(book.id);
                if (position) {
                    setSavedPosition(position);
                    setShowResumePrompt(true);
                }
            }
        };
        checkSavedPosition();
    }, [book, chapters]);

    // Auto-save reading position every 10 seconds
    useEffect(() => {
        if (isReading && book) {
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
            };
        }
    }, [isReading, book, currentChapterIndex, currentSentenceIndex]);

    // Set up TTS callbacks
    useEffect(() => {
        ttsService.setCallbacks({
            onSentenceStart: (index, sentence, total) => {
                setCurrentSentenceIndex(index);
                setCurrentSentence(sentence);
                if (total) setTotalSentences(total);
            },
            onSentenceEnd: (index, sentence) => {
                // Sentence completed
            },
            onComplete: () => {
                setIsReading(false);
                setCurrentSentenceIndex(0);
                // Auto-advance to next chapter
                if (currentChapterIndex < chapters.length - 1) {
                    setCurrentChapterIndex(prev => prev + 1);
                }
            }
        });
    }, [currentChapterIndex, chapters.length]);

    // Auto-scroll to current sentence
    useEffect(() => {
        if (isReading && sentenceRefs.current[currentSentenceIndex]) {
            sentenceRefs.current[currentSentenceIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentSentenceIndex, isReading]);

    const handlePlayPause = () => {
        if (isReading) {
            // Stop instead of pause to prevent interrupted errors
            ttsService.stop();
            setIsReading(false);
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

            // Start reading current chapter from current position
            if (chapters[currentChapterIndex]) {
                ttsService.speak(chapters[currentChapterIndex].text, {
                    voice: selectedVoice,
                    rate: readingSpeed,
                    startIndex: currentSentenceIndex // Resume from current position
                });
                setIsReading(true);
            }
        }
    };

    const handleStop = () => {
        ttsService.stop();
        setIsReading(false);
        setCurrentSentenceIndex(0);
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
        if (savedPosition) {
            setCurrentChapterIndex(savedPosition.chapterIndex);
            setCurrentSentenceIndex(savedPosition.sentenceIndex);
        }
        setShowResumePrompt(false);
    };

    // Start from beginning
    const handleStartOver = () => {
        setCurrentChapterIndex(0);
        setCurrentSentenceIndex(0);
        setShowResumePrompt(false);
        // Clear saved position
        if (book) {
            saveReadingPosition(book.id, {
                chapterIndex: 0,
                sentenceIndex: 0
            });
        }
    };

    const handlePreviousChapter = () => {
        if (currentChapterIndex > 0) {
            handleStop();
            setCurrentChapterIndex(prev => prev - 1);
        }
    };

    const handleNextChapter = () => {
        if (currentChapterIndex < chapters.length - 1) {
            handleStop();
            setCurrentChapterIndex(prev => prev + 1);
        }
    };

    const handleChapterSelect = (index) => {
        handleStop();
        setCurrentChapterIndex(index);
    };

    const handleVoiceChange = (e) => {
        const voice = voices.find(v => v.name === e.target.value);
        setSelectedVoice(voice);
    };

    const handleSpeedChange = (e) => {
        setReadingSpeed(parseFloat(e.target.value));
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
                            const wasPlaying = isReading;
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
                                        setIsReading(true);
                                    }
                                }, 100);
                            } else {
                                // Only update position if not playing
                                setCurrentSentenceIndex(targetSentence);
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
                    {isReading ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>

                <button
                    onClick={handleNextChapter}
                    disabled={currentChapterIndex === chapters.length - 1}
                    className="p-3 rounded-full bg-surface hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <SkipForward size={20} />
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

            {/* Current Chapter */}
            <div className="card bg-surface-light">
                <h3 className="font-semibold mb-3">{currentChapter.title}</h3>
                <div className="text-gray-300 leading-relaxed max-h-96 overflow-y-auto">
                    {currentChapter.text.split(/(?<=[.!?])\s+/).map((sentence, index) => (
                        <span
                            key={index}
                            ref={(el) => (sentenceRefs.current[index] = el)}
                            className={`${index === currentSentenceIndex && isReading
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
                                {index === currentChapterIndex && isReading && (
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
