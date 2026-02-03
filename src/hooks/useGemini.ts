import { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

const apiKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL_NAME = 'gemini-2.0-flash';

export interface UseGeminiReturn {
    generateScript: (topic: string) => Promise<string>;
    improveScript: (text: string) => Promise<string>;
    refineSelection: (selectedText: string) => Promise<string>;
    autoPaceScript: (text: string, targetDuration: string) => Promise<string>;
    isLoading: boolean;
    error: string | null;
}

export function useGemini(): UseGeminiReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateScript = useCallback(async (topic: string): Promise<string> => {
        if (!ai) throw new Error("API Key is missing");
        setIsLoading(true);
        setError(null);

        try {
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Write a professional video script about the following topic. Keep it engaging, concise, and suitable for a teleprompter reading (avoid stage directions if possible, focus on spoken text).
        
        Topic: ${topic}`,
                config: {
                    systemInstruction: "You are a professional scriptwriter for video content creators.",
                }
            });

            return response.text || "Failed to generate script.";
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate script";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const improveScript = useCallback(async (currentScript: string): Promise<string> => {
        if (!ai) throw new Error("API Key is missing");
        setIsLoading(true);
        setError(null);

        try {
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Improve the following script. Fix grammar, improve flow for reading aloud, and make it sound more natural. Do not remove the core meaning. Return ONLY the improved text.
        
        Script:
        ${currentScript}`,
                config: {
                    systemInstruction: "You are an expert editor for broadcast teleprompters.",
                }
            });

            return response.text || currentScript;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to improve script";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refineSelection = useCallback(async (selectedText: string): Promise<string> => {
        if (!ai) throw new Error("API Key is missing");
        setIsLoading(true);
        setError(null);

        try {
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Refine and improve this selected text for better delivery when reading aloud. Make it more engaging, fix any issues, but keep the same meaning and approximate length. Return ONLY the refined text, nothing else.

        Selected text: "${selectedText}"`,
                config: {
                    systemInstruction: "You are a teleprompter text optimizer. Keep responses concise.",
                }
            });

            return response.text?.trim() || selectedText;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to refine text";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const autoPaceScript = useCallback(async (currentScript: string, targetDuration: string): Promise<string> => {
        if (!ai) throw new Error("API Key is missing");
        setIsLoading(true);
        setError(null);

        try {
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: `Analyze this script for optimal delivery flow and pacing.
        Target Duration: ${targetDuration}.
        
        Task: Insert timestamp markers [mm:ss] throughout the text to guide the reading speed to match the target duration exactly.
        
        Rules:
        1. Start with [00:00] at the very top.
        2. Analyze the context:
           - Place markers further apart for dense, fast-paced sections.
           - Place markers closer together for sections requiring emphasis.
        3. PRESERVE all existing stage directions in parentheses (...) and section headers in brackets [...]. Do not remove them.
        4. Place timestamps strategically around these cues to allow time for the action to happen if needed.
        5. Return the full script with markers inserted.
        
        Script:
        ${currentScript}`,
                config: {
                    systemInstruction: "You are a teleprompter technical director. You preserve all script metadata (cues, headers) while adding precise timing data.",
                }
            });

            return response.text || currentScript;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to auto-pace script";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        generateScript,
        improveScript,
        refineSelection,
        autoPaceScript,
        isLoading,
        error,
    };
}

export default useGemini;
