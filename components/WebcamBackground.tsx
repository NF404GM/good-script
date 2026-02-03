import React, { useEffect, useRef, useState } from 'react';

interface WebcamBackgroundProps {
    isActive: boolean;
}

export const WebcamBackground: React.FC<WebcamBackgroundProps> = ({ isActive }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isActive) {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
            return;
        }

        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.error("Webcam access denied", e);
                setError(true);
            }
        };

        startWebcam();

        return () => {
             // Cleanup on unmount
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, [isActive]);

    if (!isActive) return null;
    if (error) return <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-0 text-red-500">Camera Unavailable</div>;

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
             <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover opacity-50 grayscale-[20%]"
             />
             <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>
    );
};