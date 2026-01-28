import { Play, Heart, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';

export default function ContentCard({ content, onPlay, onDelete, onToggleFavorite }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${content.title}" from library?`)) {
            setIsDeleting(true);
            try {
                await onDelete(content.videoId);
            } catch (error) {
                console.error('Delete failed:', error);
                setIsDeleting(false);
            }
        }
    };

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        await onToggleFavorite(content.videoId);
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            onClick={() => onPlay(content)}
            className={`card cursor-pointer hover:bg-surface-light transition-all group relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''
                }`}
        >
            {/* Thumbnail */}
            <div className="relative mb-3 rounded-lg overflow-hidden bg-surface-light aspect-video">
                {content.thumbnail_url ? (
                    <img
                        src={content.thumbnail_url}
                        alt={content.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Play size={32} className="text-gray-600" />
                    </div>
                )}

                {/* Duration overlay */}
                {content.duration > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
                        {formatDuration(content.duration)}
                    </div>
                )}

                {/* Play overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-primary rounded-full p-3">
                        <Play size={24} fill="white" />
                    </div>
                </div>
            </div>

            {/* Content info */}
            <div className="space-y-1">
                <h3 className="font-semibold line-clamp-2 leading-tight">{content.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-1">{content.channel_name}</p>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatDate(content.last_played)}</span>
                    </div>

                    {content.mode === 'offline' && (
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Offline
                        </span>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
                <button
                    onClick={handleToggleFavorite}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${content.is_favorite
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-surface-light text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                >
                    <Heart size={16} fill={content.is_favorite ? 'currentColor' : 'none'} />
                    <span className="text-xs font-medium">
                        {content.is_favorite ? 'Favorited' : 'Favorite'}
                    </span>
                </button>

                <button
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-light text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                    <Trash2 size={16} />
                    <span className="text-xs font-medium">Delete</span>
                </button>
            </div>
        </div>
    );
}
