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

    // Queue system
    queue: [],
    currentIndex: -1,
    repeat: 'none', // 'none', 'one', 'all'

    loadTrack: async (track) => {
        if (get().isLoading) return;

        // YouTube videos should use iframe embed, not audio player
        if (track.type === 'youtube' || track.type === 'youtube-history') {
            console.warn('[PlayerStore] YouTube videos should use iframe embed player, not audio player');
            console.warn('[PlayerStore] Use YouTubeContext.setActiveVideo() instead');
            set({ isLoading: false });
            return;
        }

        // Build queue from library if it doesn't exist yet
        if (get().queue.length === 0 && track.type === 'music') {
            try {
                const { getLibraryContent } = await import('../lib/indexedDB');
                const allItems = await getLibraryContent();
                const musicTracks = allItems.filter(item => item.type === 'music');

                if (musicTracks.length > 0) {
                    const trackIndex = musicTracks.findIndex(t => t.id === track.id);
                    set({
                        queue: musicTracks,
                        currentIndex: trackIndex !== -1 ? trackIndex : 0
                    });
                    console.log(`[PlayerStore] Built queue with ${musicTracks.length} tracks`);
                }
            } catch (error) {
                console.error('[PlayerStore] Failed to build queue:', error);
            }
        }

        if (get().currentTrack?.id === track.id) {
            get().playTrack();
            return;
        }

        set({ isLoading: true, currentTime: 0 });

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
            } catch (e) {
                console.warn('[PlayerStore] Error unloading:', e);
            }
            globalHowler = null;
        }

        // Clear any existing progress tracking
        if (get().progressInterval) {
            clearInterval(get().progressInterval);
            set({ progressInterval: null });
        }

        try {
            const audioUrl = track.stream_url || track.source_url;
            console.log('[PlayerStore] Loading track:', track.title);
            console.log('[PlayerStore] Audio URL:', audioUrl);

            if (!audioUrl) {
                throw new Error('No audio URL found in track');
            }

            // Detect audio format from filename or default to mp3
            let format = 'mp3';
            if (track.title || track.filename) {
                const filename = track.filename || track.title || '';
                if (filename.endsWith('.m4a')) format = 'm4a';
                else if (filename.endsWith('.wav')) format = 'wav';
                else if (filename.endsWith('.ogg')) format = 'ogg';
                else if (filename.endsWith('.flac')) format = 'flac';
                else if (filename.endsWith('.aac')) format = 'aac';
            }
            console.log('[PlayerStore] Audio format:', format);

            globalHowler = new Howl({
                src: [audioUrl],
                format: [format], // Specify format explicitly
                html5: true,
                preload: true,
                volume: get().volume,

                onload: () => {
                    console.log('[PlayerStore] Audio loaded successfully');
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

                    // Auto-play next track based on repeat mode
                    const { repeat, playNext } = get();
                    if (repeat === 'one') {
                        console.log('[PlayerStore] Repeat One: Restarting track');
                        if (globalHowler) {
                            globalHowler.seek(0);
                            globalHowler.play();
                        }
                    } else {
                        console.log('[PlayerStore] Auto-playing next track');
                        playNext();
                    }
                },

                onloaderror: (id, error) => {
                    console.error('[PlayerStore] Load error:', error);
                    set({ isLoading: false });
                },

                onplayerror: (id, error) => {
                    console.error('[PlayerStore] Play error:', error);
                }
            });

        } catch (error) {
            console.error('[PlayerStore] Error loading track:', error);
            set({ isLoading: false });
        }
    },

    playTrack: () => {
        ttsService.stop();

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

    setVolume: (volume) => {
        if (globalHowler) {
            globalHowler.volume(volume);
        }
        set({ volume });
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
    },

    // Safe playNext - supports repeat all mode
    playNext: () => {
        const { queue, currentIndex, loadTrack, repeat } = get();

        if (queue.length === 0) {
            console.log('[PlayerStore] No queue - cannot play next');
            return;
        }

        let nextIndex = currentIndex + 1;

        // Handle end of queue
        if (nextIndex >= queue.length) {
            if (repeat === 'all') {
                console.log('[PlayerStore] Repeat All: Looping to first track');
                nextIndex = 0;
            } else {
                console.log('[PlayerStore] End of queue - stopping');
                return;
            }
        }

        const nextTrack = queue[nextIndex];
        if (nextTrack) {
            set({ currentIndex: nextIndex });
            loadTrack(nextTrack);
        }
    },

    // Safe playPrevious - restarts or goes back
    playPrevious: () => {
        const { queue, currentIndex, currentTime, seekTo, loadTrack } = get();

        // If > 3 seconds, just restart current track
        if (currentTime > 3) {
            seekTo(0);
            return;
        }

        if (queue.length === 0) {
            console.log('[PlayerStore] No queue - restarting track');
            seekTo(0);
            return;
        }

        const prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            console.log('[PlayerStore] Start of queue - restarting track');
            seekTo(0);
            return;
        }

        const prevTrack = queue[prevIndex];
        if (prevTrack) {
            set({ currentIndex: prevIndex });
            loadTrack(prevTrack);
        }
    },

    // Cycle through repeat modes: none -> one -> all -> none
    cycleRepeat: () => {
        const { repeat } = get();
        const modes = ['none', 'one', 'all'];
        const currentIdx = modes.indexOf(repeat);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        set({ repeat: nextMode });
        console.log(`[PlayerStore] Repeat mode: ${nextMode}`);
        return nextMode;
    }
}));

export default usePlayerStore;
