import React from 'react';
import { motion } from 'framer-motion';
import { Video, Timer, Type, Palette, X } from 'lucide-react';
import { cn } from '~/src/lib/utils';
import type { Settings } from '~/src/types';

interface StudioFeaturePanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSettingsChange: (settings: Partial<Settings>) => void;
}

const FEATURES = [
    {
        id: 'enableWebcam',
        icon: Video,
        label: 'Webcam Overlay',
        description: 'Show camera feed during teleprompter',
    },
    {
        id: 'showTimer',
        icon: Timer,
        label: 'Session Timer',
        description: 'Display elapsed time during sessions',
    },
    {
        id: 'giantFont',
        icon: Type,
        label: 'Giant Font Mode',
        description: 'Extra large text for readability',
    },
] as const;

export const StudioFeaturePanel: React.FC<StudioFeaturePanelProps> = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
}) => {
    if (!isOpen) return null;

    // For custom studio, we use enableWebcam from settings
    // We'll need to add more feature flags to Settings type if needed

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md mx-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-white">My Studio</h2>
                        <p className="text-xs text-zinc-500">Customize your teleprompter experience</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <X size={18} className="text-zinc-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Webcam Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <Video size={18} className="text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">Webcam Overlay</div>
                                <div className="text-xs text-zinc-500">Show camera feed during teleprompter</div>
                            </div>
                        </div>
                        <button
                            onClick={() => onSettingsChange({ enableWebcam: !settings.enableWebcam })}
                            className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                settings.enableWebcam ? "bg-white" : "bg-zinc-700"
                            )}
                        >
                            <motion.div
                                layout
                                className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full",
                                    settings.enableWebcam ? "left-7 bg-black" : "left-1 bg-zinc-400"
                                )}
                            />
                        </button>
                    </div>

                    {/* Gesture Control Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <Palette size={18} className="text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">Gesture Control</div>
                                <div className="text-xs text-zinc-500">Control teleprompter with hand gestures</div>
                            </div>
                        </div>
                        <button
                            onClick={() => onSettingsChange({ enableGestures: !settings.enableGestures })}
                            className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                settings.enableGestures ? "bg-white" : "bg-zinc-700"
                            )}
                        >
                            <motion.div
                                layout
                                className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full",
                                    settings.enableGestures ? "left-7 bg-black" : "left-1 bg-zinc-400"
                                )}
                            />
                        </button>
                    </div>

                    {/* Voice Scroll Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <Timer size={18} className="text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">Voice Scroll</div>
                                <div className="text-xs text-zinc-500">Control scroll speed with your voice</div>
                            </div>
                        </div>
                        <button
                            onClick={() => onSettingsChange({ enableVoiceScroll: !settings.enableVoiceScroll })}
                            className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                settings.enableVoiceScroll ? "bg-white" : "bg-zinc-700"
                            )}
                        >
                            <motion.div
                                layout
                                className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full",
                                    settings.enableVoiceScroll ? "left-7 bg-black" : "left-1 bg-zinc-400"
                                )}
                            />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/5 bg-white/2">
                    <p className="text-[10px] text-zinc-500 text-center">
                        Settings are automatically saved to your browser.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
