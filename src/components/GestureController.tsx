import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGestureControl } from '~/src/hooks/useGestureControl';
import { Hand } from 'lucide-react';

interface GestureControllerProps {
    isActive: boolean;
    onPinchStart?: () => void;
    onPinchEnd?: () => void;
    onSpeedChange?: (speed: number) => void;
    baseSpeed?: number;
}

export const GestureController: React.FC<GestureControllerProps> = ({
    isActive,
    onPinchStart,
    onPinchEnd,
    onSpeedChange,
    baseSpeed = 2.5,
}) => {
    const { gestureState, videoRef, canvasRef, start, stop, isSupported } = useGestureControl({
        onPinchStart,
        onPinchEnd,
        onHandMove: (y) => {
            // Map Y position (0-1) to speed multiplier (0.5x to 3x)
            if (gestureState.isPinching && onSpeedChange) {
                const speedMultiplier = 0.5 + (y * 2.5);
                onSpeedChange(baseSpeed * speedMultiplier);
            }
        },
    });

    useEffect(() => {
        if (isActive && isSupported) {
            start();
        } else {
            stop();
        }
    }, [isActive, isSupported, start, stop]);

    if (!isSupported) {
        return null;
    }

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-4 right-4 z-50"
                >
                    {/* Hidden video element for camera input */}
                    <video
                        ref={videoRef}
                        className="hidden"
                        autoPlay
                        playsInline
                        muted
                    />

                    {/* Gesture feedback window */}
                    <div className="relative w-40 h-32 rounded-xl overflow-hidden bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl">
                        {/* Canvas for hand overlay */}
                        <canvas
                            ref={canvasRef}
                            width={320}
                            height={240}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }} // Mirror for natural feel
                        />

                        {/* Status indicator */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${gestureState.isTracking
                                    ? gestureState.isPinching
                                        ? 'bg-green-400 animate-pulse'
                                        : 'bg-yellow-400'
                                    : 'bg-red-400'
                                }`} />
                            <span className="text-[10px] font-medium text-white/80">
                                {gestureState.isTracking
                                    ? gestureState.isPinching
                                        ? 'PINCHING'
                                        : 'TRACKING'
                                    : 'NO HAND'
                                }
                            </span>
                        </div>

                        {/* Hand icon when no hand detected */}
                        {!gestureState.isTracking && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Hand className="w-8 h-8 text-white/30" />
                            </div>
                        )}

                        {/* Speed indicator when pinching */}
                        {gestureState.isPinching && gestureState.handY !== null && (
                            <div className="absolute bottom-2 left-2 right-2">
                                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-400 rounded-full transition-all duration-100"
                                        style={{ width: `${gestureState.handY * 100}%` }}
                                    />
                                </div>
                                <span className="text-[8px] text-white/60 mt-0.5 block text-center">
                                    {(0.5 + gestureState.handY * 2.5).toFixed(1)}x speed
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Instructions tooltip */}
                    <div className="mt-2 text-center text-[10px] text-white/50 bg-black/50 rounded-lg px-2 py-1">
                        Pinch to control • Move up/down for speed
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GestureController;
