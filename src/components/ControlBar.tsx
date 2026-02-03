import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Settings, X, RotateCcw, MonitorSmartphone, Minus, Plus, Camera, Smartphone } from 'lucide-react';
import { SettingsCapsule } from '~/src/components/SettingsCapsule';
import { RemoteHost } from '~/src/components/RemoteHost';
import { cn } from '~/src/lib/utils';
import type { Settings as SettingsType } from '~/src/types';

interface ControlBarProps {
    settings: SettingsType;
    updateSettings: (newSettings: Partial<SettingsType>) => void;
    onExit: () => void;
    onResetScroll: () => void;
    isVisible: boolean;
    onToggleVisibility: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
    settings,
    updateSettings,
    onExit,
    onResetScroll,
    isVisible,
    onToggleVisibility,
}) => {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4"
        >
            {/* --- MAIN CAPSULE BAR --- */}
            <div className="flex items-center p-1.5 bg-card/90 backdrop-blur-xl border border-border rounded-full shadow-2xl select-none">
                {/* Speed Controls */}
                <div className="flex items-center gap-1 pl-3 pr-2 border-r border-border">
                    <button
                        onClick={() => updateSettings({ scrollSpeed: Math.max(0.5, settings.scrollSpeed - 0.5) })}
                        className="p-2 text-muted-foreground hover:text-white hover:bg-secondary rounded-full transition-colors"
                    >
                        <Minus size={16} />
                    </button>
                    <div className="w-12 text-center font-mono text-sm font-bold text-white">
                        {settings.scrollSpeed.toFixed(1)}
                    </div>
                    <button
                        onClick={() => updateSettings({ scrollSpeed: Math.min(20, settings.scrollSpeed + 0.5) })}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Play/Pause Button */}
                <div className="px-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSettings({ isPlaying: !settings.isPlaying })}
                        className={cn(
                            "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all",
                            settings.isPlaying
                                ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                                : 'bg-white text-black hover:bg-zinc-200'
                        )}
                    >
                        {settings.isPlaying ? (
                            <Pause fill="currentColor" size={24} />
                        ) : (
                            <Play fill="currentColor" size={24} className="ml-1" />
                        )}
                    </motion.button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-1 pr-1 border-l border-border pl-2">
                    {/* Settings Capsule */}
                    <SettingsCapsule
                        settings={settings}
                        onSettingsChange={updateSettings}
                        trigger={
                            <button
                                className="p-3 rounded-full transition-colors text-muted-foreground hover:text-white hover:bg-secondary"
                                title="Settings"
                            >
                                <Settings size={20} />
                            </button>
                        }
                    />

                    {/* Webcam Toggle */}
                    <button
                        onClick={() => updateSettings({ enableWebcam: !settings.enableWebcam })}
                        className={`p-3 rounded-full transition-colors ${settings.enableWebcam
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-white hover:bg-secondary'
                            }`}
                        title="Toggle Webcam"
                    >
                        <Camera size={20} />
                    </button>

                    {/* Mirror Toggle */}
                    <button
                        onClick={() => updateSettings({ isMirrored: !settings.isMirrored })}
                        className={`p-3 rounded-full transition-colors ${settings.isMirrored
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-white hover:bg-secondary'
                            }`}
                        title="Mirror Display"
                    >
                        <MonitorSmartphone size={20} className={settings.isMirrored ? "scale-x-[-1]" : ""} />
                    </button>

                    {/* Reset */}
                    <button
                        onClick={onResetScroll}
                        className="p-3 text-muted-foreground hover:text-white hover:bg-secondary rounded-full transition-colors"
                        title="Reset to Top"
                    >
                        <RotateCcw size={20} />
                    </button>

                    {/* Phone Remote */}
                    <RemoteHost
                        settings={settings}
                        onSettingsChange={updateSettings}
                        onResetScroll={onResetScroll}
                        trigger={
                            <button
                                className="p-3 rounded-full transition-colors text-muted-foreground hover:text-white hover:bg-secondary"
                                title="Phone Remote Control"
                            >
                                <Smartphone size={20} />
                            </button>
                        }
                    />

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Exit */}
                    <button
                        onClick={onExit}
                        className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        title="Exit"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ControlBar;
