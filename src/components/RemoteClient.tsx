import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Plus, Minus, RotateCcw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '~/src/components/ui/button';
import { usePeerConnection } from '~/src/hooks/usePeerConnection';

interface RemoteClientProps {
    roomId: string;
}

export const RemoteClient: React.FC<RemoteClientProps> = ({ roomId }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(2.5);
    const [isConnecting, setIsConnecting] = useState(true);

    const { state, error, connectToHost, disconnect, sendMessage } = usePeerConnection();

    // Connect to host on mount
    useEffect(() => {
        setIsConnecting(true);
        connectToHost(roomId)
            .then(() => setIsConnecting(false))
            .catch(() => setIsConnecting(false));

        return () => {
            disconnect();
        };
    }, [roomId, connectToHost, disconnect]);

    const handlePlayPause = () => {
        const newState = !isPlaying;
        setIsPlaying(newState);
        sendMessage({ type: 'SET_PLAYING', payload: newState });
    };

    const handleSpeedChange = (delta: number) => {
        const newSpeed = Math.max(0.5, Math.min(20, speed + delta));
        setSpeed(newSpeed);
        sendMessage({ type: 'SET_SPEED', payload: newSpeed });
    };

    const handleReset = () => {
        setIsPlaying(false);
        sendMessage({ type: 'RESET_SCROLL', payload: true });
    };

    // Show connecting state
    if (isConnecting) {
        return (
            <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Connecting...</h1>
                <p className="text-muted-foreground">Connecting to room {roomId}</p>
            </div>
        );
    }

    // Show error state
    if (error || !state.isConnected) {
        return (
            <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center p-6 text-center">
                <WifiOff className="w-12 h-12 text-destructive mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Connection Failed</h1>
                <p className="text-muted-foreground mb-6">{error || 'Could not connect to host'}</p>
                <Button onClick={() => window.location.reload()}>
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy-deep flex flex-col">
            {/* Header */}
            <header className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wifi className="text-green-500" size={18} />
                    <span className="text-sm text-green-500">Connected</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                    Room: {roomId}
                </div>
            </header>

            {/* Main Controls */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
                {/* Speed Display */}
                <div className="text-center">
                    <div className="text-6xl font-mono font-bold text-primary">
                        {speed.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Speed</div>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSpeedChange(-0.5)}
                        className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white active:bg-secondary/80"
                    >
                        <Minus size={32} />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSpeedChange(0.5)}
                        className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white active:bg-secondary/80"
                    >
                        <Plus size={32} />
                    </motion.button>
                </div>

                {/* Play/Pause Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayPause}
                    className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-colors ${isPlaying
                            ? 'bg-amber-500 text-black'
                            : 'bg-primary text-white'
                        }`}
                >
                    <AnimatePresence mode="wait">
                        {isPlaying ? (
                            <motion.div
                                key="pause"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Pause size={56} fill="currentColor" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="play"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Play size={56} fill="currentColor" className="ml-2" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Reset Button */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3 bg-secondary rounded-full text-muted-foreground"
                >
                    <RotateCcw size={20} />
                    <span>Reset</span>
                </motion.button>
            </main>

            {/* Footer */}
            <footer className="p-4 text-center text-xs text-muted-foreground border-t border-border">
                GOOD SCRIPT Remote
            </footer>
        </div>
    );
};

export default RemoteClient;
