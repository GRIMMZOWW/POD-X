import { useEffect, useRef, useState } from 'react';
import usePlayerStore from '../../store/playerStore';

export default function ProgressBar() {
    const { currentTime, duration, seekTo } = usePlayerStore();
    const progressBarRef = useRef(null);
    const isDraggingRef = useRef(false);
    const [displayTime, setDisplayTime] = useState(0);

    useEffect(() => {
        if (!isDraggingRef.current) {
            setDisplayTime(currentTime);
        }
    }, [currentTime]);

    const handleMouseDown = (e) => {
        if (duration === 0) return;
        isDraggingRef.current = true;
        updateSeekPosition(e);
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return;
        updateSeekPosition(e);
    };

    const handleMouseUp = (e) => {
        if (!isDraggingRef.current) return;

        if (duration > 0 && progressBarRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newPercentage = Math.max(0, Math.min(1, clickX / rect.width));
            const newTime = newPercentage * duration;

            setDisplayTime(newTime);
            seekTo(newTime);
        }

        isDraggingRef.current = false;
    };

    const updateSeekPosition = (e) => {
        if (!progressBarRef.current || duration === 0) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPercentage = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = newPercentage * duration;

        setDisplayTime(newTime);
    };

    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (isDraggingRef.current) {
                handleMouseMove(e);
            }
        };

        const handleGlobalMouseUp = (e) => {
            if (isDraggingRef.current) {
                handleMouseUp(e);
            }
        };

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [duration]);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const percentage = duration > 0 ? (displayTime / duration) * 100 : 0;

    return (
        <div className="w-full">
            <div
                ref={progressBarRef}
                onMouseDown={handleMouseDown}
                className="h-1.5 bg-surface-light rounded-full cursor-pointer group relative overflow-hidden"
            >
                <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full relative transition-none"
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>{formatTime(displayTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}
