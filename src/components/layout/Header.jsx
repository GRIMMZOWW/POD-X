import { Music } from 'lucide-react';
import UserMenu from '../auth/UserMenu';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 bg-surface border-b border-gray-800 z-40">
            <div className="flex items-center justify-between h-16 px-4 max-w-md mx-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-2 rounded-lg">
                        <Music size={24} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        POD-X
                    </h1>
                </div>

                {/* User Menu with dropdown */}
                <UserMenu />
            </div>
        </header>
    );
}
