import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import usePlayerStore from '../../store/playerStore';
import { savePlaybackProgress } from '../../lib/indexedDB';

export default function AudioPlayer() {
    const {
        currentTrack,
        isPlaying,
        volume,
        currentTime,
        setHowlerInstance,
        setDuration,
        updateCurrentTime,
        skipNext,
        pause,
    } = usePlayerStore();

    const howlerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const progressSaveTimerRef = useRef(null);

    // Initialize Howler when track changes
    useEffect(() => {
        if (!currentTrack) return;

        // Clean up previous instance
        if (howlerRef.current) {
            howlerRef.current.unload();
        }

        // Create new Howler instance
        const sound = new Howl({
            src: [currentTrack.stream_url || currentTrack.source_url],
            html5: true, // Use HTML5 Audio for streaming
            format: ['mp3', 'webm', 'ogg'],
            volume: volume,
            onload: function () {
                setDuration(sound.duration());
            },
            onend: function () {
                skipNext();
            },
            onerror: function (id, error) {
                console.error('Howler error:', error);
                pause();
            },
        });

        howlerRef.current = sound;
        setHowlerInstance(sound);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (progressSaveTimerRef.current) {
                clearInterval(progressSaveTimerRef.current);
            }
            sound.unload();
        };
    }, [currentTrack]);

    // Handle play/pause
    useEffect(() => {
        if (!howlerRef.current) return;

        if (isPlaying) {
            howlerRef.current.play();
            updateTimeLoop();
            startProgressSaving();
        } else {
            howlerRef.current.pause();
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (progressSaveTimerRef.current) {
                clearInterval(progressSaveTimerRef.current);
            }
            // Save progress when pausing
            saveProgress();
        }
    }, [isPlaying]);

    // Handle volume changes
    useEffect(() => {
        if (howlerRef.current) {
            howlerRef.current.volume(volume);
        }
    }, [volume]);

    // Update current time loop
    const updateTimeLoop = () => {
        if (howlerRef.current && howlerRef.current.playing()) {
            updateCurrentTime(howlerRef.current.seek());
            animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
        }
    };

    // Handle seeking
    useEffect(() => {
        if (howlerRef.current && !isPlaying) {
            howlerRef.current.seek(currentTime);
        }
    }, [currentTime]);

    // Start periodic progress saving (every 5 seconds)
    const startProgressSaving = () => {
        if (progressSaveTimerRef.current) {
            clearInterval(progressSaveTimerRef.current);
        }

        progressSaveTimerRef.current = setInterval(() => {
            saveProgress();
        }, 5000); // Save every 5 seconds
    };

    // Save playback progress to IndexedDB
    const saveProgress = () => {
        if (currentTrack && howlerRef.current) {
            const position = howlerRef.current.seek();
            const duration = howlerRef.current.duration();

            if (position > 0 && duration > 0) {
                savePlaybackProgress(currentTrack.id, position, duration);
            }
        }
    };

    // Save progress when component unmounts
    useEffect(() => {
        return () => {
            saveProgress();
        };
    }, [currentTrack]);

    // This component doesn't render anything visible
    // It just manages the audio playback
    return null;
}
