import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import usePlayerStore from '../../store/playerStore';

export default function PlayerControls() {
    const { isPlaying, togglePlayPause, skipPrevious, skipNext, currentTrack } = usePlayerStore();

    const disabled = !currentTrack;

    return (
        <div className="flex items-center justify-center gap-6">
            <button
                onClick={skipPrevious}
                disabled={disabled}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <SkipBack size={28} />
            </button>

            <button
                onClick={togglePlayPause}
                disabled={disabled}
                className="bg-primary hover:bg-primary-dark rounded-full p-4 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                {isPlaying ? (
                    <Pause size={28} fill="white" />
                ) : (
                    <Play size={28} fill="white" className="ml-1" />
                )}
            </button>

            <button
                onClick={skipNext}
                disabled={disabled}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <SkipForward size={28} />
            </button>
        </div>
    );
}
