import Dexie from 'dexie';

// Initialize Dexie database
const db = new Dexie('POD-X');

// Define database schema
db.version(1).stores({
    // Content metadata (all streamed/saved content)
    content: '++id, videoId, title, channel_name, type, mode, created_at, last_played, is_favorite',

    // Audio blobs (for offline/downloaded content)
    audioBlobs: 'videoId, blob, size, created_at',

    // Playback progress
    playbackProgress: 'videoId, current_position, duration, updated_at',
});

/**
 * Save content metadata to library
 */
export async function saveToLibrary(track) {
    try {
        const existing = await db.content.where('videoId').equals(track.id).first();

        if (existing) {
            // Update existing entry
            await db.content.update(existing.id, {
                last_played: new Date().toISOString(),
            });
            console.log('[IndexedDB] Updated existing content:', track.title);
            return existing.id;
        } else {
            // Add new entry
            const id = await db.content.add({
                videoId: track.id,
                title: track.title,
                description: track.description || '',
                channel_name: track.channel_name || '',
                thumbnail_url: track.thumbnail_url || '',
                source_url: track.source_url || '',
                stream_url: track.stream_url || '',
                type: track.type || 'youtube',
                mode: track.mode || 'stream',
                duration: track.duration || 0,
                is_favorite: track.is_favorite || false,
                created_at: new Date().toISOString(),
                last_played: new Date().toISOString(),
            });
            console.log('[IndexedDB] Saved new content:', track.title);
            return id;
        }
    } catch (error) {
        console.error('[IndexedDB] Error saving to library:', error);
        throw error;
    }
}

/**
 * Get all library content
 */
export async function getLibraryContent(options = {}) {
    try {
        let query = db.content.toCollection();

        // Apply filters
        if (options.type) {
            query = db.content.where('type').equals(options.type);
        }

        if (options.favorites) {
            query = db.content.where('is_favorite').equals(1);
        }

        // Sort by last played (most recent first)
        const content = await query.reverse().sortBy('last_played');

        console.log(`[IndexedDB] Retrieved ${content.length} items from library`);
        return content;
    } catch (error) {
        console.error('[IndexedDB] Error getting library content:', error);
        return [];
    }
}

/**
 * Get recently played content (last 10)
 */
export async function getRecentlyPlayed(limit = 10) {
    try {
        const content = await db.content
            .orderBy('last_played')
            .reverse()
            .limit(limit)
            .toArray();

        return content;
    } catch (error) {
        console.error('[IndexedDB] Error getting recently played:', error);
        return [];
    }
}

/**
 * Delete content from library
 */
export async function deleteFromLibrary(videoId) {
    try {
        // Delete content metadata
        await db.content.where('videoId').equals(videoId).delete();

        // Delete audio blob if exists
        await db.audioBlobs.where('videoId').equals(videoId).delete();

        // Delete playback progress
        await db.playbackProgress.where('videoId').equals(videoId).delete();

        console.log('[IndexedDB] Deleted content:', videoId);
    } catch (error) {
        console.error('[IndexedDB] Error deleting from library:', error);
        throw error;
    }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(videoId) {
    try {
        const content = await db.content.where('videoId').equals(videoId).first();

        if (content) {
            const newStatus = !content.is_favorite;
            await db.content.update(content.id, {
                is_favorite: newStatus,
            });
            console.log('[IndexedDB] Toggled favorite:', videoId, newStatus);
            return newStatus;
        }
    } catch (error) {
        console.error('[IndexedDB] Error toggling favorite:', error);
        throw error;
    }
}

/**
 * Save playback progress
 */
export async function savePlaybackProgress(videoId, currentPosition, duration) {
    try {
        await db.playbackProgress.put({
            videoId,
            current_position: currentPosition,
            duration,
            updated_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[IndexedDB] Error saving playback progress:', error);
    }
}

/**
 * Get playback progress
 */
export async function getPlaybackProgress(videoId) {
    try {
        const progress = await db.playbackProgress.where('videoId').equals(videoId).first();
        return progress || null;
    } catch (error) {
        console.error('[IndexedDB] Error getting playback progress:', error);
        return null;
    }
}

/**
 * Get storage usage
 */
export async function getStorageUsage() {
    try {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const usageInMB = (estimate.usage / (1024 * 1024)).toFixed(2);
            const quotaInMB = (estimate.quota / (1024 * 1024)).toFixed(2);
            const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(1);

            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usageInMB,
                quotaInMB,
                percentUsed: parseFloat(percentUsed),
            };
        }
        return null;
    } catch (error) {
        console.error('[IndexedDB] Error getting storage usage:', error);
        return null;
    }
}

/**
 * Clear all library data
 */
export async function clearLibrary() {
    try {
        await db.content.clear();
        await db.audioBlobs.clear();
        await db.playbackProgress.clear();
        console.log('[IndexedDB] Library cleared');
    } catch (error) {
        console.error('[IndexedDB] Error clearing library:', error);
        throw error;
    }
}

/**
 * Search library content
 */
export async function searchLibrary(query) {
    try {
        const lowerQuery = query.toLowerCase();
        const content = await db.content
            .filter(item =>
                item.title.toLowerCase().includes(lowerQuery) ||
                item.channel_name.toLowerCase().includes(lowerQuery) ||
                item.description.toLowerCase().includes(lowerQuery)
            )
            .toArray();

        return content;
    } catch (error) {
        console.error('[IndexedDB] Error searching library:', error);
        return [];
    }
}

export default db;
