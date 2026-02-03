import React, { useState } from 'react';
import { Play, Pause, Settings, X, RotateCcw, Type, MonitorSmartphone, Palette, Timer, Eye, EyeOff, Minus, Plus, Sliders, Camera } from 'lucide-react';
import { PrompterSettings, Theme, FontFamily } from '../types';

interface ControlBarProps {
  settings: PrompterSettings;
  updateSettings: (newSettings: Partial<PrompterSettings>) => void;
  onExit: () => void;
  onResetScroll: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({ 
    settings, 
    updateSettings, 
    onExit, 
    onResetScroll, 
    isVisible,
    onToggleVisibility
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const containerClass = `fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
  }`;

  if (!isVisible) return null; 

  return (
    <div className={containerClass}>
        
        {/* --- SETTINGS POPOVER --- */}
        <div className={`w-[90vw] max-w-md bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom ${showSettings ? 'scale-100 opacity-100 mb-2' : 'scale-95 opacity-0 h-0 mb-0 pointer-events-none'}`}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Sliders size={14} /> Teleprompter Config
                </span>
                <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white"><X size={16}/></button>
            </div>
            
            <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {/* Smart Pacing */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${settings.useSmartPacing ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            <Timer size={18} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-zinc-200">Smart Pacing</div>
                            <div className="text-xs text-zinc-500">Auto-speed via [mm:ss]</div>
                        </div>
                    </div>
                    <button
                        onClick={() => updateSettings({ useSmartPacing: !settings.useSmartPacing })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings.useSmartPacing ? 'bg-amber-600' : 'bg-zinc-700'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.useSmartPacing ? 'translate-x-5' : ''}`}></div>
                    </button>
                </div>

                {/* Webcam Toggle */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${settings.enableWebcam ? 'bg-indigo-500/10 text-indigo-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            <Camera size={18} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-zinc-200">Webcam Mode</div>
                            <div className="text-xs text-zinc-500">Show camera behind text</div>
                        </div>
                    </div>
                    <button
                        onClick={() => updateSettings({ enableWebcam: !settings.enableWebcam })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings.enableWebcam ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.enableWebcam ? 'translate-x-5' : ''}`}></div>
                    </button>
                </div>

                <hr className="border-zinc-800" />

                {/* Font Size */}
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium text-zinc-400">
                        <span>Text Size</span>
                        <span>{settings.fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Type size={14} className="text-zinc-600"/>
                        <input
                            type="range"
                            min="32"
                            max="140"
                            step="4"
                            value={settings.fontSize}
                            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                            className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <Type size={20} className="text-zinc-400"/>
                    </div>
                </div>

                {/* Margin / Padding */}
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium text-zinc-400">
                        <span>Side Margins</span>
                        <span>{settings.paddingX}%</span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="35"
                        step="1"
                        value={settings.paddingX}
                        onChange={(e) => updateSettings({ paddingX: Number(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                <hr className="border-zinc-800" />

                {/* Themes */}
                <div className="space-y-2">
                    <span className="text-xs font-medium text-zinc-400">Color Mode</span>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'dark', color: 'bg-zinc-900 border-zinc-700' },
                            { id: 'light', color: 'bg-white border-zinc-300' },
                            { id: 'high-contrast', color: 'bg-black border-yellow-500' },
                            { id: 'broadcast', color: 'bg-[#000033] border-blue-900 ring-blue-500' },
                        ].map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => updateSettings({ theme: theme.id as Theme })}
                                className={`h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    settings.theme === theme.id 
                                    ? 'ring-2 ring-indigo-500 scale-105' 
                                    : 'opacity-60 hover:opacity-100'
                                } ${theme.color}`}
                                title={theme.id}
                            >
                                {settings.theme === theme.id && <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- MAIN CAPSULE BAR --- */}
        <div className="flex items-center p-1.5 bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-full shadow-2xl shadow-black/50 select-none">
            
            <div className="flex items-center gap-1 pl-3 pr-2 border-r border-zinc-800">
                <button 
                    onClick={() => updateSettings({ scrollSpeed: Math.max(0, settings.scrollSpeed - 0.5) })}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <Minus size={16} />
                </button>
                <div className="w-12 text-center font-mono text-sm font-bold text-indigo-400">
                    {settings.scrollSpeed.toFixed(1)}
                </div>
                <button 
                    onClick={() => updateSettings({ scrollSpeed: Math.min(20, settings.scrollSpeed + 0.5) })}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="px-3">
                 <button
                    onClick={() => updateSettings({ isPlaying: !settings.isPlaying })}
                    className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
                        settings.isPlaying 
                        ? 'bg-amber-500 text-black hover:bg-amber-400' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                >
                    {settings.isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
                </button>
            </div>

            <div className="flex items-center gap-1 pr-1 border-l border-zinc-800 pl-2">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-3 rounded-full transition-colors ${showSettings ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
                
                {/* NEW: Direct Webcam Toggle */}
                <button
                    onClick={() => updateSettings({ enableWebcam: !settings.enableWebcam })}
                    className={`p-3 rounded-full transition-colors ${settings.enableWebcam ? 'text-indigo-400 bg-indigo-400/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    title="Toggle Webcam"
                >
                    <Camera size={20} />
                </button>
                
                <button
                    onClick={() => updateSettings({ isMirrored: !settings.isMirrored })}
                    className={`p-3 rounded-full transition-colors ${settings.isMirrored ? 'text-indigo-400 bg-indigo-400/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    title="Mirror Display"
                >
                    <MonitorSmartphone size={20} className={settings.isMirrored ? "scale-x-[-1]" : ""} />
                </button>

                <button
                    onClick={onResetScroll}
                    className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                    title="Reset to Top"
                >
                    <RotateCcw size={20} />
                </button>

                 <div className="w-px h-6 bg-zinc-800 mx-1"></div>

                 <button
                    onClick={onExit}
                    className="p-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                    title="Exit"
                >
                    <X size={20} />
                </button>
            </div>
            
        </div>
    </div>
  );
};