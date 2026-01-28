import { HardDrive } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStorageUsage } from '../../lib/indexedDB';

export default function StorageMeter() {
    const [storage, setStorage] = useState(null);

    useEffect(() => {
        loadStorageInfo();
    }, []);

    const loadStorageInfo = async () => {
        const info = await getStorageUsage();
        setStorage(info);
    };

    if (!storage) return null;

    const getStatusColor = () => {
        if (storage.percentUsed >= 95) return 'text-red-400 bg-red-500/20';
        if (storage.percentUsed >= 80) return 'text-yellow-400 bg-yellow-500/20';
        return 'text-primary bg-primary/20';
    };

    const getBarColor = () => {
        if (storage.percentUsed >= 95) return 'bg-red-500';
        if (storage.percentUsed >= 80) return 'bg-yellow-500';
        return 'bg-primary';
    };

    return (
        <div className="card bg-surface-light">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <HardDrive size={18} className="text-gray-400" />
                    <h3 className="font-semibold text-sm">Storage</h3>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor()}`}>
                    {storage.percentUsed}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-background rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${getBarColor()} transition-all duration-300`}
                    style={{ width: `${storage.percentUsed}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-500">
                <span>{storage.usageInMB} MB used</span>
                <span>{storage.quotaInMB} MB total</span>
            </div>

            {storage.percentUsed >= 80 && (
                <div className="mt-3 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded">
                    {storage.percentUsed >= 95
                        ? '⚠️ Storage almost full! Delete some content to free up space.'
                        : '⚠️ Storage is getting full. Consider deleting old content.'}
                </div>
            )}
        </div>
    );
}
