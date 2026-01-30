import { useState } from 'react';
import { Music, Upload, X, Check, AlertCircle } from 'lucide-react';
import Dexie from 'dexie';

// Simple dedicated database for music files
const musicDB = new Dexie('POD-X-Music');
musicDB.version(1).stores({
    tracks: 'id, title, artist, album',
    files: 'id, blob'
});

export default function MusicUpload() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState('');

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        const audioFiles = droppedFiles.filter(file =>
            file.type.startsWith('audio/')
        );
        addFiles(audioFiles);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const addFiles = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        setErrors([]);
        setSuccess('');
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setErrors([]);
        setSuccess('');

        try {
            let successCount = 0;
            const failedFiles = [];

            for (const file of files) {
                try {
                    const id = `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                    // Get metadata
                    const metadata = await getAudioMetadata(file);

                    // Store file blob
                    await musicDB.files.put({
                        id: id,
                        blob: file
                    });

                    // Store track metadata
                    await musicDB.tracks.put({
                        id: id,
                        title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                        artist: metadata.artist || 'Unknown Artist',
                        album: metadata.album || 'Unknown Album',
                        duration: metadata.duration || 0,
                        fileName: file.name,
                        fileSize: file.size,
                        type: 'music',
                        mode: 'upload',
                        created_at: new Date().toISOString()
                    });

                    // Also save to main library for compatibility
                    const { saveToLibrary } = await import('../../lib/indexedDB');
                    await saveToLibrary({
                        id: id,
                        videoId: id,
                        title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                        description: `${metadata.artist || 'Unknown Artist'} • ${metadata.album || 'Unknown Album'}`,
                        channel_name: metadata.artist || 'Unknown Artist',
                        thumbnail_url: '/music-icon.png',
                        stream_url: `music://${id}`, // Special protocol to identify music files
                        source_url: `music://${id}`,
                        type: 'music',
                        mode: 'upload',
                        duration: metadata.duration || 0,
                        current_position: 0,
                        is_favorite: false,
                        metadata: {
                            artist: metadata.artist || 'Unknown Artist',
                            album: metadata.album || 'Unknown Album',
                            fileName: file.name,
                            fileSize: file.size
                        }
                    });

                    successCount++;
                } catch (error) {
                    console.error('[MusicUpload] Error processing:', file.name, error);
                    failedFiles.push({ name: file.name, error: error.message });
                }
            }

            if (successCount > 0) {
                setSuccess(`✓ ${successCount} file(s) uploaded successfully!`);
                setFiles([]);
            }

            if (failedFiles.length > 0) {
                setErrors(failedFiles.map(f => `${f.name}: ${f.error}`));
            }

        } catch (error) {
            console.error('[MusicUpload] Error:', error);
            setErrors([error.message]);
        } finally {
            setUploading(false);
        }
    };

    const getAudioMetadata = (file) => {
        return new Promise((resolve) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);

            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(url);
                resolve({
                    duration: audio.duration,
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    artist: 'Unknown Artist',
                    album: 'Unknown Album'
                });
            });

            audio.addEventListener('error', () => {
                URL.revokeObjectURL(url);
                resolve({
                    duration: 0,
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    artist: 'Unknown Artist',
                    album: 'Unknown Album'
                });
            });

            audio.src = url;
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <Music className="w-6 h-6 text-purple-500" />
                <h3 className="text-lg font-semibold">Upload Music</h3>
            </div>

            <p className="text-sm text-gray-400 mb-4">
                Upload MP3, M4A, WAV, or FLAC files • Stored locally in your browser
            </p>

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
            >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-2">
                    Drag and drop music files here
                </p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <label className="btn btn-secondary cursor-pointer">
                    <input
                        type="file"
                        multiple
                        accept="audio/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    Browse Files
                </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Selected Files ({files.length})</h4>
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                            <Music className="w-5 h-5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{file.name}</p>
                                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="p-1 hover:bg-surface-light rounded transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={uploadFiles}
                        disabled={uploading}
                        className="btn btn-primary w-full"
                    >
                        {uploading ? 'Processing...' : `Upload ${files.length} File(s)`}
                    </button>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <Check className="w-5 h-5 text-green-500" />
                    <p className="text-sm text-green-400">{success}</p>
                </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="space-y-2">
                    {errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Export helper to get music file blob
export async function getMusicBlob(id) {
    try {
        const file = await musicDB.files.get(id);
        return file?.blob || null;
    } catch (error) {
        console.error('[MusicDB] Error getting blob:', error);
        return null;
    }
}
