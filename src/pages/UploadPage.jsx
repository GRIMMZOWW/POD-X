import { useState } from 'react';
import { Upload as UploadIcon, Youtube, Music, Book, Sparkles } from 'lucide-react';
import YouTubeInput from '../components/youtube/YouTubeInput';
import MusicUpload from '../components/music/MusicUpload';
import BookUpload from '../components/books/BookUpload';

export default function UploadPage() {
    const [activeTab, setActiveTab] = useState('youtube');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center animate-slide-up">
                <div className="inline-flex items-center gap-2 mb-3">
                    <Sparkles className="text-primary" size={28} />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                        Add Content
                    </h2>
                </div>
                <p className="text-gray-400">Choose what you'd like to add</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-800/50 animate-stagger-1">
                <button
                    onClick={() => setActiveTab('youtube')}
                    className={`relative flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ${activeTab === 'youtube'
                        ? 'border-red-500 text-red-500 scale-105'
                        : 'border-transparent text-gray-400 hover:text-white hover:scale-105'
                        }`}
                >
                    <Youtube className="w-5 h-5" />
                    <span className="font-medium">YouTube</span>
                    {activeTab === 'youtube' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 animate-scale-in" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('music')}
                    className={`relative flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ${activeTab === 'music'
                        ? 'border-purple-500 text-purple-500 scale-105'
                        : 'border-transparent text-gray-400 hover:text-white hover:scale-105'
                        }`}
                >
                    <Music className="w-5 h-5" />
                    <span className="font-medium">Music</span>
                    {activeTab === 'music' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600 animate-scale-in" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('books')}
                    className={`relative flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ${activeTab === 'books'
                        ? 'border-blue-500 text-blue-500 scale-105'
                        : 'border-transparent text-gray-400 hover:text-white hover:scale-105'
                        }`}
                >
                    <Book className="w-5 h-5" />
                    <span className="font-medium">Books</span>
                    {activeTab === 'books' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 animate-scale-in" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="card gradient-overlay animate-stagger-2">
                {activeTab === 'youtube' && <YouTubeInput />}
                {activeTab === 'music' && <MusicUpload />}
                {activeTab === 'books' && <BookUpload />}
            </div>
        </div>
    );
}
