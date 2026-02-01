import { X, Maximize2, Move } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useYouTube } from '../../contexts/YouTubeContext';

export default function YouTubePlayer() {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeVideo, clearVideo } = useYouTube();

    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 16, y: 16 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    if (!activeVideo) return null;

    const { videoId, title, channel } = activeVideo;
    const isStreamPage = location.pathname === '/' || location.pathname === '/stream';
    const isMini = !isStreamPage;

    const handleExpand = () => navigate('/');

    const handleMouseDown = (e) => {
        if (isMini && e.target.closest('.drag-handle')) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 320)),
            y: Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 192))
        });
    };

    useEffect(() => {
        if (isDragging) {
            const up = () => setIsDragging(false);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', up);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', up);
            };
        }
    }, [isDragging]);

    // ONE return - conditional styling only
    return (
        <div
            className={
                isMini
                    ? `fixed w-80 h-48 z-50 rounded-lg shadow-2xl overflow-hidden border border-gray-700 bg-black group ${isDragging ? 'cursor-grabbing' : ''}`
                    : 'card space-y-4'
            }
            style={isMini ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
        >
            {/* Mini player header */}
            {isMini && (
                <div
                    className="drag-handle absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Move size={14} className="text-gray-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{title}</p>
                                {channel && <p className="text-xs text-gray-300 truncate">{channel}</p>}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={handleExpand} className="p-1.5 hover:bg-white/20 rounded">
                                <Maximize2 size={14} className="text-white" />
                            </button>
                            <button onClick={clearVideo} className="p-1.5 hover:bg-white/20 rounded">
                                <X size={14} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main player header */}
            {!isMini && (
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{title || 'YouTube Video'}</h3>
                        {channel && <p className="text-sm text-gray-400">{channel}</p>}
                    </div>
                    <button onClick={clearVideo} className="p-2 hover:bg-surface-light rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* iframe - ALWAYS same position in DOM tree */}
            <div className={isMini ? 'w-full h-full' : 'relative w-full aspect-video bg-black rounded-lg overflow-hidden'}>
                <iframe
                    key={videoId}
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`}
                    title="YouTube"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={isMini ? 'w-full h-full' : 'absolute top-0 left-0 w-full h-full'}
                    style={isMini && isDragging ? { pointerEvents: 'none' } : undefined}
                />
            </div>

            {/* Main player footer */}
            {!isMini && (
                <p className="text-xs text-gray-500">
                    Navigate to other pages to continue watching
                </p>
            )}
        </div>
    );
}
