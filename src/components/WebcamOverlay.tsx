import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Maximize2, Minimize2, Move } from 'lucide-react';
import { cn } from '~/src/lib/utils';

interface WebcamOverlayProps {
    isEnabled: boolean;
    onToggle: () => void;
    className?: string;
}

export const WebcamOverlay: React.FC<WebcamOverlayProps> = ({
    isEnabled,
    onToggle,
    className
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (isEnabled && hasPermission !== false) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setHasPermission(true);
                    }
                })
                .catch(() => {
                    setHasPermission(false);
                });
        }

        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isEnabled]);

    if (!isEnabled) {
        return (
            <button
                onClick={onToggle}
                className={cn(
                    "fixed bottom-4 right-4 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all",
                    className
                )}
            >
                <Video size={20} className="text-white" />
            </button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                drag
                dragMomentum={false}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                style={{
                    position: 'fixed',
                    bottom: position.y,
                    right: position.x,
                    zIndex: 100,
                }}
                className={cn(
                    "rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black",
                    isMinimized ? "w-20 h-20" : "w-64 h-48",
                    isDragging && "cursor-grabbing",
                    className
                )}
            >
                {hasPermission === false ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <VideoOff size={24} className="text-zinc-500 mb-2" />
                        <span className="text-[10px] text-zinc-500">Camera blocked</span>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                )}

                {/* Controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <button
                            onClick={onToggle}
                            className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                        >
                            <VideoOff size={14} className="text-white" />
                        </button>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                {isMinimized ? <Maximize2 size={14} className="text-white" /> : <Minimize2 size={14} className="text-white" />}
                            </button>
                            <div className="p-2 rounded-lg bg-white/10 cursor-move">
                                <Move size={14} className="text-white/60" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recording indicator */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                    <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-red-500"
                    />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">Live</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
