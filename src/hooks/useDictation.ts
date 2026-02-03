import { useState, useRef, useEffect, useCallback } from 'react';

export const useDictation = (onResult: (text: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Keep listening
            recognitionRef.current.interimResults = false; // Only finalize for now to avoid editor jitter
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    // Normalize spacing
                    const cleanText = finalTranscript.trim();
                    if (cleanText) {
                        onResult(cleanText + ' ');
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setError(event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                // If we didn't manually stop, this might be silence timeout.
                // We'll sync state to false.
                setIsListening(false);
            };
        } else {
            setError('Browser not supported');
        }
    }, []); // Init once

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setError(null);
            } catch (e) {
                console.error(e);
            }
        }
    }, [isListening]);

    return {
        isListening,
        toggleListening,
        error,
        supported: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    };
};
