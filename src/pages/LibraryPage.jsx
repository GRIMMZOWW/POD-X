import { useState, useEffect } from 'react';
import { Search, Filter, Heart } from 'lucide-react';
import LibraryGrid from '../components/library/LibraryGrid';
import StorageMeter from '../components/library/StorageMeter';
import usePlayerStore from '../store/playerStore';
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
    const { loadTrack, playTrack } = usePlayerStore();

    useEffect(() => {
        loadLibrary();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [content, searchQuery, filterMode]);

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Library</h2>
                <button
                    onClick={toggleFilterMode}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${filterMode === 'favorites'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-surface-light text-gray-400 hover:text-white'
                        }`}
                >
                    <Heart size={18} fill={filterMode === 'favorites' ? 'currentColor' : 'none'} />
                    <span className="text-sm font-medium">
                        {filterMode === 'favorites' ? 'Favorites' : 'All'}
                    </span>
                </button>
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
        </div>
    );
}
