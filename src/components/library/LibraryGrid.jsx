import ContentCard from './ContentCard';
import { Music } from 'lucide-react';

export default function LibraryGrid({ content, onPlay, onDelete, onToggleFavorite, loading }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="card animate-pulse">
                        <div className="bg-surface-light h-40 rounded-lg mb-3" />
                        <div className="bg-surface-light h-4 rounded w-3/4 mb-2" />
                        <div className="bg-surface-light h-3 rounded w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (!content || content.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="bg-surface-light w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music size={40} className="text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Stream content to automatically save it here
                </p>
                <a
                    href="/"
                    className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                    Start Streaming
                </a>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {content.map((item) => (
                <ContentCard
                    key={item.id}
                    content={item}
                    onPlay={onPlay}
                    onDelete={onDelete}
                    onToggleFavorite={onToggleFavorite}
                />
            ))}
        </div>
    );
}
