import { useEffect, useState } from 'react';
import usePlayerStore from '../../store/playerStore';
import { Play, Pause, Volume2, X, SkipBack, SkipForward, Repeat, Repeat1 } from 'lucide-react';

export default function MiniPlayer() {
    const {
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        togglePlay,
        seekTo,
        clearTrack,
        loadTrack,
        playNext,
        playPrevious,
        queue,
        currentIndex,
        repeat,
        cycleRepeat
    } = usePlayerStore();

    const [isDragging, setIsDragging] = useState(false);
    const [dragTime, setDragTime] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!currentTrack) return;

            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTrack, togglePlay]);

    if (!currentTrack) return null;

    const handleSeekStart = (e) => {
        setIsDragging(true);
        setDragTime(parseFloat(e.target.value));
    };

    const handleSeekMove = (e) => {
        if (isDragging) {
            setDragTime(parseFloat(e.target.value));
        }
    };

    const handleSeekEnd = (e) => {
        const newTime = parseFloat(e.target.value);
        setDragTime(newTime);
        seekTo(newTime);
        setIsDragging(false);
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const displayTime = isDragging ? dragTime : currentTime;
    const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

    return (
        <div className="fixed bottom-16 left-0 right-0 glass border-t border-gray-800/50 p-4 z-50 shadow-2xl animate-slide-up">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 shadow-lg">
                    {currentTrack.thumbnail_url ? (
                        <img
                            src={currentTrack.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Volume2 size={20} />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium truncate">
                        {currentTrack.title}
                    </h4>
                    <p className="text-gray-400 text-xs truncate">
                        {currentTrack.channel_name || currentTrack.artist}
                    </p>
                    {isLoading && currentTrack.type === 'youtube' && (
                        <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                            <span className="inline-block w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></span>
                            Extracting fresh URL...
                        </p>
                    )}
                </div>

                <div className="hidden md:flex flex-1 items-center gap-3 min-w-[200px]">
                    <span className="text-xs text-gray-400 w-10 text-right font-mono">
                        {formatTime(displayTime)}
                    </span>

                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={displayTime}
                        onMouseDown={handleSeekStart}
                        onInput={handleSeekMove}
                        onMouseUp={handleSeekEnd}
                        onChange={(e) => e.preventDefault()}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                     accent-[#6B46C1] hover:h-2 transition-all"
                        style={{
                            background: `linear-gradient(to right, #6B46C1 ${progress}%, #374151 ${progress}%)`
                        }}
                    />

                    <span className="text-xs text-gray-400 w-10 font-mono">
                        {formatTime(duration)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                        onClick={playPrevious}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full transition-all duration-200"
                        title="Previous"
                    >
                        <SkipBack size={18} />
                    </button>

                    <button
                        onClick={togglePlay}
                        disabled={isLoading}
                        className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 hover:from-[#7c4ddb] hover:to-purple-700 
                     text-white flex items-center justify-center transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 
                     focus:ring-offset-background active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-primary/30'
                            } ${isPlaying ? 'animate-pulse shadow-primary/50' : ''}`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={20} fill="currentColor" />
                        ) : (
                            <Play size={20} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    {/* Next Button */}
                    <button
                        onClick={playNext}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full transition-all duration-200"
                        title="Next"
                    >
                        <SkipForward size={18} />
                    </button>

                    {/* Repeat Button */}
                    <button
                        onClick={cycleRepeat}
                        className={`p-2 rounded-full transition-all duration-200 ${repeat !== 'none'
                                ? 'text-primary bg-primary/20'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                            }`}
                        title={`Repeat: ${repeat}`}
                    >
                        {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                    </button>

                    <button
                        onClick={clearTrack}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 
                     rounded-full transition-all duration-200 ml-2"
                        title="Close player"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="md:hidden mt-3 flex items-center gap-3">
                <span className="text-xs text-gray-400 w-10 text-right font-mono">
                    {formatTime(displayTime)}
                </span>

                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={displayTime}
                    onMouseDown={handleSeekStart}
                    onTouchStart={handleSeekStart}
                    onInput={handleSeekMove}
                    onMouseUp={handleSeekEnd}
                    onTouchEnd={handleSeekEnd}
                    onChange={(e) => e.preventDefault()}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#6B46C1]"
                    style={{
                        background: `linear-gradient(to right, #6B46C1 ${progress}%, #374151 ${progress}%)`
                    }}
                />

                <span className="text-xs text-gray-400 w-10 font-mono">
                    {formatTime(duration)}
                </span>
            </div>
        </div>
    );
}
