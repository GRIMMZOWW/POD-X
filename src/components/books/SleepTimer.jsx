import { useState } from 'react';
import { Moon, X } from 'lucide-react';

export default function SleepTimer({ onSetTimer, onCancel, isActive, timeRemaining }) {
    const [showOptions, setShowOptions] = useState(!isActive);
    const [customMinutes, setCustomMinutes] = useState('');

    const presetTimes = [
        { label: '15 min', minutes: 15 },
        { label: '30 min', minutes: 30 },
        { label: '45 min', minutes: 45 },
        { label: '60 min', minutes: 60 },
    ];

    const handleSetTimer = (minutes) => {
        onSetTimer(minutes);
        setShowOptions(false);
    };

    const handleCustomTimer = () => {
        const minutes = parseInt(customMinutes);
        if (minutes > 0 && minutes <= 480) { // Max 8 hours
            handleSetTimer(minutes);
            setCustomMinutes('');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isActive && !showOptions) {
        return (
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <Moon size={18} className="text-blue-400 animate-pulse" />
                <div className="flex-1">
                    <div className="text-sm text-blue-300">Sleep Timer</div>
                    <div className="text-lg font-mono font-bold text-blue-100">
                        {formatTime(timeRemaining)} remaining
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-blue-500/30 rounded-lg transition-colors"
                    title="Cancel timer"
                >
                    <X size={18} className="text-blue-300" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Moon size={18} className="text-gray-400" />
                    <h3 className="font-semibold">Sleep Timer</h3>
                </div>
                {isActive && (
                    <button
                        onClick={() => setShowOptions(false)}
                        className="text-sm text-gray-400 hover:text-white"
                    >
                        Hide
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {presetTimes.map((preset) => (
                    <button
                        key={preset.minutes}
                        onClick={() => handleSetTimer(preset.minutes)}
                        className="px-4 py-3 bg-surface-light hover:bg-blue-500/20 hover:border-blue-500/50 border border-gray-700 rounded-lg transition-all font-medium"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Custom (min)"
                    min="1"
                    max="480"
                    className="flex-1 px-3 py-2 bg-surface-light border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <button
                    onClick={handleCustomTimer}
                    disabled={!customMinutes || parseInt(customMinutes) <= 0}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                >
                    Set
                </button>
            </div>

            {isActive && (
                <button
                    onClick={onCancel}
                    className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-colors"
                >
                    Cancel Timer
                </button>
            )}
        </div>
    );
}
