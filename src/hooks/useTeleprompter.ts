import { useState, useRef, useCallback, useEffect } from 'react';
import type { Settings } from '~/src/types';

const DEFAULT_SETTINGS: Settings = {
    scrollSpeed: 2.5,
    fontSize: 80,
    isMirrored: false,
    isPlaying: false,
    paddingX: 15,
    fontFamily: 'sans',
    theme: 'broadcast', // Default to Deep Navy
    useSmartPacing: true,
    enableWebcam: false,
    enableGestures: false,
    enableVoiceScroll: false,
    editorMood: 'creator',
    editorTextColor: '#d4d4d8',
};

export interface UseTeleprompterReturn {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    resetScroll: () => void;
    togglePlay: () => void;
    adjustSpeed: (delta: number) => void;
}

export function useTeleprompter(initialSettings?: Partial<Settings>): UseTeleprompterReturn {
    const [settings, setSettings] = useState<Settings>({
        ...DEFAULT_SETTINGS,
        ...initialSettings,
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const scrollAccumulatorRef = useRef(0);
    const lastFrameTimeRef = useRef(performance.now());

    const updateSettings = useCallback((newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const resetScroll = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
            scrollAccumulatorRef.current = 0;
            updateSettings({ isPlaying: false });
        }
    }, [updateSettings]);

    const togglePlay = useCallback(() => {
        updateSettings({ isPlaying: !settings.isPlaying });
    }, [settings.isPlaying, updateSettings]);

    const adjustSpeed = useCallback((delta: number) => {
        updateSettings({
            scrollSpeed: Math.max(0.5, Math.min(20, settings.scrollSpeed + delta))
        });
    }, [settings.scrollSpeed, updateSettings]);

    // Animation loop using RAF
    useEffect(() => {
        const animate = (time: number) => {
            const deltaTime = time - lastFrameTimeRef.current;
            lastFrameTimeRef.current = time;

            if (settings.isPlaying && scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const { scrollTop, scrollHeight, clientHeight } = container;

                // Calculate pixels to scroll based on speed and delta time
                const pixelsToScroll = settings.scrollSpeed * (deltaTime / 16.67);
                scrollAccumulatorRef.current += pixelsToScroll;

                const integerMove = Math.floor(scrollAccumulatorRef.current);

                if (integerMove > 0) {
                    container.scrollTop += integerMove;
                    scrollAccumulatorRef.current -= integerMove;
                }

                // Auto-stop at end
                if (scrollHeight - (scrollTop + clientHeight) <= 1) {
                    updateSettings({ isPlaying: false });
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [settings.isPlaying, settings.scrollSpeed, updateSettings]);

    return {
        settings,
        updateSettings,
        scrollContainerRef,
        resetScroll,
        togglePlay,
        adjustSpeed,
    };
}

export default useTeleprompter;
