import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (!user) return null;

    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
    const initials = displayName.substring(0, 2).toUpperCase();

    return (
        <div className="relative" ref={menuRef}>
            {/* User Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-surface-light px-3 py-2 rounded-lg transition-colors"
            >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-semibold">
                    {initials}
                </div>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-gray-800 rounded-lg shadow-xl z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-800">
                        <p className="font-semibold truncate">{displayName}</p>
                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/settings');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-light transition-colors text-left"
                        >
                            <Settings size={18} className="text-gray-400" />
                            <span>Settings</span>
                        </button>

                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-red-400 transition-colors text-left"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
