import { Upload as UploadIcon, Youtube, Book, Music } from 'lucide-react';

export default function UploadPage() {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Add Content</h2>
                <p className="text-gray-400">Choose what you'd like to add</p>
            </div>

            <div className="space-y-4">
                {/* YouTube option */}
                <button className="card w-full text-left hover:bg-surface-light transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-500/20 p-3 rounded-lg">
                            <Youtube className="text-red-500" size={28} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-1">YouTube</h3>
                            <p className="text-sm text-gray-400">Stream or download from YouTube</p>
                        </div>
                    </div>
                </button>

                {/* Books option - Phase 2 */}
                <button className="card w-full text-left opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-lg">
                            <Book className="text-blue-500" size={28} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-1">Books</h3>
                            <p className="text-sm text-gray-400">Coming in Phase 2</p>
                        </div>
                    </div>
                </button>

                {/* Music option - Phase 3 */}
                <button className="card w-full text-left opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-500/20 p-3 rounded-lg">
                            <Music className="text-green-500" size={28} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-1">Music</h3>
                            <p className="text-sm text-gray-400">Coming in Phase 3</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
