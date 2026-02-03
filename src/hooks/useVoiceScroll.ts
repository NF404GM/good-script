import { useState, useEffect, useCallback, useRef } from 'react';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: Event) => void;
    onend: () => void;
    onstart: () => void;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export interface VoiceCommand {
    command: string;
    action: () => void;
}

export interface UseVoiceScrollReturn {
    isListening: boolean;
    isSupported: boolean;
    transcript: string;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
}

export interface UseVoiceScrollOptions {
    onStart?: () => void;
    onStop?: () => void;
    onFaster?: () => void;
    onSlower?: () => void;
    onReset?: () => void;
    language?: string;
}

export function useVoiceScroll(options: UseVoiceScrollOptions = {}): UseVoiceScrollReturn {
    const {
        onStart,
        onStop,
        onFaster,
        onSlower,
        onReset,
        language = 'en-US',
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check if Speech Recognition is supported
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Process voice command
    const processCommand = useCallback((text: string) => {
        const lowerText = text.toLowerCase().trim();

        // Check for commands
        if (lowerText.includes('start') || lowerText.includes('play') || lowerText.includes('go')) {
            onStart?.();
            return 'START';
        }
        if (lowerText.includes('stop') || lowerText.includes('pause') || lowerText.includes('hold')) {
            onStop?.();
            return 'STOP';
        }
        if (lowerText.includes('faster') || lowerText.includes('speed up') || lowerText.includes('quicker')) {
            onFaster?.();
            return 'FASTER';
        }
        if (lowerText.includes('slower') || lowerText.includes('slow down') || lowerText.includes('ease')) {
            onSlower?.();
            return 'SLOWER';
        }
        if (lowerText.includes('reset') || lowerText.includes('restart') || lowerText.includes('beginning')) {
            onReset?.();
            return 'RESET';
        }

        return null;
    }, [onStart, onStop, onFaster, onSlower, onReset]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognitionAPI();

        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            // Process final results for commands
            if (finalTranscript) {
                const command = processCommand(finalTranscript);
                if (command) {
                    setTranscript(`🎤 ${command}`);
                    // Clear after 1.5 seconds
                    setTimeout(() => setTranscript(''), 1500);
                } else {
                    setTranscript(finalTranscript);
                }
            } else if (interimTranscript) {
                setTranscript(interimTranscript);
            }
        };

        recognition.onerror = (event: Event) => {
            const errorEvent = event as unknown as { error: string };
            console.error('Speech recognition error:', errorEvent.error);

            if (errorEvent.error === 'not-allowed') {
                setError('Microphone access denied');
            } else if (errorEvent.error === 'no-speech') {
                // Ignore no-speech errors, just restart
            } else {
                setError(`Voice error: ${errorEvent.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);

            // Auto-restart if we were listening (unless explicitly stopped)
            if (recognitionRef.current && isListening) {
                restartTimeoutRef.current = setTimeout(() => {
                    try {
                        recognitionRef.current?.start();
                    } catch (e) {
                        console.log('Could not restart speech recognition');
                    }
                }, 100);
            }
        };

        return () => {
            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
            }
            recognition.abort();
        };
    }, [isSupported, language, processCommand, isListening]);

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition not supported in this browser');
            return;
        }

        setError(null);
        try {
            recognitionRef.current?.start();
        } catch (e) {
            // Already started, ignore
        }
    }, [isSupported]);

    const stopListening = useCallback(() => {
        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
        }
        setIsListening(false);
        recognitionRef.current?.stop();
        setTranscript('');
    }, []);

    return {
        isListening,
        isSupported,
        transcript,
        error,
        startListening,
        stopListening,
    };
}

export default useVoiceScroll;
