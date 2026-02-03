import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Maximize2, Minimize2, Move,
    FlipHorizontal, LayoutGrid, Monitor
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '~/src/lib/utils';

interface WebcamWindowProps {
    isActive: boolean;
    onClose?: () => void;
}

export const WebcamWindow: React.FC<WebcamWindowProps> = ({ isActive, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasError, setHasError] = useState(false);
    const [isMirrored, setIsMirrored] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isPiPActive, setIsPiPActive] = useState(false);

    // Window state
    const [size, setSize] = useState({ width: 320, height: 180 });
    const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 20 });

    // Initialize Webcam
    useEffect(() => {
        if (!isActive) return;

        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user',
                    },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setHasError(false);
                }
            } catch (err) {
                console.error('Failed to access webcam:', err);
                setHasError(true);
            }
        };

        startWebcam();

        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [isActive]);

    // Handle PiP
    const togglePiP = async () => {
        try {
            if (!videoRef.current) return;

            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiPActive(false);
            } else {
                await videoRef.current.requestPictureInPicture();
                setIsPiPActive(true);
            }
        } catch (err) {
            console.error('PiP failed:', err);
        }
    };

    // Preset positions
    const snapToCorner = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
        const padding = 20;
        switch (corner) {
            case 'tl': setPosition({ x: padding, y: padding }); break;
            case 'tr': setPosition({ x: window.innerWidth - size.width - padding, y: padding }); break;
            case 'bl': setPosition({ x: padding, y: window.innerHeight - size.height - padding }); break;
            case 'br': setPosition({ x: window.innerWidth - size.width - padding, y: window.innerHeight - size.height - padding }); break;
        }
    };

    if (!isActive) return null;

    return (
        <Rnd
            size={isMinimized ? { width: 48, height: 48 } : size}
            position={position}
            onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
            onResizeStop={(e, direction, ref, delta, position) => {
                setSize({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                });
                setPosition(position);
            }}
            minWidth={isMinimized ? 48 : 200}
            minHeight={isMinimized ? 48 : 112}
            bounds="window"
            dragHandleClassName="handle"
            className="z-50"
            lockAspectRatio={true}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "relative group h-full w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                    "bg-black/40 backdrop-blur-xl border border-white/10",
                    isMinimized ? "rounded-full" : "hover:border-white/20"
                )}
            >
                {/* Drag Handle Overlay */}
                <div className="handle absolute inset-0 z-10 cursor-move opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 flex items-start justify-center pt-2">
                    <Move className="text-white/40 w-4 h-4" />
                </div>

                {/* Video Feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                        "w-full h-full object-cover transition-transform duration-500",
                        isMirrored && "scale-x-[-1]",
                        isMinimized && "opacity-0"
                    )}
                />

                {/* Minimized Icon */}
                {isMinimized && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10">
                        <Monitor className="text-white w-6 h-6" />
                    </div>
                )}

                {/* Controls Overlay */}
                {!isMinimized && (
                    <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/5"
                                onClick={() => setIsMinimized(true)}
                            >
                                <Minimize2 size={14} />
                            </Button>
                        </div>

                        <div className="flex gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/5"
                                onClick={togglePiP}
                            >
                                <LayoutGrid size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/5"
                                onClick={() => setIsMirrored(!isMirrored)}
                            >
                                <FlipHorizontal size={14} />
                            </Button>
                            {onClose && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-red-500/80 hover:bg-red-600 text-white border border-white/5"
                                    onClick={onClose}
                                >
                                    <X size={14} />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Corner Presets Overlay */}
                {!isMinimized && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(['tl', 'tr', 'bl', 'br'] as const).map(corner => (
                            <button
                                key={corner}
                                onClick={() => snapToCorner(corner)}
                                className="w-5 h-5 rounded-sm border border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center text-[8px] font-bold text-white/60"
                            >
                                {corner.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 z-30">
                        <p className="text-white/60 text-[10px] text-center px-4">
                            Camera unavailable
                        </p>
                    </div>
                )}

                {/* Restoration click when minimized */}
                {isMinimized && (
                    <button
                        className="absolute inset-0 z-40"
                        onClick={() => setIsMinimized(false)}
                        title="Restore camera window"
                    />
                )}
            </motion.div>
        </Rnd>
    );
};

export default WebcamWindow;
