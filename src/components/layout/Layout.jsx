import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import MiniPlayer from '../player/MiniPlayer';

export default function Layout() {
    return (
        <div className="min-h-screen bg-background pb-16">
            <Header />

            {/* Main content area with padding for fixed header and bottom nav */}
            <main className="pt-16 pb-20 min-h-screen">
                <div className="max-w-md mx-auto px-4 py-6">
                    <Outlet />
                </div>
            </main>

            <BottomNav />

            {/* Mini player (visible when track is playing) */}
            <MiniPlayer />
        </div>
    );
}
