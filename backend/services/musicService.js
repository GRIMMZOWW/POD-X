const { parseFile } = require('music-metadata');
const fs = require('fs');
const path = require('path');
const { uploadAudioFile } = require('./supabaseService');

/**
 * Extract metadata from music file
 */
async function extractMusicMetadata(filePath, originalFilename = null) {
    try {
        console.log('[Music Service] Extracting metadata from:', filePath);

        const metadata = await parseFile(filePath);

        // Use original filename if provided, otherwise use temp file path
        const fallbackTitle = originalFilename
            ? path.basename(originalFilename, path.extname(originalFilename))
            : path.basename(filePath, path.extname(filePath));

        console.log('[Music Service] Fallback title:', fallbackTitle);
        console.log('[Music Service] Metadata title:', metadata.common.title);

        return {
            title: metadata.common.title || fallbackTitle,
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album || 'Unknown Album',
            duration: metadata.format.duration || 0,
            year: metadata.common.year || null,
            genre: metadata.common.genre ? metadata.common.genre.join(', ') : null,
            trackNumber: metadata.common.track?.no || null,
            albumArtist: metadata.common.albumartist || metadata.common.artist || 'Unknown',
            coverArt: metadata.common.picture && metadata.common.picture.length > 0
                ? metadata.common.picture[0]
                : null
        };
    } catch (error) {
        console.error('[Music Service] Metadata extraction failed:', error.message);

        // Use original filename if provided
        const fallbackTitle = originalFilename
            ? path.basename(originalFilename, path.extname(originalFilename))
            : path.basename(filePath, path.extname(filePath));

        // Return basic metadata from filename
        return {
            title: fallbackTitle,
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0,
            year: null,
            genre: null,
            trackNumber: null,
            albumArtist: 'Unknown',
            coverArt: null
        };
    }
}

/**
 * Process and upload music file
 */
async function processMusicFile(file) {
    try {
        console.log('[Music Service] Processing file:', file.originalname);

        // Extract metadata (pass original filename for fallback)
        const metadata = await extractMusicMetadata(file.path, file.originalname);

        console.log('[Music Service] Extracted metadata:', {
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album
        });

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `music_${Date.now()}${fileExt}`;

        // Upload to Supabase Storage
        console.log('[Music Service] Uploading to Supabase...');
        const audioUrl = await uploadAudioFile(file.path, fileName);

        // Upload cover art if exists
        let coverUrl = null;
        if (metadata.coverArt) {
            try {
                const coverFileName = `cover_${Date.now()}.${metadata.coverArt.format}`;
                const coverPath = path.join(path.dirname(file.path), coverFileName);

                // Write cover art to temp file
                fs.writeFileSync(coverPath, metadata.coverArt.data);

                // Upload cover art
                coverUrl = await uploadAudioFile(coverPath, coverFileName);

                // Delete temp cover file
                fs.unlinkSync(coverPath);
            } catch (e) {
                console.warn('[Music Service] Cover art upload failed:', e.message);
            }
        }

        // Delete temp audio file
        try {
            fs.unlinkSync(file.path);
        } catch (e) {
            console.warn('[Music Service] Failed to delete temp file:', e.message);
        }

        const result = {
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            duration: Math.round(metadata.duration),
            year: metadata.year,
            genre: metadata.genre,
            trackNumber: metadata.trackNumber,
            albumArtist: metadata.albumArtist,
            audioUrl: audioUrl,
            coverUrl: coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.title || 'Music')}&size=300&background=6B46C1&color=fff&bold=true`,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            type: 'music',
            source: 'upload'
        };

        console.log('[Music Service] Returning result:', result);
        return result;

    } catch (error) {
        console.error('[Music Service] Processing failed:', error.message);
        throw error;
    }
}

module.exports = {
    extractMusicMetadata,
    processMusicFile
};
