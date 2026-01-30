/**
 * Text-to-Speech Service using Web Speech API
 * Provides sentence-by-sentence reading with progress tracking
 */

class TTSService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.isPaused = false;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        this.onSentenceStart = null;
        this.onSentenceEnd = null;
        this.onComplete = null;
    }

    /**
     * Get available voices
     */
    getVoices() {
        return this.synth.getVoices();
    }

    /**
     * Get English voices only
     */
    getEnglishVoices() {
        const voices = this.getVoices();
        return voices.filter(voice => voice.lang.startsWith('en'));
    }

    /**
     * Split text into sentences
     * IMPORTANT: Must match the splitting in BookPlayer.jsx for highlighting to work
     */
    splitIntoSentences(text) {
        // Split using lookbehind - same as BookPlayer
        const sentences = text.split(/(?<=[.!?])\s+/);
        return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }

    /**
     * Start reading text
     */
    speak(text, options = {}) {
        // Stop any current speech
        this.stop();

        // Split into sentences
        this.sentences = this.splitIntoSentences(text);
        this.currentSentenceIndex = options.startIndex || 0;

        // Configure voice settings
        const voice = options.voice || this.getEnglishVoices()[0];
        const rate = options.rate || 1.0; // 0.5 to 2.0
        const pitch = options.pitch || 1.0; // 0 to 2
        const volume = options.volume || 1.0; // 0 to 1

        // Start reading from current sentence
        this.readNextSentence(voice, rate, pitch, volume);
    }

    /**
     * Read next sentence
     */
    readNextSentence(voice, rate, pitch, volume) {
        if (this.currentSentenceIndex >= this.sentences.length) {
            // Finished reading all sentences
            if (this.onComplete) {
                this.onComplete();
            }
            return;
        }

        const sentence = this.sentences[this.currentSentenceIndex];

        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(sentence);
        this.currentUtterance.voice = voice;
        this.currentUtterance.rate = rate;
        this.currentUtterance.pitch = pitch;
        this.currentUtterance.volume = volume;

        // Callbacks
        this.currentUtterance.onstart = () => {
            if (this.onSentenceStart) {
                this.onSentenceStart(this.currentSentenceIndex, sentence, this.sentences.length);
            }
        };

        this.currentUtterance.onend = () => {
            if (this.onSentenceEnd) {
                this.onSentenceEnd(this.currentSentenceIndex, sentence);
            }

            // Move to next sentence
            this.currentSentenceIndex++;
            this.readNextSentence(voice, rate, pitch, volume);
        };


        this.currentUtterance.onerror = (event) => {
            // Don't log interrupted errors - they're expected when stopping
            if (event.error === 'interrupted') {
                return; // Silently ignore
            }

            console.error('[TTS] Error:', event);

            // Try to continue with next sentence for other errors
            console.log('[TTS] Attempting to continue despite error...');
            this.currentSentenceIndex++;
            this.readNextSentence(voice, rate, pitch, volume);
        };

        // Speak
        this.synth.speak(this.currentUtterance);
    }

    /**
     * Pause reading
     */
    pause() {
        if (this.synth.speaking && !this.synth.paused) {
            this.synth.pause();
            this.isPaused = true;
        }
    }

    /**
     * Resume reading
     */
    resume() {
        if (this.synth.paused) {
            this.synth.resume();
            this.isPaused = false;
        }
    }

    /**
     * Stop reading
     */
    stop() {
        this.synth.cancel();
        this.currentUtterance = null;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        this.isPaused = false;
    }

    /**
     * Check if currently speaking
     */
    isSpeaking() {
        return this.synth.speaking;
    }

    /**
     * Get current progress
     */
    getProgress() {
        if (this.sentences.length === 0) return 0;
        return (this.currentSentenceIndex / this.sentences.length) * 100;
    }

    /**
     * Set volume dynamically (for sleep timer fade)
     */
    setVolume(volume) {
        if (this.currentUtterance) {
            this.currentUtterance.volume = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Set callbacks
     */
    setCallbacks(callbacks) {
        this.onSentenceStart = callbacks.onSentenceStart;
        this.onSentenceEnd = callbacks.onSentenceEnd;
        this.onComplete = callbacks.onComplete;
    }
}

// Create singleton instance
const ttsService = new TTSService();

export default ttsService;
