import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { cn } from '~/src/lib/utils';

interface SessionTimerProps {
    className?: string;
    isCompact?: boolean;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ className, isCompact = false }) => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning]);

    const formatTime = useCallback((totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setSeconds(0);
    };

    if (isCompact) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10",
                    className
                )}
            >
                <Timer size={14} className="text-white/60" />
                <span className="font-mono text-sm font-bold text-white tabular-nums">
                    {formatTime(seconds)}
                </span>
                <button
                    onClick={toggleTimer}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                    {isRunning ? <Pause size={12} className="text-white" /> : <Play size={12} className="text-white" />}
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl",
                className
            )}
        >
            <AnimatePresence mode="wait">
                <motion.span
                    key={seconds}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="font-mono text-2xl font-black text-white tabular-nums tracking-tight"
                >
                    {formatTime(seconds)}
                </motion.span>
            </AnimatePresence>

            <div className="flex items-center gap-1">
                <button
                    onClick={toggleTimer}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isRunning
                            ? "bg-white/10 hover:bg-white/20 text-white"
                            : "bg-white text-black hover:bg-zinc-200"
                    )}
                >
                    {isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                </button>
                <button
                    onClick={resetTimer}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Progress pulse indicator */}
            {isRunning && (
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                />
            )}
        </motion.div>
    );
};
