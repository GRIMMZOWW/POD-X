import { Music } from 'lucide-react';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 glass border-b border-gray-800/50 z-40 animate-slide-up">
            <div className="flex items-center justify-center h-16 px-4 max-w-md mx-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-primary to-purple-600 p-2 rounded-lg shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-110">
                        <Music size={24} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent animate-fade-in">
                        POD-X
                    </h1>
                </div>
            </div>
        </header>
    );
}
