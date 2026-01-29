import { useState, useEffect } from 'react';
import { Search, Filter, Heart, X } from 'lucide-react';
import LibraryGrid from '../components/library/LibraryGrid';
import StorageMeter from '../components/library/StorageMeter';
import BookPlayer from '../components/books/BookPlayer';
import usePlayerStore from '../store/playerStore';
import ttsService from '../lib/tts';
import {
    getLibraryContent,
    deleteFromLibrary,
    toggleFavorite as toggleFavoriteDB,
    searchLibrary,
} from '../lib/indexedDB';

export default function LibraryPage() {
    const [content, setContent] = useState([]);
    const [filteredContent, setFilteredContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'favorites'
    const [selectedBook, setSelectedBook] = useState(null);
    const { loadTrack, playTrack, setOnMusicStart } = usePlayerStore();

    useEffect(() => {
        loadLibrary();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [content, searchQuery, filterMode]);

    // Register callback to close book player when music starts
    useEffect(() => {
        setOnMusicStart(() => {
            // Close book player modal
            ttsService.stop();
            setSelectedBook(null);
        });
        return () => setOnMusicStart(null);
    }, []);

    const loadLibrary = async () => {
        setLoading(true);
        try {
            const libraryContent = await getLibraryContent();
            setContent(libraryContent);
        } catch (error) {
            console.error('Failed to load library:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        let filtered = [...content];

        // Apply search
        if (searchQuery.trim()) {
            const searchResults = await searchLibrary(searchQuery);
            filtered = searchResults;
        }

        // Apply filter mode
        if (filterMode === 'favorites') {
            filtered = filtered.filter(item => item.is_favorite);
        }

        setFilteredContent(filtered);
    };

    const handlePlay = (item) => {
        // If it's a book, open BookPlayer modal
        if (item.type === 'book') {
            setSelectedBook(item);
            return;
        }

        // Convert library item to track format
        const track = {
            id: item.videoId,
            title: item.title,
            description: item.description,
            channel_name: item.channel_name,
            thumbnail_url: item.thumbnail_url,
            stream_url: item.stream_url,
            source_url: item.source_url,
            type: item.type,
            mode: item.mode,
            duration: item.duration,
            current_position: 0,
            is_favorite: item.is_favorite,
        };

        // Load track and play
        loadTrack(track);
        setTimeout(() => {
            playTrack();
        }, 100);
    };

    const handleDelete = async (videoId) => {
        try {
            await deleteFromLibrary(videoId);
            // Refresh library
            await loadLibrary();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete content. Please try again.');
        }
    };

    const handleToggleFavorite = async (videoId) => {
        try {
            await toggleFavoriteDB(videoId);
            // Refresh library
            await loadLibrary();
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const toggleFilterMode = () => {
        setFilterMode(prev => prev === 'all' ? 'favorites' : 'all');
    };

    const handleCloseBookPlayer = () => {
        // Stop TTS before closing
        ttsService.stop();
        setSelectedBook(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Library</h2>

                {/* Filter Tabs */}
                <div className="flex gap-2 bg-surface-light rounded-lg p-1">
                    <button
                        onClick={() => setFilterMode('all')}
                        className={`px-4 py-2 rounded-md transition-all ${filterMode === 'all'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        All Items
                    </button>
                    <button
                        onClick={() => setFilterMode('favorites')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${filterMode === 'favorites'
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Heart size={18} fill={filterMode === 'favorites' ? 'currentColor' : 'none'} />
                        Favorites
                    </button>
                </div>
            </div>

            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search your library..."
                    className="input w-full pl-10"
                />
            </div>

            {/* Storage meter */}
            <StorageMeter />

            {/* Stats */}
            {!loading && content.length > 0 && (
                <div className="flex gap-4 text-sm text-gray-400">
                    <span>{content.length} total items</span>
                    <span>•</span>
                    <span>{content.filter(item => item.is_favorite).length} favorites</span>
                    {searchQuery && (
                        <>
                            <span>•</span>
                            <span>{filteredContent.length} results</span>
                        </>
                    )}
                </div>
            )}

            {/* Library grid */}
            <LibraryGrid
                content={filteredContent}
                onPlay={handlePlay}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                loading={loading}
            />

            {/* BookPlayer Modal */}
            {selectedBook && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto"
                    onClick={handleCloseBookPlayer} // Close when clicking background
                >
                    <div
                        className="bg-surface rounded-lg max-w-4xl w-full my-8"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >
                        <div className="sticky top-0 bg-surface border-b border-gray-800 p-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold">Reading: {selectedBook.title}</h2>
                            <button
                                onClick={handleCloseBookPlayer}
                                className="p-2 hover:bg-surface-light rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <BookPlayer book={selectedBook} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
