import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            // Show again after 7 days
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a short delay
            setTimeout(() => setIsVisible(true), 2000);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    };

    if (isInstalled || !deferredPrompt) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100]"
                >
                    <div className="bg-navy-deep/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <Download className="w-6 h-6 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-sm">
                                    Install GOOD SCRIPT
                                </h3>
                                <p className="text-white/60 text-xs mt-0.5">
                                    Get the full experience with offline support
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={handleInstall}
                                        className="flex-1 px-4 py-2 bg-white text-navy-deep font-medium text-sm rounded-lg hover:bg-white/90 transition-colors"
                                    >
                                        Install
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="px-3 py-2 text-white/60 hover:text-white text-sm transition-colors"
                                    >
                                        Not now
                                    </button>
                                </div>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleDismiss}
                                className="flex-shrink-0 p-1 text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
