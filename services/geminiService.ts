import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-3-flash-preview';

export const generateScript = async (topic: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

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
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    throw error;
  }
};

export const improveScript = async (currentScript: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

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
  } catch (error) {
    console.error("Gemini Improve Error:", error);
    throw error;
  }
};

export const autoPaceScript = async (currentScript: string, targetDuration: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

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
  } catch (error) {
    console.error("Gemini Auto-Pace Error:", error);
    throw error;
  }
};