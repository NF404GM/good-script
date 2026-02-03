import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Plus, Minus, RotateCcw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '~/src/components/ui/button';
import { cn } from '~/src/lib/utils';
import { usePeerConnection } from '~/src/hooks/usePeerConnection';
import { onLogUpdate, clearLogs } from '~/src/utils/mobileLogger';

interface RemoteClientProps {
    roomId: string;
}

const DebugOverlay: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = onLogUpdate(setLogs);
        return () => { unsubscribe(); };
    }, []);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="mt-8 text-[10px] text-zinc-600 uppercase tracking-widest hover:text-zinc-400"
            >
                Show Debug Logs
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/95 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-400">MOBILE DEBUG LOG</h3>
                <div className="flex gap-2">
                    <button onClick={clearLogs} className="text-[10px] bg-zinc-800 px-2 py-1 rounded">Clear</button>
                    <button onClick={() => setIsVisible(false)} className="text-[10px] bg-primary px-2 py-1 rounded text-white font-bold">Close</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto font-mono text-[9px] text-zinc-300 space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className={`p-1 rounded ${log.type === 'error' ? 'bg-red-500/20 text-red-400' :
                        log.type === 'warn' ? 'bg-amber-500/20 text-amber-400' : ''
                        }`}>
                        <span className="opacity-30 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        {log.message}
                    </div>
                ))}
                {logs.length === 0 && <div className="text-zinc-600 italic">No logs captured yet...</div>}
            </div>
        </div>
    );
};

export const RemoteClient: React.FC<RemoteClientProps> = ({ roomId: initialRoomId }) => {
    const [roomId, setRoomId] = useState(initialRoomId);
    const [manualRoomId, setManualRoomId] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(2.5);
    const [playbackDirection, setPlaybackDirection] = useState<'forward' | 'reverse'>('forward');
    const [isConnecting, setIsConnecting] = useState(!!initialRoomId);

    const { state, error, connectToHost, disconnect, sendMessage } = usePeerConnection();

    // Connect to host on mount with timeout
    useEffect(() => {
        if (!roomId || state.isConnected) return;

        console.log('Attempting to connect to room:', roomId);
        setIsConnecting(true);

        connectToHost(roomId)
            .then(() => {
                console.log('Connect promise resolved successfully');
                setIsConnecting(false);
            })
            .catch((err) => {
                console.error('Connection failed:', err);
                setIsConnecting(false);
            });

        // Timeout if connection doesn't happen in 10s
        const timeout = setTimeout(() => {
            // We use a ref-style check or just rely on the next render
            // but for simplicity, we check if we're still connecting
            console.warn('Connection timeout check...');
            setIsConnecting(false);
        }, 10000);

        return () => {
            console.log('Cleaning up connection effect (disconnecting)...');
            clearTimeout(timeout);
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

    const handleDirectionToggle = () => {
        const nextDir = playbackDirection === 'forward' ? 'reverse' : 'forward';
        setPlaybackDirection(nextDir);
        sendMessage({ type: 'SET_DIRECTION', payload: nextDir });
    };

    const handleReset = () => {
        setIsPlaying(false);
        setPlaybackDirection('forward');
        sendMessage({ type: 'RESET_SCROLL', payload: true });
    };

    // Show enter code state if no roomId
    if (!roomId) {
        return (
            <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center p-6 text-center">
                <Wifi className="w-12 h-12 text-primary mb-6 opacity-20" />
                <h1 className="text-xl font-bold text-white mb-2">Connect to Laptop</h1>
                <p className="text-muted-foreground mb-8 text-sm">
                    Enter the 4-character code shown on your laptop screen.
                </p>

                <div className="w-full max-w-xs space-y-4">
                    <input
                        type="text"
                        placeholder="ABCD"
                        maxLength={4}
                        value={manualRoomId}
                        onChange={(e) => setManualRoomId(e.target.value.toUpperCase())}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-primary focus:bg-white/10"
                    />
                    <Button
                        disabled={manualRoomId.length !== 4}
                        onClick={() => {
                            setRoomId(manualRoomId);
                            setIsConnecting(true);
                        }}
                        className="w-full h-14 rounded-2xl bg-primary text-white font-bold"
                    >
                        Connect
                    </Button>
                </div>
            </div>
        );
    }

    // Show connecting state
    if (isConnecting) {
        return (
            <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Connecting...</h1>
                <p className="text-muted-foreground mb-1">Room: <span className="text-white font-mono">{roomId}</span></p>
                <button
                    onClick={() => setRoomId('')}
                    className="text-xs text-primary mt-4 hover:underline"
                >
                    Change Room
                </button>
            </div>
        );
    }

    // Show error state
    if (error || (!isConnecting && !state.isConnected)) {
        return (
            <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center p-6 text-center">
                <WifiOff className="w-12 h-12 text-destructive mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Connection Failed</h1>
                <p className="text-muted-foreground mb-6 text-sm">
                    {error || 'Could not connect to host. Make sure your laptop and phone are on the same Wi-Fi network.'}
                </p>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left space-y-3 w-full max-w-xs text-xs">
                    <h2 className="font-bold uppercase tracking-wider text-zinc-400">Troubleshooting</h2>
                    <ul className="text-zinc-500 space-y-2 list-disc pl-4">
                        <li>Check if the Laptop is still hosting</li>
                        <li>Ensure both devices are on the same Wi-Fi</li>
                        <li>Is your Laptop using <b>"localhost"</b>? Try entering its Network IP in the Laptop's remote settings.</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full h-12 rounded-xl bg-white text-black font-bold"
                    >
                        Retry Connection
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setRoomId('')}
                        className="w-full h-12 rounded-xl text-white font-medium"
                    >
                        Enter Manual Code
                    </Button>
                </div>

                <DebugOverlay />
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
                <div className="flex flex-col items-center gap-6">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDirectionToggle}
                        className={cn(
                            "w-12 h-12 rounded-full border flex items-center justify-center transition-all",
                            playbackDirection === 'reverse'
                                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                : 'bg-white/5 border-white/10 text-zinc-500'
                        )}
                        title={playbackDirection === 'forward' ? 'Scroll: Down' : 'Scroll: Up'}
                    >
                        <motion.div
                            animate={{ rotate: playbackDirection === 'reverse' ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Plus size={24} className="rotate-45" />
                        </motion.div>
                    </motion.button>

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
                </div>

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
