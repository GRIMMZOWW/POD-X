import { useState } from 'react';
import { Upload as UploadIcon, Youtube, Music, Book } from 'lucide-react';
import YouTubeInput from '../components/youtube/YouTubeInput';
import MusicUpload from '../components/music/MusicUpload';
import BookUpload from '../components/books/BookUpload';

export default function UploadPage() {
    const [activeTab, setActiveTab] = useState('youtube');

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Add Content</h2>
                <p className="text-gray-400">Choose what you'd like to add</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('youtube')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'youtube'
                            ? 'border-red-500 text-red-500'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    <Youtube className="w-5 h-5" />
                    <span>YouTube</span>
                </button>

                <button
                    onClick={() => setActiveTab('music')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'music'
                            ? 'border-purple-500 text-purple-500'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    <Music className="w-5 h-5" />
                    <span>Music</span>
                </button>

                <button
                    onClick={() => setActiveTab('books')}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'books'
                            ? 'border-blue-500 text-blue-500'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    <Book className="w-5 h-5" />
                    <span>Books</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="card">
                {activeTab === 'youtube' && <YouTubeInput />}
                {activeTab === 'music' && <MusicUpload />}
                {activeTab === 'books' && <BookUpload />}
            </div>
        </div>
    );
}
