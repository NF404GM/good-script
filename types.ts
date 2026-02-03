export enum AppMode {
  EDITOR = 'EDITOR',
  PROMPTER = 'PROMPTER'
}

export type Theme = 'dark' | 'light' | 'high-contrast' | 'broadcast';
export type FontFamily = 'sans' | 'serif' | 'mono';

export interface PrompterSettings {
  scrollSpeed: number; // 0-100 (Pixels per frame roughly)
  fontSize: number; // px
  isMirrored: boolean;
  isPlaying: boolean;
  paddingX: number; // % of screen width
  fontFamily: FontFamily;
  theme: Theme;
  useSmartPacing: boolean; // Toggle for using timestamp logic
  enableWebcam: boolean;
}

export interface ScriptData {
  id: string;
  title: string;
  content: string;
  lastModified: number;
}