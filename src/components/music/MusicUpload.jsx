import { useState } from 'react';
import { Music, Upload, X, Check, AlertCircle } from 'lucide-react';
import { saveToLibrary } from '../../lib/indexedDB';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function MusicUpload() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({});
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
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch(`${API_URL}/api/music/upload-multiple`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Upload failed');
            }

            // Save to library
            for (const track of result.data) {
                const libraryTrack = {
                    id: `music_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    title: track.title,
                    description: `${track.artist} • ${track.album}`,
                    channel_name: track.artist,
                    thumbnail_url: track.coverUrl,
                    stream_url: track.audioUrl,
                    source_url: track.audioUrl,
                    type: 'music',
                    mode: 'upload',
                    duration: track.duration,
                    current_position: 0,
                    is_favorite: false,
                    metadata: {
                        artist: track.artist,
                        album: track.album,
                        year: track.year,
                        genre: track.genre,
                        trackNumber: track.trackNumber
                    }
                };

                console.log('[MusicUpload] Saving track:', libraryTrack);
                await saveToLibrary(libraryTrack);
            }

            setSuccess(`✓ ${result.data.length} file(s) uploaded successfully!`);
            setFiles([]);

            if (result.errors && result.errors.length > 0) {
                setErrors(result.errors.map(e => `${e.file}: ${e.error}`));
            }

        } catch (error) {
            console.error('[MusicUpload] Error:', error);
            setErrors([error.message]);
        } finally {
            setUploading(false);
        }
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
                Upload your own MP3, M4A, WAV, or FLAC files • Auto-saves to library
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
                                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                        {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
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
