import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioVisualizerProps {
    isActive: boolean;
    className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        if (!isActive) {
            // Cleanup when deactivated
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            setHasPermission(false);
            return;
        }

        let audioContext: AudioContext | null = null;

        const initAudio = async () => {
            try {
                // Request microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                setHasPermission(true);

                // Create audio context and analyser
                audioContext = new AudioContext();
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();

                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.8;

                source.connect(analyser);
                analyserRef.current = analyser;

                // Start visualization
                draw();
            } catch (err) {
                console.error('Audio visualizer error:', err);
                setHasPermission(false);
            }
        };

        const draw = () => {
            const canvas = canvasRef.current;
            const analyser = analyserRef.current;

            if (!canvas || !analyser) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const render = () => {
                animationRef.current = requestAnimationFrame(render);

                analyser.getByteFrequencyData(dataArray);

                const width = canvas.width;
                const height = canvas.height;

                // Clear canvas with transparency
                ctx.clearRect(0, 0, width, height);

                // Draw waveform bars
                const barWidth = (width / bufferLength) * 2.5;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * height;

                    // Monochromatic white with intensity matching frequency
                    const intensity = (dataArray[i] / 255) * 0.5 + 0.3;
                    ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;

                    // Draw bar from bottom
                    ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

                    x += barWidth;
                }
            };

            render();
        };

        initAudio();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContext) {
                audioContext.close();
            }
        };
    }, [isActive]);

    // Resize canvas to match container
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = canvas.offsetWidth * window.devicePixelRatio;
                canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className={`pointer-events-none ${className}`}
                >
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        style={{
                            imageRendering: 'pixelated',
                            mixBlendMode: 'screen'
                        }}
                    />
                    {!hasPermission && isActive && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
                            Requesting mic access...
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AudioVisualizer;
