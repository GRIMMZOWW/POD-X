import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import MiniPlayer from '../player/MiniPlayer';
import YouTubePlayer from '../youtube/YouTubePlayer';
import { useYouTube } from '../../contexts/YouTubeContext';

export default function Layout() {
    const { activeVideo, clearVideo } = useYouTube();

    return (
        <div className="min-h-screen bg-background pb-16">
            <Header />

            {/* Main content area */}
            <main className="pt-16 pb-20 min-h-screen">
                <div className="max-w-md mx-auto px-4 py-6">
                    <Outlet />
                </div>
            </main>

            <BottomNav />

            {/* Music mini player - hidden when YouTube active */}
            {!activeVideo && <MiniPlayer />}

            {/* 
                Professional YouTube Player
                - ONE component, ONE iframe
                - Renders as main player on Stream page
                - Renders as mini player on other pages  
                - Never unmounts, video continues seamlessly
            */}
            {activeVideo && (
                <YouTubePlayer
                    videoId={activeVideo.videoId}
                    title={activeVideo.title}
                    channel={activeVideo.channel}
                    onClose={clearVideo}
                />
            )}
        </div>
    );
}
