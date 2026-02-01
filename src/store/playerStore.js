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

        // YouTube videos should use iframe embed, not audio player
        if (track.type === 'youtube' || track.type === 'youtube-history') {
            console.warn('[PlayerStore] YouTube videos should use iframe embed player, not audio player');
            console.warn('[PlayerStore] Use YouTubeContext.setActiveVideo() instead');
            set({ isLoading: false });
            return;
        }

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

        // Get audio URL from track
        // Note: YouTube videos now use iframe embed and don't go through this player
        let audioUrl = track.stream_url || track.audio_url || track.audioUrl;

        // Handle uploaded music files with music:// protocol
        if (audioUrl && audioUrl.startsWith('music://')) {
            const musicId = audioUrl.replace('music://', '');
            console.log('[PlayerStore] Loading uploaded music file:', musicId);

            try {
                // Dynamically import to avoid import issues
                const { getMusicBlob } = await import('../components/music/MusicUpload');
                const blob = await getMusicBlob(musicId);

                console.log('[PlayerStore] Blob retrieved:', blob ? `${blob.size} bytes, type: ${blob.type}` : 'null');

                if (!blob) {
                    console.error('[PlayerStore] Music file not found in database');
                    set({ isLoading: false });
                    alert('Music file not found. It may have been deleted.');
                    return;
                }

                // Create blob URL for Howler
                audioUrl = URL.createObjectURL(blob);
                console.log('[PlayerStore] Created blob URL for uploaded music:', audioUrl);
            } catch (error) {
                console.error('[PlayerStore] Error loading music blob:', error);
                set({ isLoading: false });
                alert(`Failed to load music file: ${error.message}`);
                return;
            }
        }

        console.log('[PlayerStore] Loading audio URL:', audioUrl);
        console.log('[PlayerStore] Track type:', track.type);
        console.log('[PlayerStore] Full track object:', track);

        if (!audioUrl) {
            console.error('[PlayerStore] No audio URL found in track!');
            set({ isLoading: false });
            return;
        }

        globalHowler = new Howl({
            src: [audioUrl],
            html5: true,
            format: ['webm', 'mp4', 'mp3'],
            autoplay: false,
            preload: true,
            volume: get().volume,

            onload: () => {
                console.log('[PlayerStore] Audio loaded successfully, duration:', globalHowler.duration());
                set({
                    duration: globalHowler.duration(),
                    currentTrack: track,
                    isLoading: false
                });

                if (globalHowler && !globalHowler.playing()) {
                    console.log('[PlayerStore] Starting playback...');
                    globalHowler.play();
                }
            },

            onplay: () => {
                console.log('[PlayerStore] Playback started');
                set({ isPlaying: true });
                get().startProgressTracking();
            },

            onpause: () => {
                console.log('[PlayerStore] Playback paused');
                set({ isPlaying: false });
                get().stopProgressTracking();
            },

            onend: () => {
                console.log('[PlayerStore] Playback ended');
                set({ isPlaying: false, currentTime: 0 });
                get().stopProgressTracking();
            },

            onloaderror: (id, error) => {
                console.error('[PlayerStore] Load error:', error);
                console.error('[PlayerStore] Failed URL:', audioUrl);
                console.error('[PlayerStore] Track type:', track.type);
                set({ isLoading: false });
                alert('Failed to load audio. The audio source may be unavailable.');
            },

            onplayerror: (id, error) => {
                console.error('[PlayerStore] Play error:', error);
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
