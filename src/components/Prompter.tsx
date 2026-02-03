import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ControlBar } from './ControlBar';
import { WebcamWindow } from './WebcamWindow';
import { AudioVisualizer } from './AudioVisualizer';
import { GestureController } from './GestureController';
import { SettingsCapsule } from '~/src/components/SettingsCapsule';
import { useVoiceScroll } from '~/src/hooks/useVoiceScroll';
import type { Settings, Theme, FontFamily } from '~/src/types';

interface PrompterProps {
    text: string;
    onExit: () => void;
    initialSettings?: Partial<Settings>;
    onSettingsChange?: (settings: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
    scrollSpeed: 2.5,
    fontSize: 80,
    isMirrored: false,
    isPlaying: false,
    paddingX: 15,
    fontFamily: 'sans',
    theme: 'broadcast',
    useSmartPacing: true,
    enableWebcam: false,
    enableGestures: false,
    enableVoiceScroll: false,
    editorTextColor: '#ffffff',
    editorMood: 'creator',
    playbackDirection: 'forward',
};

export const Prompter: React.FC<PrompterProps> = ({
    text,
    onExit,
    initialSettings,
    onSettingsChange: externalSettingsChange,
}) => {
    const [settings, setSettings] = useState<Settings>({
        ...DEFAULT_SETTINGS,
        ...initialSettings,
    });

    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef<number | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const scrollAccumulatorRef = useRef(0);
    const markerNodesRef = useRef<HTMLElement[]>([]);

    // --- VOICE CONTROL ---
    const { isListening, transcript, startListening, stopListening, isSupported: isVoiceSupported } = useVoiceScroll({
        onStart: () => updateSettings({ isPlaying: true }),
        onStop: () => updateSettings({ isPlaying: false }),
        onFaster: () => updateSettings({ scrollSpeed: Math.min(settings.scrollSpeed + 0.5, 10) }),
        onSlower: () => updateSettings({ scrollSpeed: Math.max(settings.scrollSpeed - 0.5, 0.5) }),
        onReset: () => resetScroll(),
    });

    // Start/stop voice listening when setting changes
    useEffect(() => {
        if (settings.enableVoiceScroll && isVoiceSupported) {
            startListening();
        } else {
            stopListening();
        }
    }, [settings.enableVoiceScroll, isVoiceSupported, startListening, stopListening]);

    // --- AUTO HIDE CONTROLS LOGIC ---
    const handleActivity = useCallback(() => {
        setIsControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (settings.isPlaying) {
            controlsTimeoutRef.current = window.setTimeout(() => setIsControlsVisible(false), 2000);
        }
    }, [settings.isPlaying]);

    useEffect(() => {
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('keydown', handleActivity);
        handleActivity();
        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [handleActivity]);

    const updateSettings = useCallback((newSettings: Partial<Settings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            externalSettingsChange?.(newSettings);
            return updated;
        });
    }, [externalSettingsChange]);

    const resetScroll = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
            scrollAccumulatorRef.current = 0;
            updateSettings({ isPlaying: false });
            setIsControlsVisible(true);
        }
    }, [updateSettings]);

    const getThemeClasses = (theme: Theme) => {
        switch (theme) {
            case 'light': return 'bg-zinc-50 text-zinc-900';
            case 'high-contrast': return 'bg-black text-yellow-400';
            case 'broadcast': return 'bg-black text-white';
            case 'dark':
            default: return 'bg-black text-white';
        }
    };

    const getFontFamily = (font: FontFamily) => {
        switch (font) {
            case 'serif': return '"Playfair Display", serif';
            case 'mono': return '"Roboto Mono", monospace';
            case 'sans':
            default: return '"Inter", sans-serif';
        }
    };

    // Cache marker nodes
    useEffect(() => {
        if (scrollContainerRef.current) {
            markerNodesRef.current = Array.from(
                scrollContainerRef.current.querySelectorAll('[data-timestamp]')
            ) as HTMLElement[];
        }
    }, [text, settings.fontSize, settings.fontFamily, settings.paddingX]);

    // Animation Loop
    useEffect(() => {
        let lastFrameTime = performance.now();

        const animate = (time: number) => {
            const deltaTime = time - lastFrameTime;
            lastFrameTime = time;

            if (settings.isPlaying && scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const { scrollTop, scrollHeight, clientHeight } = container;

                let targetSpeed = settings.scrollSpeed;

                if (settings.useSmartPacing) {
                    const markers = markerNodesRef.current;
                    const nextMarker = markers.find(m => (m.offsetTop - clientHeight / 2) > scrollTop + 10);

                    if (nextMarker) {
                        const targetTime = parseInt(nextMarker.getAttribute('data-timestamp') || '0', 10);
                        const targetPixelPos = nextMarker.offsetTop - (clientHeight / 2);

                        const prevMarkerIndex = markers.indexOf(nextMarker) - 1;
                        const prevMarker = prevMarkerIndex >= 0 ? markers[prevMarkerIndex] : null;

                        const prevTime = prevMarker ? parseInt(prevMarker.getAttribute('data-timestamp') || '0', 10) : 0;
                        const prevPixelPos = prevMarker ? prevMarker.offsetTop - (clientHeight / 2) : 0;

                        const segmentPixels = targetPixelPos - prevPixelPos;
                        const segmentSeconds = targetTime - prevTime;

                        if (segmentSeconds > 0 && segmentPixels > 0) {
                            const idealPPS = segmentPixels / segmentSeconds;
                            const baseSpeed = idealPPS / 60;
                            targetSpeed = baseSpeed * 1.1;
                        }
                    }
                }

                const directionMultiplier = settings.playbackDirection === 'reverse' ? -1 : 1;
                const pixelsToScroll = targetSpeed * (deltaTime / 16.67) * directionMultiplier;
                scrollAccumulatorRef.current += pixelsToScroll;
                const integerMove = Math.trunc(scrollAccumulatorRef.current);

                if (Math.abs(integerMove) > 0) {
                    container.scrollTop += integerMove;
                    scrollAccumulatorRef.current -= integerMove;
                }

                if (settings.playbackDirection === 'forward' && scrollHeight - (scrollTop + clientHeight) <= 1) {
                    updateSettings({ isPlaying: false });
                    setIsControlsVisible(true);
                } else if (settings.playbackDirection === 'reverse' && scrollTop <= 0) {
                    updateSettings({ isPlaying: false });
                    setIsControlsVisible(true);
                }
            }
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [settings.isPlaying, settings.scrollSpeed, settings.useSmartPacing, settings.playbackDirection, updateSettings]);

    // Process HTML for timestamp markers
    const processedHtml = useMemo(() => {
        return text.replace(/\[(\d{1,2}:\d{2})\]/g, (match, timeStr) => {
            const [min, sec] = timeStr.split(':').map(Number);
            const totalSeconds = (min * 60) + sec;
            return `<span class="inline-flex items-center justify-center px-1.5 py-0.5 mx-2 text-[0.4em] align-middle rounded bg-white/10 text-white font-mono border border-white/20 select-none opacity-60" data-timestamp="${totalSeconds}">${match}</span>`;
        });
    }, [text]);

    return (
        <div
            className={`relative w-full h-full overflow-hidden flex flex-col transition-colors duration-500 ${getThemeClasses(settings.theme)} ${!isControlsVisible && settings.isPlaying ? 'cursor-none' : ''}`}
        >
            <WebcamWindow
                isActive={settings.enableWebcam}
                onClose={() => updateSettings({ enableWebcam: false })}
            />

            {/* Guides */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isControlsVisible ? 1 : 0.3 }}
                className="absolute top-1/2 left-0 -translate-y-1/2 z-30 pointer-events-none"
            >
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-red-500 border-b-[10px] border-b-transparent ml-4 drop-shadow-lg" />
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isControlsVisible ? 1 : 0.3 }}
                className="absolute top-1/2 right-0 -translate-y-1/2 z-30 pointer-events-none"
            >
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[16px] border-r-red-500 border-b-[10px] border-b-transparent mr-4 drop-shadow-lg" />
            </motion.div>
            <div className="absolute top-1/2 left-0 w-full z-20 pointer-events-none flex items-center justify-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            </div>

            {/* Gradients */}
            <div className={`absolute top-0 left-0 w-full h-1/4 z-10 pointer-events-none bg-gradient-to-b from-black via-black/40 to-transparent`} />
            <div className={`absolute bottom-0 left-0 w-full h-1/4 z-10 pointer-events-none bg-gradient-to-t from-black via-black/40 to-transparent`} />

            {/* --- SCROLL AREA --- */}
            <div
                ref={scrollContainerRef}
                className="flex-1 w-full overflow-y-auto no-scrollbar relative z-10"
                style={{ scrollBehavior: 'auto' }}
            >
                <div className="h-[50vh]" />

                {/* Studio-based font scale for Giant Font mode */}
                <div
                    className="max-w-[90%] md:max-w-[1400px] mx-auto transition-all duration-300 ease-in-out outline-none"
                    style={{
                        fontSize: `${settings.fontSize * (settings.editorMood === 'speech' ? 1.5 : 1)}px`,
                        paddingLeft: `${settings.paddingX}%`,
                        paddingRight: `${settings.paddingX}%`,
                        transform: settings.isMirrored ? 'scaleX(-1)' : 'none',
                        fontFamily: getFontFamily(settings.fontFamily),
                        fontWeight: settings.editorMood === 'speech' ? 900 : 700,
                        lineHeight: settings.editorMood === 'speech' ? 1.3 : 1.5,
                        textAlign: settings.isMirrored ? 'right' : 'left',
                        color: settings.editorTextColor,
                    }}
                >
                    <div
                        className="whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: processedHtml }}
                    />

                    {!text && (
                        <div className="h-40 flex items-center justify-center opacity-30 text-[0.3em]">
                            NO SCRIPT DATA
                        </div>
                    )}
                </div>

                <div className="h-[50vh]" />
            </div>

            <ControlBar
                settings={settings}
                updateSettings={updateSettings}
                onExit={onExit}
                onResetScroll={resetScroll}
                isVisible={isControlsVisible}
                onToggleVisibility={() => setIsControlsVisible(!isControlsVisible)}
            />

            {/* Audio Visualizer Overlay */}
            <AudioVisualizer
                isActive={settings.enableVoiceScroll && isListening}
                className="absolute bottom-24 left-0 w-full h-16 z-40"
            />

            {/* Voice Transcript Display */}
            <AnimatePresence>
                {settings.enableVoiceScroll && transcript && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium"
                    >
                        {transcript}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gesture Controller */}
            <GestureController
                isActive={settings.enableGestures && settings.enableWebcam}
                onPinchStart={() => updateSettings({ isPlaying: !settings.isPlaying })}
                onSpeedChange={(speed) => updateSettings({ scrollSpeed: speed })}
                baseSpeed={settings.scrollSpeed}
            />
        </div>
    );
};

export default Prompter;
