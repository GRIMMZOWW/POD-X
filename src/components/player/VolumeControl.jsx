import { Volume2, VolumeX } from 'lucide-react';
import usePlayerStore from '../../store/playerStore';

export default function VolumeControl() {
    const { volume, setVolume } = usePlayerStore();

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };

    const toggleMute = () => {
        setVolume(volume > 0 ? 0 : 0.7);
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-colors"
            >
                {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-surface-light rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-white
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-3
                   [&::-moz-range-thumb]:h-3
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-white
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:cursor-pointer"
            />
        </div>
    );
}
