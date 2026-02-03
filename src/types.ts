// Core application types for V2 Broadcast Platform

export enum AppMode {
    EDITOR = 'EDITOR',
    PROMPTER = 'PROMPTER',
    REMOTE = 'REMOTE' // New: Phone remote control view
}

export type Theme = 'dark' | 'light' | 'high-contrast' | 'broadcast';
export type FontFamily = 'sans' | 'serif' | 'mono';

// Script data structure (Supabase compatible)
export interface Script {
    id: string;
    title: string;
    content: string; // HTML content from Tiptap
    lastModified: number;
    userId?: string; // For Supabase auth
    createdAt?: number;
}

export type Mood = 'calm' | 'confident' | 'urgent' | 'reflect' | 'e-ink';

// Teleprompter settings
export interface Settings {
    scrollSpeed: number;       // 0-20 (pixels per frame)
    fontSize: number;          // px
    isMirrored: boolean;
    isPlaying: boolean;
    paddingX: number;          // % of screen width
    fontFamily: FontFamily;
    theme: Theme;
    useSmartPacing: boolean;   // Toggle for timestamp logic
    enableWebcam: boolean;
    enableGestures: boolean;   // Phase C: MediaPipe
    enableVoiceScroll: boolean; // Phase C: Voice control
    editorTextColor: string;    // Custom color for script text
    editorMood: Mood;           // Emotional context for the editor
}

// Alias for backwards compatibility
export type PrompterSettings = Settings;

// Legacy type alias
export interface ScriptData extends Script { }

// PeerJS remote control messages
export interface PeerMessage {
    type: 'SET_PLAYING' | 'SET_SPEED' | 'RESET_SCROLL' | 'SET_FONT_SIZE';
    payload: boolean | number;
    timestamp: number;
}

// Remote control state
export interface RemoteState {
    isConnected: boolean;
    peerId: string | null;
    clientCount: number;
}

// Gesture detection state (Phase C)
export interface GestureState {
    isPinching: boolean;
    handY: number | null;
    confidence: number;
}

// Audio visualizer state (Phase C)
export interface AudioState {
    isListening: boolean;
    volume: number;
    transcript: string;
}
