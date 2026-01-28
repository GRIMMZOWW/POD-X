import { Youtube } from 'lucide-react';
import YouTubeInput from '../components/youtube/YouTubeInput';

export default function StreamPage() {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Stream Content</h2>
                <p className="text-gray-400">Paste a YouTube URL to start streaming</p>
            </div>

            {/* YouTube input component */}
            <YouTubeInput />

            {/* Info card */}
            <div className="card bg-surface-light">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Youtube size={20} className="text-primary" />
                    How it works
                </h3>
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Paste any YouTube URL above</li>
                    <li>• Click play to stream audio instantly</li>
                    <li>• Use the player controls at the bottom</li>
                    <li>• Download for offline access (coming soon)</li>
                </ul>
            </div>
        </div>
    );
}
