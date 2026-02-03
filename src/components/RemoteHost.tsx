import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, WifiOff, X, Users, Copy, Check } from 'lucide-react';
import { Button } from '~/src/components/ui/button';
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

    // Start hosting when dialog opens
    useEffect(() => {
        if (isOpen && !state.isConnected) {
            startHost().catch(console.error);
        }
    }, [isOpen, state.isConnected, startHost]);

    // Stop hosting when dialog closes
    useEffect(() => {
        if (!isOpen && state.isConnected) {
            stopHost();
        }
    }, [isOpen, state.isConnected, stopHost]);

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

    // Generate QR code URL for the remote control page
    const remoteUrl = roomId
        ? `${window.location.origin}/?remote=${roomId}`
        : '';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="rounded-full" title="Phone Remote">
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
                    <div className="flex items-center gap-2">
                        {state.isConnected ? (
                            <>
                                <Wifi className="text-green-500" size={20} />
                                <span className="text-sm text-green-500">Ready for connections</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="text-muted-foreground" size={20} />
                                <span className="text-sm text-muted-foreground">Starting...</span>
                            </>
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

                            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                                    <p className="text-xs text-amber-500 font-bold mb-1">⚠️ Localhost Detected</p>
                                    <p className="text-[10px] text-zinc-400">
                                        Your phone cannot connect to "localhost".<br />
                                        Please open this app using your <strong>Network IP</strong> on this computer (check your terminal), then scan again.
                                    </p>
                                </div>
                            )}



                            {/* Room Code */}
                            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
                                <span className="text-xs text-muted-foreground">Code:</span>
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
