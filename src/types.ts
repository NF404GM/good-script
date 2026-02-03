// Core application types for V2 Broadcast Platform

export enum AppMode {
    EDITOR = 'EDITOR',
    PROMPTER = 'PROMPTER',
    REMOTE = 'REMOTE' // New: Phone remote control view
}

export type Theme = 'dark' | 'light' | 'high-contrast' | 'broadcast';
export type FontFamily = 'sans' | 'serif' | 'mono';

// Character profile for the Character Bible
export interface Character {
    id: string;
    name: string;
    description: string;
    traits: string[];
    color: string;
    age?: string;
    role?: string; // Main, Supporting, etc.
}

// Scene for the Kanban board
export interface Scene {
    id: string;
    title: string;
    content: string; // HTML for this specific scene
    summary?: string;
    characters?: Character[]; // Characters present in this scene
    type?: 'action' | 'dialogue' | 'transition' | 'setup'; // For color-coding
    status?: 'draft' | 'final' | 'review';
}

// Script data structure (Supabase compatible)
export interface Script {
    id: string;
    title: string;
    content: string; // HTML content from Tiptap
    lastModified: number;
    userId?: string; // For Supabase auth
    createdAt?: number;
    characters?: Character[]; // New: Linked characters
    tags?: string[]; // Genre, status, etc.
}

export type StudioType = 'creator' | 'speech' | 'custom' | 'e-ink';
export type Mood = StudioType; // Maintain legacy name for internal consistency if needed, but we'll use StudioType

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
    playbackDirection: 'forward' | 'reverse'; // Direction of scrolling
}

// Alias for backwards compatibility
export type PrompterSettings = Settings;

// Legacy type alias
export interface ScriptData extends Script { }

// PeerJS remote control messages
export interface PeerMessage {
    type: 'SET_PLAYING' | 'SET_SPEED' | 'RESET_SCROLL' | 'SET_FONT_SIZE' | 'SET_DIRECTION';
    payload: boolean | number | string;
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
