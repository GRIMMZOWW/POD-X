import ContentCard from './ContentCard';
import LoadingSkeleton from './LoadingSkeleton';
import { Music, Youtube, Book, Upload as UploadIcon } from 'lucide-react';

export default function LibraryGrid({ content, onPlay, onDelete, onToggleFavorite, loading }) {
    if (loading) {
        return <LoadingSkeleton count={6} />;
    }

    if (!content || content.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <div className="relative">
                        <Music size={32} className="text-purple-400 absolute -top-2 -left-2" />
                        <Youtube size={32} className="text-red-400" />
                        <Book size={32} className="text-blue-400 absolute -bottom-2 -right-2" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Your library is empty</h3>
                <p className="text-gray-400 mb-4 max-w-md mx-auto">
                    Start by adding YouTube videos, uploading music, or adding books to your library
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
                    >
                        <Youtube size={18} />
                        Browse YouTube
                    </a>
                    <a
                        href="/upload"
                        className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
                    >
                        <UploadIcon size={18} />
                        Upload Content
                    </a>
                </div>
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
