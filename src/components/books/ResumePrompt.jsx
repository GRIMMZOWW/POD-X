import { Clock } from 'lucide-react';

export default function ResumePrompt({ onResume, onStartOver, lastReadTime }) {
    // Format time ago
    const getTimeAgo = (timestamp) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl p-6 max-w-md w-full space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 text-blue-400">
                    <Clock size={24} />
                    <h3 className="text-xl font-bold">Resume Reading?</h3>
                </div>

                <p className="text-gray-300">
                    You were reading this book {getTimeAgo(lastReadTime)}.
                    Would you like to continue from where you left off?
                </p>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onResume}
                        className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Resume Reading
                    </button>
                    <button
                        onClick={onStartOver}
                        className="flex-1 px-4 py-3 bg-surface-light hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
                    >
                        Start Over
                    </button>
                </div>
            </div>
        </div>
    );
}
