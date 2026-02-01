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
        <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-800 z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? 'text-primary' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Icon size={24} />
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
