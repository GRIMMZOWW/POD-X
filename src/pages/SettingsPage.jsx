import { useState, useEffect } from 'react';
import { Settings, User, Volume2, Palette, HardDrive, Info, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getStorageInfo, clearAllData } from '../lib/indexedDB';
import { useToast } from '../contexts/ToastContext';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [storageInfo, setStorageInfo] = useState(null);
    const [playbackSettings, setPlaybackSettings] = useState({
        autoPlay: true,
        volume: 100,
        playbackSpeed: 1.0,
    });
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        loadSettings();
        updateStorageInfo();
    }, []);

    const loadSettings = () => {
        const saved = localStorage.getItem('podx_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                setPlaybackSettings(prev => ({ ...prev, ...settings }));
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    };

    const updateStorageInfo = async () => {
        const info = await getStorageInfo();
        setStorageInfo(info);
    };

    const saveSettings = (newSettings) => {
        setPlaybackSettings(newSettings);
        localStorage.setItem('podx_settings', JSON.stringify(newSettings));
    };

    const handleAutoPlayChange = (e) => {
        const newSettings = { ...playbackSettings, autoPlay: e.target.checked };
        saveSettings(newSettings);
    };

    const handleVolumeChange = (e) => {
        const newSettings = { ...playbackSettings, volume: parseInt(e.target.value) };
        saveSettings(newSettings);
    };

    const handleSpeedChange = (e) => {
        const newSettings = { ...playbackSettings, playbackSpeed: parseFloat(e.target.value) };
        saveSettings(newSettings);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const handleClearData = async () => {
        if (!showClearConfirm) {
            setShowClearConfirm(true);
            return;
        }

        try {
            await clearAllData();
            setShowClearConfirm(false);
            updateStorageInfo();
            toast.success('All data cleared successfully!');
        } catch (error) {
            console.error('Failed to clear data:', error);
            toast.error('Failed to clear data. Please try again.');
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Settings</h2>
                <p className="text-gray-400">Customize your POD-X experience</p>
            </div>

            {/* Account Section */}
            <div className="card space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                    <User className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold">Account</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <div>
                            <p className="text-sm font-medium">User ID</p>
                            <p className="text-xs text-gray-400 font-mono">{user?.id?.slice(0, 20)}...</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Playback Settings */}
            <div className="card space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                    <Volume2 className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">Playback</h3>
                </div>

                <div className="space-y-4">
                    {/* Auto-play */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Auto-play next track</p>
                            <p className="text-xs text-gray-400">Automatically play next item in queue</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={playbackSettings.autoPlay}
                                onChange={handleAutoPlayChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                    </div>

                    {/* Default Volume */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <p className="text-sm font-medium">Default Volume</p>
                            <span className="text-xs text-gray-400">{playbackSettings.volume}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={playbackSettings.volume}
                            onChange={handleVolumeChange}
                            className="w-full accent-blue-500"
                        />
                    </div>

                    {/* Playback Speed */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <p className="text-sm font-medium">Playback Speed</p>
                            <span className="text-xs text-gray-400">{playbackSettings.playbackSpeed}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={playbackSettings.playbackSpeed}
                            onChange={handleSpeedChange}
                            className="w-full accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0.5x</span>
                            <span>1.0x</span>
                            <span>2.0x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="card space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                    <Palette className="w-5 h-5 text-pink-500" />
                    <h3 className="font-semibold">Appearance</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <div>
                            <p className="text-sm font-medium">Theme</p>
                            <p className="text-xs text-gray-400">Currently using Dark theme</p>
                        </div>
                        <span className="text-xs px-3 py-1 bg-gray-700 rounded-full">Dark</span>
                    </div>
                </div>
            </div>

            {/* Storage */}
            <div className="card space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                    <HardDrive className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">Storage</h3>
                </div>

                {storageInfo && (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Library Items</span>
                                <span className="font-medium">{storageInfo.totalItems}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Storage Used</span>
                                <span className="font-medium">{formatBytes(storageInfo.estimatedSize)}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-700">
                            <button
                                onClick={handleClearData}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${showClearConfirm
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                    }`}
                            >
                                <Trash2 className="w-4 h-4" />
                                {showClearConfirm ? 'Click again to confirm' : 'Clear All Data'}
                            </button>
                            {showClearConfirm && (
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    This will delete all your library items and cannot be undone
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* About */}
            <div className="card space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                    <Info className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold">About</h3>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Version</span>
                        <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Build</span>
                        <span className="font-medium font-mono">2026.02.01</span>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                        <p className="text-gray-400 text-xs leading-relaxed">
                            POD-X is a multimedia platform for streaming YouTube videos, playing music, and reading books with text-to-speech. Built with React, Vite, and Supabase.
                        </p>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                        <p className="text-gray-400 text-xs">
                            Made with ❤️ by GRIMMZOWW
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
