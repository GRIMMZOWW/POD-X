import { Music, Home, Library, Upload, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Stream' },
        { path: '/library', icon: Library, label: 'Library' },
        { path: '/upload', icon: Upload, label: 'Upload' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-800/50 z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${isActive
                                    ? 'text-primary scale-105'
                                    : 'text-gray-400 hover:text-white hover:scale-105'
                                }`}
                        >
                            <Icon size={24} className="transition-transform duration-200" />
                            <span className="text-xs mt-1 font-medium">{item.label}</span>
                            {isActive && (
                                <div className="absolute bottom-0 w-12 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-t-full animate-scale-in" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
