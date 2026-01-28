import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DisclaimerModal({ isOpen, onClose, onAccept }) {
    const [agreed, setAgreed] = useState(false);

    if (!isOpen) return null;

    const handleAccept = () => {
        if (agreed) {
            onAccept();
            setAgreed(false); // Reset for next time
        }
    };

    const handleClose = () => {
        setAgreed(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg max-w-md w-full p-6 relative">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Warning icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-yellow-500/20 p-3 rounded-lg">
                        <AlertTriangle className="text-yellow-500" size={28} />
                    </div>
                    <h2 className="text-xl font-bold">Content Ownership Disclaimer</h2>
                </div>

                {/* Disclaimer text */}
                <div className="space-y-4 mb-6">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        By proceeding, you confirm that:
                    </p>

                    <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                        <li>You own this content, OR</li>
                        <li>The content is Creative Commons licensed, OR</li>
                        <li>You have explicit permission from the copyright holder</li>
                    </ul>

                    <div className="bg-surface-light p-3 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400">
                            <strong className="text-yellow-500">Important:</strong> POD-X is a tool for personal use only.
                            Downloading or streaming copyrighted content without permission violates YouTube's Terms of Service
                            and may be illegal in your jurisdiction.
                        </p>
                    </div>

                    <p className="text-xs text-gray-500">
                        We do not store or distribute any content. All streams are temporary and for your personal use only.
                    </p>
                </div>

                {/* Checkbox */}
                <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gray-600 bg-surface-light text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        I confirm I have the right to stream this content and understand the terms above
                    </span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 bg-surface-light hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={!agreed}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        I Understand, Proceed
                    </button>
                </div>
            </div>
        </div>
    );
}
