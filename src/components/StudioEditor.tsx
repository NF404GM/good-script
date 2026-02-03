import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wand2, Sparkles, Copy, Loader2, Play, Timer,
    Clock, X, Trash2, Save, FolderOpen, Plus, Search,
    Upload, FileText, ChevronRight, Settings as SettingsIcon,
    Terminal, Command as CommandIcon, History, Zap
} from 'lucide-react';
import { TiptapEditor } from '~/src/components/TiptapEditor';
import { SettingsCapsule } from '~/src/components/SettingsCapsule';
import { Button } from '~/src/components/ui/button';
import { CommandPalette } from '~/src/components/CommandPalette';
import { useGemini } from '~/src/hooks/useGemini';
import { cn } from '~/src/lib/utils';
import type { Script, Settings } from '~/src/types';

interface StudioEditorProps {
    scriptContent: string;
    setScriptContent: (content: string) => void;
    onStartPrompter: () => void;
    scripts: Script[];
    currentScriptId: string | null;
    onSave: (title: string) => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    onNew: () => void;
    settings: Settings;
    onSettingsChange: (settings: Partial<Settings>) => void;
}

export const StudioEditor: React.FC<StudioEditorProps> = ({
    scriptContent,
    setScriptContent,
    onStartPrompter,
    scripts,
    currentScriptId,
    onSave,
    onLoad,
    onDelete,
    onNew,
    settings,
    onSettingsChange,
}) => {
    // AI States
    const { generateScript, improveScript, refineSelection, autoPaceScript, isLoading } = useGemini();
    const [prompt, setPrompt] = useState('');
    const [showPromptInput, setShowPromptInput] = useState(false);

    // Navigation & UI States
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [scriptTitle, setScriptTitle] = useState('');
    const [showAutoPaceDialog, setShowAutoPaceDialog] = useState(false);
    const [targetDuration, setTargetDuration] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync title
    useEffect(() => {
        if (currentScriptId) {
            const s = scripts.find(s => s.id === currentScriptId);
            if (s) setScriptTitle(s.title);
        } else {
            setScriptTitle('');
        }
    }, [currentScriptId, scripts]);

    // Keyboard Shortcuts (Cmd+K for Command Palette)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSave(scriptTitle);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scriptTitle, onSave]);

    // Stats calculation
    const stats = useMemo(() => {
        const div = document.createElement('div');
        div.innerHTML = scriptContent;
        const cleanText = div.innerText.trim();

        if (!cleanText) return { words: 0, time: '0s' };

        const words = cleanText.split(/\s+/).length;
        const totalSeconds = Math.ceil((words / 140) * 60);

        if (totalSeconds < 60) return { words, time: `${totalSeconds}s` };

        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        return { words, time: `${min}m ${sec}s` };
    }, [scriptContent]);

    // --- COMMAND PALETTE ACTIONS ---
    const commands = [
        {
            id: 'new-script',
            title: 'New Script',
            description: 'Start a fresh document',
            icon: <Plus size={16} />,
            shortcut: 'alt+n',
            action: onNew,
            category: 'General' as const,
        },
        {
            id: 'save-script',
            title: 'Save Script',
            description: 'Save current progress',
            icon: <Save size={16} />,
            shortcut: 'cmd+s',
            action: () => onSave(scriptTitle),
            category: 'General' as const,
        },
        {
            id: 'start-prompter',
            title: 'Start Prompter',
            description: 'Go to broadcast mode',
            icon: <Play size={16} />,
            shortcut: 'cmd+enter',
            action: onStartPrompter,
            category: 'General' as const,
        },
        {
            id: 'ai-generate',
            title: 'AI Generate',
            description: 'Generate script from prompt',
            icon: <Wand2 size={16} />,
            action: () => setShowPromptInput(true),
            category: 'AI' as const,
        },
        {
            id: 'ai-improve',
            title: 'AI Refine',
            description: 'Improve grammar and flow',
            icon: <Sparkles size={16} />,
            action: async () => {
                const improvedText = await improveScript(scriptContent);
                const html = improvedText.split('\n').map(l => l.trim() ? `<p>${l}</p>` : '<br>').join('');
                setScriptContent(html);
            },
            category: 'AI' as const,
        },
        {
            id: 'auto-pace',
            title: 'Auto Pace',
            description: 'Add timing markers automatically',
            icon: <Timer size={16} />,
            action: () => setShowAutoPaceDialog(true),
            category: 'AI' as const,
        }
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        try {
            const text = await generateScript(prompt);
            const html = text.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
            setScriptContent(html);
            setShowPromptInput(false);
            setPrompt('');
        } catch (e) { console.error(e); }
    };

    const handleAutoPace = async () => {
        try {
            const text = getPlainText();
            const pacedText = await autoPaceScript(text, targetDuration || "Natural pace");
            const html = pacedText.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
            setScriptContent(html);
            setShowAutoPaceDialog(false);
        } catch (e) { console.error(e); }
    };

    const getPlainText = () => {
        const div = document.createElement('div');
        div.innerHTML = scriptContent;
        return div.innerText || '';
    };

    const handleImprove = async () => {
        const text = getPlainText();
        if (!text.trim()) return;
        try {
            const improvedText = await improveScript(text);
            const html = improvedText.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
            setScriptContent(html);
        } catch (e) {
            console.error('Improve failed:', e);
        }
    };

    // Mood State
    const moodProps = useMemo(() => {
        switch (settings.editorMood) {
            case 'urgent': return {
                placeholder: "Write fast. Be direct.",
                vignette: "via-black/10 to-black/80",
                prompt: "What needs to be said right now?",
                typography: "font-mono tracking-tight leading-tight text-lg",
                containerClass: "bg-black text-rose-50 selection:bg-rose-900/50",
                accent: "text-rose-500",
                buttonVariant: "destructive"
            };
            case 'confident': return {
                placeholder: "Speak with authority.",
                vignette: "via-slate-950/10 to-slate-950/80",
                prompt: "What is your command?",
                typography: "font-sans font-bold tracking-normal leading-normal text-xl",
                containerClass: "bg-slate-950 text-slate-100 selection:bg-white/20",
                accent: "text-white",
                buttonVariant: "default"
            };
            case 'reflect': return {
                placeholder: "Thoughtful pacing...",
                vignette: "via-[#1a1918]/10 to-[#1a1918]/90",
                prompt: "What are you exploring?",
                typography: "font-serif tracking-wide leading-loose text-lg opacity-90",
                containerClass: "bg-[#0d0d0c] text-[#a8a29e] selection:bg-[#a8a29e]/20",
                accent: "text-[#d6d3d1]",
                buttonVariant: "secondary"
            };
            case 'e-ink': return {
                placeholder: "Paper-like focus.",
                vignette: "hidden",
                prompt: "Write clearly.",
                typography: "font-serif text-black text-xl leading-relaxed antialiased",
                containerClass: "bg-[#f5f5f5] text-black selection:bg-black/10",
                accent: "text-black border-black",
                buttonVariant: "outline"
            };
            case 'calm':
            default: return {
                placeholder: "Breathe. Write.",
                vignette: "via-zinc-950/10 to-black/60",
                prompt: "What script should I generate?",
                typography: "font-sans tracking-wide leading-relaxed text-lg",
                containerClass: "bg-zinc-950 text-zinc-300 selection:bg-white/10",
                accent: "text-white",
                buttonVariant: "default"
            };
        }
    }, [settings.editorMood]);

    return (
        <div className={cn(
            "flex h-full w-full font-sans overflow-hidden transition-colors duration-700",
            moodProps.containerClass
        )}>
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                commands={commands}
            />

            {/* --- SIDEBAR (Intent-Based) --- */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarExpanded ? 240 : 64 }}
                onMouseEnter={() => setIsSidebarExpanded(true)}
                onMouseLeave={() => setIsSidebarExpanded(false)}
                className={cn(
                    "relative border-r flex flex-col py-6 z-50 transition-all duration-300 shadow-[20px_0_40px_rgba(0,0,0,0.1)]",
                    settings.editorMood === 'e-ink'
                        ? "bg-[#eaeaea] border-black/10 text-black"
                        : "bg-surface-1 border-white/5"
                )}
            >
                {/* Brand */}
                <div className="px-4 mb-8 overflow-hidden">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            settings.editorMood === 'e-ink' ? "bg-black text-white" : "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        )}>
                            <Zap fill="currentColor" size={18} />
                        </div>
                        <AnimatePresence>
                            {isSidebarExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn(
                                        "text-sm font-bold tracking-widest whitespace-nowrap",
                                        settings.editorMood === 'e-ink' ? "text-black" : "text-white"
                                    )}
                                >
                                    GOOD SCRIPT
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation Groups */}
                <nav className="flex-1 px-2 space-y-6 overflow-y-auto no-scrollbar">

                    {/* SCRIPT MANAGEMENT */}
                    <div className="space-y-1">
                        <AnimatePresence>
                            {isSidebarExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 overflow-hidden"
                                >
                                    Script
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <SidebarItem
                            icon={<FolderOpen size={18} />}
                            label="Library"
                            isExpanded={isSidebarExpanded}
                            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                            isActive={isLibraryOpen}
                        />
                        <AnimatePresence>
                            {isSidebarExpanded && isLibraryOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="ml-8 space-y-1 my-1 border-l border-white/5 pl-2"
                                >
                                    <button onClick={onNew} className="w-full text-left py-1.5 text-xs text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
                                        <Plus size={12} /> New Script
                                    </button>
                                    {scripts.map(s => (
                                        <div key={s.id} className="flex items-center justify-between group">
                                            <button
                                                onClick={() => onLoad(s.id)}
                                                className={cn(
                                                    "flex-1 text-left py-1.5 text-xs truncate transition-colors",
                                                    currentScriptId === s.id ? "text-white font-medium" : "text-zinc-600 hover:text-zinc-300"
                                                )}
                                            >
                                                {s.title}
                                            </button>
                                            <button onClick={() => onDelete(s.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400">
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* WRITING TOOLS */}
                    <div className="space-y-1">
                        <AnimatePresence>
                            {isSidebarExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 overflow-hidden"
                                >
                                    Write
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <SidebarItem
                            icon={<Wand2 size={18} />}
                            label="AI Writer"
                            isExpanded={isSidebarExpanded}
                            onClick={() => setShowPromptInput(true)}
                        />
                        <SidebarItem
                            icon={<Sparkles size={18} />}
                            label="Refine Flow"
                            isExpanded={isSidebarExpanded}
                            onClick={handleImprove}
                            disabled={isLoading}
                        />
                        <SidebarItem
                            icon={<Timer size={18} />}
                            label="Auto Pace"
                            isExpanded={isSidebarExpanded}
                            onClick={() => setShowAutoPaceDialog(true)}
                        />
                    </div>

                    {/* SYSTEM TOOLS */}
                    <div className="space-y-1">
                        <AnimatePresence>
                            {isSidebarExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 overflow-hidden"
                                >
                                    System
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <SidebarItem
                            icon={<CommandIcon size={18} />}
                            label="Shortcuts"
                            isExpanded={isSidebarExpanded}
                            onClick={() => setIsCommandPaletteOpen(true)}
                        />
                        <div className="px-1">
                            <SettingsCapsule settings={settings} onSettingsChange={onSettingsChange} />
                        </div>
                    </div>
                </nav>
            </motion.aside>

            {/* --- MAIN CONTENT (Spotlight Stage) --- */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent">

                {/* Spotlight Gradient */}
                <div className={cn(
                    "absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-transparent transition-all duration-1000",
                    moodProps.vignette
                )} />

                {/* Top Nav / Breadcrumbs */}
                <header className="h-14 flex items-center justify-between px-8 z-20 transition-opacity duration-300 hover:opacity-100 opacity-60">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Editor /</div>
                        <input
                            type="text"
                            value={scriptTitle}
                            onChange={(e) => setScriptTitle(e.target.value)}
                            onBlur={() => onSave(scriptTitle)}
                            placeholder="Untitled Script"
                            className="bg-transparent text-sm font-medium text-zinc-300 focus:text-white focus:outline-none w-full max-w-sm transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Mood Selector */}
                        <div className="flex items-center gap-2 bg-surface-2/50 backdrop-blur-sm rounded-full px-1 p-1 border border-white/5">
                            {(['calm', 'confident', 'urgent', 'reflect', 'e-ink'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => onSettingsChange({ editorMood: m })}
                                    className={cn(
                                        "px-3 py-1 text-[10px] uppercase tracking-wider rounded-full transition-all",
                                        settings.editorMood === m
                                            ? cn("bg-white text-black font-bold", moodProps.buttonVariant === 'destructive' && "bg-rose-600 text-white", moodProps.buttonVariant === 'outline' && "bg-black text-white")
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-zinc-600">
                            <span className="flex items-center gap-1.5"><FileText size={12} /> {stats.words} words</span>
                            <span className="flex items-center gap-1.5"><Clock size={12} /> {stats.time} read</span>
                        </div>
                        <Button
                            onClick={onStartPrompter}
                            variant="default"
                            className="bg-white hover:bg-zinc-200 text-black font-bold h-8 px-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
                        >
                            <Play size={14} fill="currentColor" className="mr-2" />
                            Broadcast
                        </Button>
                    </div>
                </header>

                {/* Canvas Area */}
                <div className="flex-1 relative flex flex-col items-center z-10">
                    {/* Prompt Input Box */}
                    <AnimatePresence>
                        {showPromptInput && (
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="absolute top-8 w-full max-w-xl px-4 z-40"
                            >
                                <div className="bg-surface-1 border border-white/10 p-2 rounded-2xl shadow-2xl flex gap-2 ring-1 ring-white/5">
                                    <input
                                        autoFocus
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                        placeholder={moodProps.prompt}
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-white px-4 placeholder-zinc-600"
                                    />
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="h-9 px-4 bg-white text-black font-bold hover:bg-zinc-200"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Write'}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setShowPromptInput(false)} className="text-zinc-500 hover:text-white">
                                        <X size={18} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Editor Canvas */}
                    <div className="w-full h-full max-w-3xl px-8 md:px-12 py-12 md:py-20 overflow-y-auto custom-scrollbar scroll-smooth pb-[50vh]">
                        <TiptapEditor
                            content={scriptContent}
                            onChange={setScriptContent}
                            onRefineSelection={refineSelection}
                            textColor={settings.editorMood === 'e-ink' ? '#000000' : settings.editorTextColor}
                            placeholder={moodProps.placeholder}
                            typography={moodProps.typography}
                        />
                    </div>

                    {/* Floating Info (Status) */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-2 p-1 pl-3 rounded-full bg-surface-1 border border-white/5 shadow-xl pointer-events-none opacity-30">
                        <span className="text-[10px] text-zinc-500 font-medium">Synced</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    </div>
                </div>
            </main>

            {/* Auto Pace Modal */}
            <AnimatePresence>
                {showAutoPaceDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface-1 border border-white/10 w-full max-w-md rounded-2xl p-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                    <Timer size={16} />
                                    Smart Auto-Pacer
                                </h3>
                                <button onClick={() => setShowAutoPaceDialog(false)} className="text-zinc-600 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                                Our AI will inject timing markers to help you hit your target duration.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-zinc-600 mb-2 block">Target Duration</label>
                                    <input
                                        type="text"
                                        value={targetDuration}
                                        onChange={(e) => setTargetDuration(e.target.value)}
                                        className="w-full bg-surface-2 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-white/20 focus:outline-none font-mono text-sm placeholder-zinc-700"
                                        autoFocus
                                        placeholder="e.g. 60s or 2m 30s"
                                    />
                                </div>

                                <Button
                                    onClick={handleAutoPace}
                                    className="w-full h-10 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Optimize Pace'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    isExpanded: boolean;
    onClick?: () => void;
    isActive?: boolean;
    disabled?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isExpanded, onClick, isActive, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
            isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-zinc-500 hover:text-white",
            disabled && "opacity-30 cursor-not-allowed"
        )}
    >
        <div className={cn(
            "shrink-0 transition-colors",
            isActive ? "text-white" : "group-hover:text-white"
        )}>
            {icon}
        </div>
        <AnimatePresence>
            {isExpanded && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                    {label}
                </motion.span>
            )}
        </AnimatePresence>
        {!isExpanded && (
            <div className="absolute left-16 px-2 py-1 bg-surface-2 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10">
                {label}
            </div>
        )}
    </button>
);

export default StudioEditor;
