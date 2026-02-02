import React from 'react';

export default function LoadingSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-surface rounded-lg overflow-hidden animate-pulse"
                >
                    {/* Thumbnail skeleton */}
                    <div className="aspect-square bg-gray-700" />

                    {/* Content skeleton */}
                    <div className="p-3 space-y-2">
                        {/* Title */}
                        <div className="h-4 bg-gray-700 rounded w-3/4" />
                        {/* Subtitle */}
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
