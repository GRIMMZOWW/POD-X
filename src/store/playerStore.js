import { create } from 'zustand';
import { Howl, Howler } from 'howler';
import ttsService from '../lib/tts';

let globalHowler = null;

const usePlayerStore = create((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    progressInterval: null,
    isLoading: false,
    onMusicStartCallback: null,

    loadTrack: async (track) => {
        if (get().isLoading) return;
        if (get().currentTrack?.id === track.id) {
            get().playTrack();
            return;
        }

        set({ isLoading: true });

        // Stop TTS if it's playing
        ttsService.stop();

        // Notify that music is starting (to close book player)
        if (get().onMusicStartCallback) {
            get().onMusicStartCallback();
        }

        // NUCLEAR: Stop ALL Howler sounds globally first
        Howler.stop();
        Howler.unload();

        if (globalHowler) {
            try {
                globalHowler.stop();
                globalHowler.unload();
            } catch (e) { }
            globalHowler = null;
        }

        if (get().progressInterval) {
            clearInterval(get().progressInterval);
            set({ progressInterval: null });
        }

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));

        globalHowler = new Howl({
            src: [track.stream_url || track.audio_url],
            html5: true,
            autoplay: false,
            preload: true,
            volume: get().volume,

            onload: () => {
                set({
                    duration: globalHowler.duration(),
                    currentTrack: track,
                    isLoading: false
                });

                if (globalHowler && !globalHowler.playing()) {
                    globalHowler.play();
                }
            },

            onplay: () => {
                set({ isPlaying: true });
                get().startProgressTracking();
            },

            onpause: () => {
                set({ isPlaying: false });
                get().stopProgressTracking();
            },

            onend: () => {
                set({ isPlaying: false, currentTime: 0 });
                get().stopProgressTracking();
            },

            onloaderror: () => {
                set({ isLoading: false });
            }
        });
    },

    playTrack: () => {
        // Stop TTS if it's playing
        ttsService.stop();

        // Notify that music is starting (to close book player)
        if (get().onMusicStartCallback) {
            get().onMusicStartCallback();
        }

        if (globalHowler && !globalHowler.playing()) {
            globalHowler.play();
        }
    },

    pauseTrack: () => {
        if (globalHowler && globalHowler.playing()) {
            globalHowler.pause();
        }
    },

    togglePlay: () => {
        if (get().isPlaying) {
            get().pauseTrack();
        } else {
            get().playTrack();
        }
    },

    seekTo: (time) => {
        if (globalHowler) {
            globalHowler.seek(time);
            set({ currentTime: time });
        }
    },

    setVolume: (vol) => {
        set({ volume: vol });
        if (globalHowler) globalHowler.volume(vol);
    },

    startProgressTracking: () => {
        if (get().progressInterval) clearInterval(get().progressInterval);

        const interval = setInterval(() => {
            if (globalHowler && globalHowler.playing()) {
                set({ currentTime: globalHowler.seek() });
            }
        }, 250);

        set({ progressInterval: interval });
    },

    stopProgressTracking: () => {
        if (get().progressInterval) {
            clearInterval(get().progressInterval);
            set({ progressInterval: null });
        }
    },

    clearTrack: () => {
        Howler.stop();
        if (get().progressInterval) clearInterval(get().progressInterval);
        if (globalHowler) {
            globalHowler.stop();
            globalHowler.unload();
            globalHowler = null;
        }
        set({
            currentTrack: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            isLoading: false,
            progressInterval: null
        });
    },

    setOnMusicStart: (callback) => {
        set({ onMusicStartCallback: callback });
    }
}));

export default usePlayerStore;
