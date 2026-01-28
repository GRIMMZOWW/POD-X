import { create } from 'zustand';
import { Howl } from 'howler';

// Global reference to ensure only ONE Howler instance exists
let globalHowlerInstance = null;

const usePlayerStore = create((set, get) => ({
    // State
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    howler: null,
    progressInterval: null,

    // Actions
    loadTrack: (track) => {
        const { progressInterval } = get();

        console.log('[PlayerStore] Loading track:', track.title);

        // CRITICAL: Stop and unload ANY existing Howler instance globally
        if (globalHowlerInstance) {
            console.log('[PlayerStore] Cleaning up global Howler instance');
            try {
                globalHowlerInstance.stop();
                globalHowlerInstance.unload();
            } catch (e) {
                console.warn('[PlayerStore] Error cleaning up old instance:', e);
            }
            globalHowlerInstance = null;
        }

        // Clear progress interval
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        // Stop all Howler sounds globally (nuclear option)
        if (typeof Howler !== 'undefined' && Howler.stop) {
            Howler.stop();
            console.log('[PlayerStore] Stopped all Howler sounds globally');
        }

        // Reset state
        set({
            currentTrack: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            howler: null,
            progressInterval: null
        });

        // Small delay to ensure cleanup completes
        setTimeout(() => {
            // Create new Howler instance
            const newHowler = new Howl({
                src: [track.stream_url || track.audio_url],
                html5: true,
                volume: get().volume,
                preload: true,

                onload: () => {
                    const dur = newHowler.duration();
                    set({
                        duration: dur,
                        currentTrack: track
                    });
                    console.log('[Howler] Loaded:', track.title, 'Duration:', dur);
                },

                onplay: () => {
                    console.log('[Howler] Playing');
                    set({ isPlaying: true });
                    get().startProgressTracking();
                },

                onpause: () => {
                    console.log('[Howler] Paused');
                    set({ isPlaying: false });
                    get().stopProgressTracking();
                },

                onend: () => {
                    console.log('[Howler] Ended');
                    set({ isPlaying: false, currentTime: 0 });
                    get().stopProgressTracking();
                },

                onseek: () => {
                    const seekPos = newHowler.seek();
                    set({ currentTime: seekPos });
                    console.log('[Howler] Seeked to:', seekPos);
                },

                onloaderror: (id, err) => {
                    console.error('[Howler] Load error:', err);
                    set({ isPlaying: false });
                },

                onplayerror: (id, err) => {
                    console.error('[Howler] Play error:', err);
                    set({ isPlaying: false });

                    // Try to unlock on next user interaction
                    newHowler.once('unlock', () => {
                        console.log('[Howler] Unlocked, retrying play');
                        newHowler.play();
                    });
                }
            });

            // Store globally and in state
            globalHowlerInstance = newHowler;
            set({ howler: newHowler });
            console.log('[PlayerStore] New Howler instance created');
        }, 100);
    },

    playTrack: () => {
        const { howler } = get();

        if (!howler) {
            console.warn('[PlayerStore] No howler instance to play');
            return;
        }

        try {
            console.log('[PlayerStore] Attempting to play...');
            howler.play();
        } catch (err) {
            console.error('[PlayerStore] Play error:', err);
            set({ isPlaying: false });
        }
    },

    pauseTrack: () => {
        const { howler } = get();
        if (howler) {
            console.log('[PlayerStore] Pausing');
            howler.pause();
        }
    },

    togglePlay: () => {
        const { isPlaying, howler } = get();
        if (!howler) return;

        if (isPlaying) {
            get().pauseTrack();
        } else {
            get().playTrack();
        }
    },

    seekTo: (time) => {
        const { howler } = get();
        if (!howler || typeof time !== 'number') return;

        console.log('[PlayerStore] Seeking to:', time);
        howler.seek(time);
        set({ currentTime: time });
    },

    setVolume: (vol) => {
        const { howler } = get();
        set({ volume: vol });
        if (howler) {
            howler.volume(vol);
        }
    },

    startProgressTracking: () => {
        const { progressInterval } = get();

        // Clear any existing interval
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        // Update progress every 250ms
        const interval = setInterval(() => {
            const { howler } = get();
            if (howler && howler.playing()) {
                const seek = howler.seek();
                if (typeof seek === 'number') {
                    set({ currentTime: seek });
                }
            }
        }, 250);

        set({ progressInterval: interval });
        console.log('[PlayerStore] Progress tracking started');
    },

    stopProgressTracking: () => {
        const { progressInterval } = get();
        if (progressInterval) {
            clearInterval(progressInterval);
            set({ progressInterval: null });
            console.log('[PlayerStore] Progress tracking stopped');
        }
    },

    clearTrack: () => {
        const { howler, progressInterval } = get();

        console.log('[PlayerStore] Clearing track');

        if (progressInterval) {
            clearInterval(progressInterval);
        }

        if (howler) {
            howler.stop();
            howler.unload();
        }

        if (globalHowlerInstance) {
            globalHowlerInstance.stop();
            globalHowlerInstance.unload();
            globalHowlerInstance = null;
        }

        // Nuclear option: stop all sounds
        if (typeof Howler !== 'undefined' && Howler.stop) {
            Howler.stop();
        }

        set({
            currentTrack: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            howler: null,
            progressInterval: null
        });
    }
}));

export default usePlayerStore;
