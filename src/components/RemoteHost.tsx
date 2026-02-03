import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, WifiOff, X, Users, Copy, Check } from 'lucide-react';
import { Button } from '~/src/components/ui/button';
import { cn } from '~/src/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/src/components/ui/dialog';
import { usePeerConnection } from '~/src/hooks/usePeerConnection';
import type { Settings, PeerMessage } from '~/src/types';

interface RemoteHostProps {
    settings: Settings;
    onSettingsChange: (settings: Partial<Settings>) => void;
    onResetScroll: () => void;
    trigger?: React.ReactNode;
}

export const RemoteHost: React.FC<RemoteHostProps> = ({
    settings,
    onSettingsChange,
    onResetScroll,
    trigger,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const { state, roomId, error, startHost, stopHost, onMessage } = usePeerConnection();

    // Start hosting when dialog opens (only if not already connected)
    useEffect(() => {
        if (isOpen && !state.isConnected) {
            startHost().catch(console.error);
        }
    }, [isOpen, state.isConnected, startHost]);

    // PREVIOUSLY: Stop hosting when dialog closes
    // REMOVED to persist connection when user goes back to read script

    // Handle incoming messages from remote
    useEffect(() => {
        onMessage((message: PeerMessage) => {
            switch (message.type) {
                case 'SET_PLAYING':
                    onSettingsChange({ isPlaying: message.payload as boolean });
                    break;
                case 'SET_SPEED':
                    onSettingsChange({ scrollSpeed: message.payload as number });
                    break;
                case 'SET_FONT_SIZE':
                    onSettingsChange({ fontSize: message.payload as number });
                    break;
                case 'SET_DIRECTION':
                    onSettingsChange({ playbackDirection: message.payload as 'forward' | 'reverse' });
                    break;
                case 'RESET_SCROLL':
                    onResetScroll();
                    break;
            }
        });
    }, [onMessage, onSettingsChange, onResetScroll]);

    const handleCopyCode = async () => {
        if (roomId) {
            await navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const [manualIp, setManualIp] = useState('192.168.12.122');

    // Generate QR code URL for the remote control page
    const remoteUrl = roomId
        ? manualIp
            ? `http://${manualIp}:3000/?remote=${roomId}`
            : `${window.location.origin}/?remote=${roomId}`
        : '';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "rounded-full transition-all duration-300",
                            state.isConnected ? "text-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-500/20" : ""
                        )}
                        title="Phone Remote"
                    >
                        <Smartphone size={20} />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <Smartphone size={16} />
                        Phone Remote Control
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center py-6 space-y-6">
                    {/* Connection Status */}
                    <div className="flex items-center justify-between w-full px-4">
                        <div className="flex items-center gap-2">
                            {state.isConnected ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Session Active</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Offline</span>
                                </>
                            )}
                        </div>

                        {state.isConnected && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    stopHost();
                                    setIsOpen(false);
                                }}
                                className="text-[10px] text-destructive hover:bg-destructive/10 h-7 px-2 rounded-lg"
                            >
                                <X size={12} className="mr-1" />
                                End Session
                            </Button>
                        )}
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* QR Code */}
                    {state.isConnected && roomId && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="p-4 bg-white rounded-2xl shadow-lg">
                                <QRCodeSVG
                                    value={remoteUrl}
                                    size={180}
                                    level="M"
                                    includeMargin={false}
                                />
                            </div>

                            <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                                Scan with your phone's camera to open the remote control
                            </p>

                            {/* Show the actual URL for debugging */}
                            <div className="text-[10px] text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2 max-w-full overflow-hidden">
                                <span className="text-zinc-400">URL: </span>
                                <span className="break-all">{remoteUrl}</span>
                            </div>

                            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                                <div className="space-y-4 w-full max-w-[280px]">
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                                        <p className="text-xs text-amber-500 font-bold mb-2">📡 Localhost Detected</p>
                                        <p className="text-[10px] text-zinc-400 mb-3">
                                            Your phone needs your computer's <b>Network IP</b>. Enter it below to update the QR code:
                                        </p>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="e.g. 192.168.1.10"
                                                value={manualIp}
                                                onChange={(e) => setManualIp(e.target.value)}
                                                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-center flex-1 font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                                            />
                                        </div>
                                        <p className="text-[9px] text-zinc-500">
                                            Your IP is likely: <b className="text-zinc-300">192.168.12.122</b>
                                        </p>
                                    </div>

                                    <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl text-left">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">🛑 Getting "Timed Out"?</p>
                                        <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
                                            Windows Firewall often blocks connections to development servers.
                                        </p>
                                        <div className="space-y-2">
                                            <p className="text-[9px] text-zinc-400">Run this in <b>PowerShell (Admin)</b> to fix:</p>
                                            <code className="text-[9px] bg-black p-2 rounded block break-all text-amber-500/80 font-mono">
                                                New-NetFirewallRule -DisplayName "Vite GoodScript" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Room Code */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Connect with Code</span>
                                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
                                    <span className="font-mono text-2xl font-bold tracking-widest text-primary">
                                        {roomId}
                                    </span>
                                    <button
                                        onClick={handleCopyCode}
                                        className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                                        title="Copy code"
                                    >
                                        {copied ? (
                                            <Check size={16} className="text-green-500" />
                                        ) : (
                                            <Copy size={16} className="text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Connected Clients Counter */}
                    {state.clientCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-sm text-green-500"
                        >
                            <Users size={16} />
                            <span>{state.clientCount} device{state.clientCount > 1 ? 's' : ''} connected</span>
                        </motion.div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RemoteHost;
