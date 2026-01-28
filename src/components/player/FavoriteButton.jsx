import { Heart, HeartOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import usePlayerStore from '../../store/playerStore';
import { toggleFavorite as toggleFavoriteDB } from '../../lib/indexedDB';

export default function FavoriteButton() {
    const { currentTrack } = usePlayerStore();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentTrack) {
            setIsFavorite(currentTrack.is_favorite || false);
        }
    }, [currentTrack]);

    const handleToggle = async () => {
        if (!currentTrack || loading) return;

        setLoading(true);
        try {
            const newStatus = await toggleFavoriteDB(currentTrack.id);
            setIsFavorite(newStatus);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!currentTrack) return null;

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${isFavorite
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-gray-400 hover:text-white'
                } disabled:opacity-50`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            {isFavorite ? (
                <Heart size={20} fill="currentColor" />
            ) : (
                <HeartOff size={20} />
            )}
        </button>
    );
}
