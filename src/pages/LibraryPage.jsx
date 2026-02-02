import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Heart, X, Clock } from 'lucide-react';
import LibraryGrid from '../components/library/LibraryGrid';
import StorageMeter from '../components/library/StorageMeter';
import LoadingSkeleton from '../components/library/LoadingSkeleton';
import BookPlayer from '../components/books/BookPlayer';
import usePlayerStore from '../store/playerStore';
import ttsService from '../lib/tts';
import { useYouTube } from '../contexts/YouTubeContext';
import { useBook } from '../contexts/BookContext';
import {
    getLibraryContent,
    deleteFromLibrary,
    toggleFavorite as toggleFavoriteDB,
    searchLibrary,
    getHistory,
    deleteFromHistory,
} from '../lib/indexedDB';

export default function LibraryPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setActiveVideo, clearVideo } = useYouTube();
    const { activeBook, setActiveBook, clearBook } = useBook();
    const [content, setContent] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [filteredContent, setFilteredContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'favorites' | 'history'
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'youtube' | 'music' | 'book'
    const [selectedBook, setSelectedBook] = useState(null);
    const { loadTrack, playTrack, setOnMusicStart, clearTrack } = usePlayerStore();

    // Callback to close book player when music OR YouTube starts
    const handleCloseBookPlayerCallback = () => {
        ttsService.stop();
        setSelectedBook(null);
        clearBook();
    };

    useEffect(() => {
        loadLibrary();
    }, []);

    // Check if we need to open the active book from context (when navigating from mini player)
    useEffect(() => {
        if (activeBook && !selectedBook) {
            setSelectedBook(activeBook);
        }
    }, [activeBook]);

    useEffect(() => {
        applyFilters();
    }, [content, searchQuery, filterMode, typeFilter]);

    // Register callback to close book player when music starts
    useEffect(() => {
        setOnMusicStart(handleCloseBookPlayerCallback);
        return () => setOnMusicStart(null);
    }, []);

    const loadLibrary = async () => {
        setLoading(true);
        try {
            const libraryContent = await getLibraryContent();
            setContent(libraryContent);

            // Also load history
            const history = await getHistory();
            setHistoryItems(history);

            // Check URL for openBook parameter
            const params = new URLSearchParams(location.search);
            const bookId = params.get('openBook');
            if (bookId && libraryContent.length > 0) {
                const bookToOpen = libraryContent.find(item => item.id === bookId);
                if (bookToOpen) {
                    setSelectedBook(bookToOpen);
                    // Clear the URL parameter
                    navigate('/library', { replace: true });
                }
            }
        } catch (error) {
            console.error('[LibraryPage] Failed to load library:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        // If history tab is selected, show history items instead
        if (filterMode === 'history') {
            setFilteredContent(historyItems.map(item => ({
                ...item,
                videoId: item.videoId,
                type: 'youtube-history',
                thumbnail_url: item.thumbnail,
                channel_name: item.channel,
            })));
            return;
        }

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

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(item => item.type === typeFilter);
        }

        setFilteredContent(filtered);
    };

    const handlePlay = (item) => {
        // If it's a YouTube history item, set active video (plays in persistent player)
        if (item.type === 'youtube-history') {
            // Stop any playing music when YouTube video starts
            clearTrack();
            // Close book player if open
            handleCloseBookPlayerCallback();
            setActiveVideo({
                videoId: item.videoId,
                title: item.title,
                channel: item.channel,
                thumbnail: item.thumbnail,
                url: item.url,
            });
            return;
        }

        // If it's a book, open BookPlayer modal
        if (item.type === 'book') {
            // Stop YouTube and music when book starts
            clearVideo();
            clearTrack();
            setSelectedBook(item);
            // Set in context so mini player shows
            setActiveBook(item);
            return;
        }

        // For music/audio tracks: Stop YouTube video if it's playing (mutual exclusivity)
        clearVideo();

        // Convert library item to track format
        const track = {
            id: item.videoId,
            title: item.title,
            description: item.description,
            channel_name: item.channel_name,
            thumbnail_url: item.thumbnail_url,
            stream_url: item.stream_url || item.source_url, // Include stream_url for music files
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

    const handleDelete = async (videoId, item) => {
        try {
            // If it's a history item, delete from history table
            if (item?.type === 'youtube-history') {
                await deleteFromHistory(item.id);
            } else {
                // Delete from library
                await deleteFromLibrary(videoId);
            }
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
        // Clear book from context so mini player disappears everywhere
        clearBook();
    };

    return (
        <div className="space-y-4">
            {/* Compact Header with Inline Filters */}
            <div className="space-y-3">
                {/* Title */}
                <h2 className="text-xl font-bold">Library</h2>

                {/* Main Filters - Compact inline */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilterMode('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterMode === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-surface-light text-gray-400 hover:text-white'
                            }`}
                    >
                        All Items
                    </button>
                    <button
                        onClick={() => setFilterMode('favorites')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterMode === 'favorites'
                            ? 'bg-red-500 text-white'
                            : 'bg-surface-light text-gray-400 hover:text-white'
                            }`}
                    >
                        <Heart size={14} fill={filterMode === 'favorites' ? 'currentColor' : 'none'} />
                        Favorites
                    </button>
                    <button
                        onClick={() => setFilterMode('history')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterMode === 'history'
                            ? 'bg-purple-500 text-white'
                            : 'bg-surface-light text-gray-400 hover:text-white'
                            }`}
                    >
                        <Clock size={14} />
                        History
                    </button>

                    {/* Divider */}
                    {filterMode !== 'history' && (
                        <div className="w-px h-6 bg-gray-700 mx-1" />
                    )}

                    {/* Type Filters - Inline with main filters */}
                    {filterMode !== 'history' && (
                        <>
                            <button
                                onClick={() => setTypeFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${typeFilter === 'all'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-surface text-gray-400 hover:text-white'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setTypeFilter('youtube')}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${typeFilter === 'youtube'
                                    ? 'bg-red-500/20 text-red-400 font-medium'
                                    : 'bg-surface text-gray-400 hover:text-white'
                                    }`}
                            >
                                📺 YouTube
                            </button>
                            <button
                                onClick={() => setTypeFilter('music')}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${typeFilter === 'music'
                                    ? 'bg-purple-500/20 text-purple-400 font-medium'
                                    : 'bg-surface text-gray-400 hover:text-white'
                                    }`}
                            >
                                🎵 Music
                            </button>
                            <button
                                onClick={() => setTypeFilter('book')}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${typeFilter === 'book'
                                    ? 'bg-blue-500/20 text-blue-400 font-medium'
                                    : 'bg-surface text-gray-400 hover:text-white'
                                    }`}
                            >
                                📚 Books
                            </button>
                        </>
                    )}
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
            {!loading && (content.length > 0 || historyItems.length > 0) && (
                <div className="flex gap-4 text-sm text-gray-400">
                    <span>{content.length} library items</span>
                    <span>•</span>
                    <span>{content.filter(item => item.is_favorite).length} favorites</span>
                    <span>•</span>
                    <span>{historyItems.length} history items</span>
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
                onDelete={(videoId) => {
                    const item = filteredContent.find(i => i.videoId === videoId || i.id === videoId);
                    handleDelete(videoId, item);
                }}
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
