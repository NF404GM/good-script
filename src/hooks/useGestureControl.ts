import { useState, useEffect, useRef, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface GestureState {
    isPinching: boolean;
    handY: number | null; // 0-1 normalized Y position
    confidence: number;
    isTracking: boolean;
}

export interface UseGestureControlOptions {
    onPinchStart?: () => void;
    onPinchEnd?: () => void;
    onHandMove?: (y: number) => void;
    minConfidence?: number;
    pinchThreshold?: number;
}

export interface UseGestureControlReturn {
    gestureState: GestureState;
    isSupported: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    start: () => void;
    stop: () => void;
}

export function useGestureControl(options: UseGestureControlOptions = {}): UseGestureControlReturn {
    const {
        onPinchStart,
        onPinchEnd,
        onHandMove,
        minConfidence = 0.7,
        pinchThreshold = 0.08, // Distance between thumb and index tips
    } = options;

    const [gestureState, setGestureState] = useState<GestureState>({
        isPinching: false,
        handY: null,
        confidence: 0,
        isTracking: false,
    });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const handsRef = useRef<Hands | null>(null);
    const cameraRef = useRef<Camera | null>(null);
    const wasPinchingRef = useRef(false);
    const isRunningRef = useRef(false);

    const isSupported = typeof navigator !== 'undefined' &&
        'mediaDevices' in navigator &&
        'getUserMedia' in navigator.mediaDevices;

    // Calculate distance between two landmarks
    const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    // Process hand results
    const onResults = useCallback((results: Results) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Thumb tip (4) and index finger tip (8)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];

            // Middle of hand (wrist) for Y position
            const wrist = landmarks[0];

            const distance = getDistance(thumbTip, indexTip);
            const isPinching = distance < pinchThreshold;

            // Draw landmarks for visual feedback
            ctx.fillStyle = isPinching ? '#00ff00' : '#ff6600';
            landmarks.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Draw line between thumb and index
            ctx.strokeStyle = isPinching ? '#00ff00' : '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(thumbTip.x * canvas.width, thumbTip.y * canvas.height);
            ctx.lineTo(indexTip.x * canvas.width, indexTip.y * canvas.height);
            ctx.stroke();

            // Handle pinch state changes
            if (isPinching && !wasPinchingRef.current) {
                onPinchStart?.();
            } else if (!isPinching && wasPinchingRef.current) {
                onPinchEnd?.();
            }
            wasPinchingRef.current = isPinching;

            // Report hand Y position (inverted so up = faster)
            const normalizedY = 1 - wrist.y; // 0 = bottom, 1 = top
            onHandMove?.(normalizedY);

            setGestureState({
                isPinching,
                handY: normalizedY,
                confidence: minConfidence,
                isTracking: true,
            });
        } else {
            if (wasPinchingRef.current) {
                onPinchEnd?.();
                wasPinchingRef.current = false;
            }

            setGestureState({
                isPinching: false,
                handY: null,
                confidence: 0,
                isTracking: false,
            });
        }
    }, [onPinchStart, onPinchEnd, onHandMove, pinchThreshold, minConfidence]);

    const start = useCallback(async () => {
        if (!isSupported || isRunningRef.current) return;

        const video = videoRef.current;
        if (!video) return;

        isRunningRef.current = true;

        // Initialize MediaPipe Hands
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            },
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0, // 0 = lite, 1 = full
            minDetectionConfidence: minConfidence,
            minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        // Start camera
        const camera = new Camera(video, {
            onFrame: async () => {
                if (handsRef.current && video.readyState >= 2) {
                    await handsRef.current.send({ image: video });
                }
            },
            width: 320,
            height: 240,
        });

        await camera.start();
        cameraRef.current = camera;
    }, [isSupported, onResults, minConfidence]);

    const stop = useCallback(() => {
        isRunningRef.current = false;

        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }

        if (handsRef.current) {
            handsRef.current.close();
            handsRef.current = null;
        }

        setGestureState({
            isPinching: false,
            handY: null,
            confidence: 0,
            isTracking: false,
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return {
        gestureState,
        isSupported,
        videoRef,
        canvasRef,
        start,
        stop,
    };
}

export default useGestureControl;
