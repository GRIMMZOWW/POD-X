import { useState } from 'react';
import { Book, Upload, X, Check, AlertCircle, FileText } from 'lucide-react';
import { saveToLibrary } from '../../lib/indexedDB';
import { processBookFile } from '../../lib/pdfExtractor';
import { useToast } from '../../contexts/ToastContext';

export default function BookUpload() {
    const toast = useToast();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        addFiles(files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const addFiles = (files) => {
        const validFiles = files.filter(file => {
            const ext = file.name.toLowerCase();
            return ext.endsWith('.pdf') || ext.endsWith('.txt');
        });

        if (validFiles.length === 0) {
            setError('Please select PDF or TXT files');
            return;
        }

        setSelectedFiles(prev => [...prev, ...validFiles]);
        setError('');
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadBooks = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setError('');
        setSuccess('');

        let successCount = 0;
        let failedFiles = [];

        try {
            for (const file of selectedFiles) {
                try {
                    console.log('[BookUpload] Processing:', file.name);

                    // Extract text and chapters from PDF/TXT in browser
                    const bookData = await processBookFile(file);

                    console.log('[BookUpload] Book processed:', bookData.title);
                    console.log('[BookUpload] Chapters detected:', bookData.chapters.length);
                    console.log('[BookUpload] First chapter:', bookData.chapters[0]);
                    console.log('[BookUpload] Word count:', bookData.wordCount);

                    // Generate cover URL using data URI (no external API calls)
                    const titleText = bookData.title.length > 30 ? bookData.title.substring(0, 27) + '...' : bookData.title;
                    const coverUrl = `data:image/svg+xml,${encodeURIComponent(`
                        <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
                            <rect width="300" height="300" fill="#4A5568"/>
                            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" style="word-spacing: 100vw;">${titleText}</text>
                        </svg>
                    `)}`;

                    // Prepare library item with chapters
                    const libraryItem = {
                        id: `book_${Date.now()}_${Math.random()}`,
                        videoId: `book_${Date.now()}_${Math.random()}`,
                        title: bookData.title,
                        artist: bookData.author,
                        channel_name: bookData.author,
                        thumbnail_url: coverUrl,
                        stream_url: null,
                        audio_url: null,
                        duration: bookData.wordCount / 200 * 60,
                        type: 'book',
                        source: 'upload',
                        last_played: new Date().toISOString(),
                        metadata: {
                            totalPages: bookData.totalPages,
                            chapterCount: bookData.chapters.length,
                            wordCount: bookData.wordCount,
                            fileName: bookData.fileName,
                            chapters: bookData.chapters // CRITICAL: Save chapters array
                        }
                    };

                    console.log('[BookUpload] Saving to IndexedDB with chapters:', libraryItem.metadata.chapters.length);

                    // Save to IndexedDB
                    await saveToLibrary(libraryItem);

                    successCount++;
                    console.log('[BookUpload] Saved to library:', bookData.title);

                } catch (fileError) {
                    console.error('[BookUpload] Failed to process:', file.name, fileError);
                    failedFiles.push({ name: file.name, error: fileError.message });
                }
            }

            if (successCount > 0) {
                setSuccess(`Successfully uploaded ${successCount} book(s)`);
                toast.success(`${successCount} book(s) added to library!`);
                setSelectedFiles([]);

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            }

            if (failedFiles.length > 0) {
                const errorMsg = `Failed to process ${failedFiles.length} file(s): ${failedFiles.map(f => f.name).join(', ')}`;
                setError(errorMsg);
                toast.error(`Failed to process ${failedFiles.length} file(s)`);
            }

        } catch (err) {
            console.error('[BookUpload] Error:', err);
            setError(err.message || 'Failed to upload books');
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Book className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-semibold">Upload Books</h3>
            </div>

            <p className="text-sm text-gray-400 mb-4">
                Upload PDF or TXT files • Processed in your browser • Text-to-Speech enabled • Auto-saves to library
            </p>

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-2">
                    Drag and drop book files here
                </p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <label className="btn btn-secondary cursor-pointer">
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    Browse Files
                </label>
            </div>

            {/* File List */}
            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Selected Files ({selectedFiles.length})</h4>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{file.name}</p>
                                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="p-1 hover:bg-surface-light rounded transition-colors flex-shrink-0"
                                disabled={uploading}
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button */}
            {selectedFiles.length > 0 && (
                <button
                    onClick={uploadBooks}
                    disabled={uploading}
                    className="btn btn-primary w-full"
                >
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing in browser...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Process {selectedFiles.length} Book(s)
                        </>
                    )}
                </button>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-500">{success}</p>
                </div>
            )}

            {/* Info */}
            <div className="text-xs text-gray-500 space-y-1">
                <p>✅ Processed entirely in your browser (no server upload)</p>
                <p>• Supported formats: PDF, TXT</p>
                <p>• Maximum file size: 50MB per file</p>
                <p>• Books will be converted to speech using your browser's TTS</p>
                <p>• Chapter detection is automatic</p>
            </div>
        </div>
    );
}
