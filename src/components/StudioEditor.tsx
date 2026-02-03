import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    Wand2, Sparkles, Copy, Loader2, Play, Timer,
    Clock, X, Trash2, Save, FolderOpen, Plus, Search,
    Upload, Download, FileText, ChevronRight, Settings as SettingsIcon,
    Terminal, Command as CommandIcon, History, Zap, Mic, Users, BarChart3
} from 'lucide-react';
import { ExportManager } from '~/src/services/exportManager';
import { ScriptFormatter } from '~/src/utils/scriptFormatter';
import { TiptapEditor, TiptapEditorRef } from '~/src/components/TiptapEditor';
import { useDictation } from '~/src/hooks/useDictation';
import { CharacterBible } from '~/src/components/CharacterBible';
import { SessionTimer } from '~/src/components/SessionTimer';
import { WebcamOverlay } from '~/src/components/WebcamOverlay';
import { StudioFeaturePanel } from '~/src/components/StudioFeaturePanel';
import { SettingsCapsule } from '~/src/components/SettingsCapsule';
import { ScriptAnalytics } from '~/src/components/ScriptAnalytics';
import { Tag, Hash } from 'lucide-react';
import { Button } from '~/src/components/ui/button';
import { CommandPalette } from '~/src/components/CommandPalette';
import { useGemini } from '~/src/hooks/useGemini';
import { useCollaboration, Collaborator } from '~/src/hooks/useCollaboration'; // Added Collaborator type
import { cn } from '~/src/lib/utils';
import type { Script, Settings, Character } from '~/src/types';

interface StudioEditorProps {
    scriptContent: string;
    setScriptContent: (content: string) => void;
    onStartPrompter: () => void;
    scripts: Script[];
    currentScriptId: string | null;
    onSave: (title: string, characters?: Character[]) => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    onNew: () => void;
    onImport: (script: Partial<Script>) => void;
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
    onImport,
    settings,
    onSettingsChange,
}) => {
    const { collaborators, currentUserId, updateCursor, broadcastContentChange } = useCollaboration(currentScriptId, setScriptContent);

    // AI States
    const { generateScript, improveScript, refineSelection, autoPaceScript, isLoading } = useGemini();
    const [prompt, setPrompt] = useState('');
    const [showPromptInput, setShowPromptInput] = useState(false);

    // Navigation & UI States
    const [isPinned, setIsPinned] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isSidebarExpanded = isPinned || isHovered;
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [scriptTitle, setScriptTitle] = useState('');
    const [showAutoPaceDialog, setShowAutoPaceDialog] = useState(false);
    const [targetDuration, setTargetDuration] = useState('');
    const [showCharacterBible, setShowCharacterBible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [highlightedCharId, setHighlightedCharId] = useState<string | null>(null);
    const sidebarTimeoutRef = useRef<NodeJS.Timeout>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showStudioFeaturePanel, setShowStudioFeaturePanel] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Initial Mock Data Injection
    useEffect(() => {
        if (scripts.length === 0 && !isLoading) {
            const commonChars: Character[] = [
                { id: 'char-1', name: 'Dr. Aris', description: 'Head of Xenobiology. Precise, cautious, but hiding a terminal secret.', traits: ['Brilliant', 'Secretive'], color: '#3b82f6', role: 'Main' },
                { id: 'char-2', name: 'Commander Val', description: 'Colony leader. Decisions are based on survival, not sentiment.', traits: ['Tactical', 'Harsh'], color: '#ef4444', role: 'Main' },
                { id: 'char-3', name: 'Echo', description: 'A scavaged AI with a flickering consciousness and a penchant for dry humor.', traits: ['Witty', 'Unstable'], color: '#10b981', role: 'Support' },
                { id: 'char-4', name: 'Sloane', description: 'Underground broker in Sector 4. Knows everyone\'s price.', traits: ['Greedy', 'Resourceful'], color: '#f59e0b', role: 'Antagonist' }
            ];

            const mockScripts: Script[] = [
                {
                    id: 'mock-1',
                    title: 'The Mars Colony Incident',
                    content: `<h1>INT. COLONY HUB - NIGHT</h1><p>The alarm BLARES. COMMANDER VAL (50s) stares at the terminal.</p><p>VAL: Get everyone to the airlock! Aris, where are those samples?</p><p>DR. ARIS (40s) runs in, clutching a silver canister.</p><p>ARIS: They\'re safe, but the pressure\'s dropping. We don't have enough suits.</p>`,
                    lastModified: Date.now(),
                    createdAt: Date.now(),
                    characters: [commonChars[0], commonChars[1]]
                },
                {
                    id: 'mock-2',
                    title: 'Neon Nights',
                    content: `<h1>EXT. NEO-TOKYO STREETS - RAIN</h1><p>SLOANE (30s) flicks a cigarette. A cybernetic eye glows red.</p><p>SLOANE: You late, Echo.</p><p>ECHO (AI) flickers on a nearby holographic screen.</p><p>ECHO: Cops were crawling all over Sector 4. They know about the chip, Sloane.</p>`,
                    lastModified: Date.now() - 10000,
                    createdAt: Date.now() - 10000,
                    characters: [commonChars[2], commonChars[3]]
                },
                {
                    id: 'mock-3',
                    title: 'Shadow Protocol',
                    content: `<h1>INT. SAFE HOUSE - DAY</h1><p>DR. ARIS types furiously. The screen reflects a countdown.</p><p>ARIS: If VAL finds out we broke the protocol, it\'s over.</p>`,
                    lastModified: Date.now() - 20000,
                    createdAt: Date.now() - 20000,
                    characters: [commonChars[0], commonChars[1]]
                },
                {
                    id: 'mock-4',
                    title: 'Sector 4 Blackout',
                    content: `<h1>EXT. SECTOR 4 GATES - NIGHT</h1><p>The lights hum and then DIE. Total darkness.</p><p>SLOANE: Echo? Do you have the override?</p><p>ECHO: Accessing... 40 percent. I suggest you keep your head down.</p>`,
                    lastModified: Date.now() - 30000,
                    createdAt: Date.now() - 30000,
                    characters: [commonChars[2], commonChars[3]]
                },
                {
                    id: 'mock-5',
                    title: 'Terminal Secret',
                    content: `<h1>INT. MEDICAL BAY - NIGHT</h1><p>DR. ARIS examines a scan. His hand trembles.</p><p>ECHO: Your heart rate is elevated, Doctor. Shall I inform the Commander?</p><p>ARIS: Don't you dare.</p>`,
                    lastModified: Date.now() - 40000,
                    createdAt: Date.now() - 40000,
                    characters: [commonChars[0], commonChars[2]]
                },
                {
                    id: 'mock-6',
                    title: 'The Survivalist',
                    content: `<h1>EXT. WASTELAND - DAY</h1><p>COMMANDER VAL scans the horizon. Dust storms approach.</p><p>VAL: We move at sunrise. SLOANE, if your intel is wrong, I'm leaving you here.</p>`,
                    lastModified: Date.now() - 50000,
                    createdAt: Date.now() - 50000,
                    characters: [commonChars[1], commonChars[3]]
                },
                {
                    id: 'mock-7',
                    title: 'Echoes of Earth',
                    content: `<h1>INT. ARCHIVE ROOM - NIGHT</h1><p>ECHO displays a grainy video of a forest. Green leaves.</p><p>ARIS: It WAS beautiful, wasn't it?</p><p>ECHO: My data confirms aesthetic appeal at 98.4 percent.</p>`,
                    lastModified: Date.now() - 60000,
                    createdAt: Date.now() - 60000,
                    characters: [commonChars[0], commonChars[2]]
                },
                {
                    id: 'mock-8',
                    title: 'The Final Price',
                    content: `<h1>INT. COMMAND CENTER - DAY</h1><p>The deal is on the table. SLOANE smiles, cold and hungry.</p><p>SLOANE: One million credits. And I want command of the sector.</p><p>VAL: You're pushing your luck, Sloane.</p>`,
                    lastModified: Date.now() - 70000,
                    createdAt: Date.now() - 70000,
                    characters: [commonChars[1], commonChars[3]]
                }
            ];
            mockScripts.forEach(s => onImport(s));
        }
    }, [scripts.length, isLoading, onImport]);

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

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const script = await ExportManager.parseImportFile(file);
            onImport(script);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            console.error('Import failed:', err);
            alert(`Import Failed: ${err.message}`);
        }
    };

    const handleExport = (format: 'pdf' | 'md' | 'json' | 'docx' | 'fdx') => {
        const currentScript: Script = {
            id: currentScriptId || 'temp',
            title: scriptTitle || 'Untitled',
            content: scriptContent,
            lastModified: Date.now(),
            createdAt: Date.now()
        };

        switch (format) {
            case 'pdf': ExportManager.exportToPDF(currentScript); break;
            case 'md': ExportManager.exportToMarkdown(currentScript); break;
            case 'json': ExportManager.exportToJSON(currentScript); break;
            case 'docx': ExportManager.exportToWord(currentScript); break;
            case 'fdx': ExportManager.exportToFDX(currentScript); break;
        }
    };

    const handleAutoFormat = () => {
        const formatted = ScriptFormatter.format(scriptContent);
        setScriptContent(formatted);
    };

    const editorRef = useRef<TiptapEditorRef>(null);
    const handleDictationResult = (text: string) => {
        editorRef.current?.insertContent(text);
    };
    const { isListening, toggleListening, supported: voiceSupported } = useDictation(handleDictationResult);

    const currentScript = useMemo(() => scripts.find(s => s.id === currentScriptId), [scripts, currentScriptId]);
    const characters = currentScript?.characters || [];

    const handleAddCharacter = (char: Character) => {
        onSave(scriptTitle, [...characters, char]);
    };

    const handleUpdateCharacter = (char: Character) => {
        onSave(scriptTitle, characters.map(c => c.id === char.id ? char : c));
    };

    const handleDeleteCharacter = (id: string) => {
        onSave(scriptTitle, characters.filter(c => c.id !== id));
    };

    const highlightedCharacterName = useMemo(() => {
        if (!highlightedCharId) return null;
        return characters.find(c => c.id === highlightedCharId)?.name || null;
    }, [highlightedCharId, characters]);

    const studioConfigs = useMemo(() => {
        const base = {
            placeholder: "Write your script...",
            vignette: "via-zinc-950/10 to-black/60",
            prompt: "What script should I generate?",
            typography: "font-sans tracking-wide leading-relaxed text-lg",
            containerClass: "bg-zinc-950 text-zinc-300 selection:bg-white/10",
            accent: "text-white",
            buttonVariant: "default" as const,
            // Teleprompter-specific
            prompterFontScale: 1,
            showTimer: false,
            showWebcam: false,
            showMetronome: false,
            sceneBoardLabel: 'Scenes',
            sceneBoardItemLabel: 'Scene',
        };
        switch (settings.editorMood) {
            case 'creator': return {
                ...base,
                placeholder: "Content is king. Write your take.",
                prompt: "What content are you creating today?",
                typography: "font-sans font-medium tracking-normal leading-normal text-lg",
                containerClass: "bg-zinc-950 text-zinc-200 selection:bg-white/10",
                showWebcam: true,
                sceneBoardLabel: 'Takes',
                sceneBoardItemLabel: 'Take',
            };
            case 'speech': return {
                ...base,
                placeholder: "Speak clearly. Command the room.",
                prompt: "What's your key message?",
                typography: "font-sans font-bold tracking-normal leading-relaxed text-2xl",
                containerClass: "bg-black text-white selection:bg-white/20",
                accent: "text-white",
                prompterFontScale: 1.5,
                showTimer: true,
                sceneBoardLabel: 'Cue Cards',
                sceneBoardItemLabel: 'Cue',
            };
            case 'e-ink': return {
                ...base,
                placeholder: "Paper-like focus.",
                vignette: "hidden",
                prompt: "Write clearly.",
                typography: "font-serif text-black text-xl leading-relaxed antialiased",
                containerClass: "bg-[#f5f5f5] text-black selection:bg-black/10",
                accent: "text-black border-black",
                buttonVariant: "outline" as const,
                prompterFontScale: 1.2,
            };
            case 'custom':
            default: return base;
        }
    }, [settings.editorMood]);


    const handleAddTag = (tag: string) => {
        if (!tag || !currentScriptId) return;
        const currentTags = currentScript?.tags || [];
        if (currentTags.includes(tag)) return;

        onSave(currentScript?.title || 'Untitled', currentScript?.characters);
        // Note: Real state update happens via onSave/scripts prop
        setNewTag('');
    };

    const handleRemoveTag = (tag: string) => {
        if (!currentScriptId) return;
        const currentTags = currentScript?.tags || [];
        const newTags = currentTags.filter(t => t !== tag);
        // We'll update the script content to trigger a save
        onSave(currentScript?.title || 'Untitled', currentScript?.characters);
    };

    return (
        <div className={cn(
            "flex h-full w-full font-sans overflow-hidden transition-colors duration-700",
            studioConfigs.containerClass
        )}>
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                commands={commands}
            />

            {/* --- SIDEBAR --- */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarExpanded ? (isMobile ? '100vw' : 240) : (isMobile ? 0 : 60),
                    x: isMobile && !isSidebarExpanded ? -60 : 0
                }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                onMouseEnter={() => {
                    if (isMobile) return;
                    if (sidebarTimeoutRef.current) clearTimeout(sidebarTimeoutRef.current);
                    setIsHovered(true);
                }}
                onMouseLeave={() => {
                    if (isMobile) return;
                    sidebarTimeoutRef.current = setTimeout(() => setIsHovered(false), 300);
                }}
                className={cn(
                    "relative border-r flex flex-col pt-0 pb-4 z-50 shadow-[20px_0_40px_rgba(0,0,0,0.1)] overflow-hidden shrink-0",
                    isMobile && "fixed inset-y-0 left-0",
                    settings.editorMood === 'e-ink'
                        ? "bg-[#eaeaea] border-black/10 text-black"
                        : "bg-surface-1 border-white/5"
                )}
            >
                {/* Brand */}
                <div className={cn(
                    "h-14 flex items-center shrink-0 px-3 border-b border-white/5 mb-4",
                    isSidebarExpanded ? "justify-between" : "justify-center"
                )}>
                    {isSidebarExpanded && (
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-6 h-6 rounded flex items-center justify-center font-black italic",
                                settings.editorMood === 'e-ink' ? "bg-black text-white" : "bg-white text-black"
                            )}>
                                G
                            </div>
                            <span className={cn(
                                "font-bold tracking-widest text-xs",
                                settings.editorMood === 'e-ink' ? "text-black" : "text-white"
                            )}>GOOD.SCRIPT</span>
                        </div>
                    )}

                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            settings.editorMood === 'e-ink' ? "hover:bg-black/5 text-black/60" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                        )}
                    >
                        {isPinned ? <ChevronRight size={18} className="rotate-180" /> : <Wand2 size={20} />}
                    </button>
                </div>

                <motion.nav layout className="flex-1 px-2 space-y-6 overflow-y-auto no-scrollbar">
                    <LayoutGroup id="sidebar-nav">
                        {/* Group 1: Navigation */}
                        <div className="space-y-1">
                            <AnimatePresence>
                                {isSidebarExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2"
                                    >
                                        Navigation
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <SidebarItem
                                icon={<FolderOpen size={18} />}
                                label="Browse Scripts"
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
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full text-left py-1.5 text-xs text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
                                            <Upload size={12} /> Import
                                        </button>
                                        <div className="h-px bg-white/5 my-2" />
                                        {scripts.map(s => (
                                            <div
                                                key={s.id}
                                                className="flex items-center justify-between group"
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                                        id: s.id,
                                                        title: s.title,
                                                        content: s.content
                                                    }));
                                                }}
                                            >
                                                <button
                                                    onClick={() => onLoad(s.id)}
                                                    className={cn(
                                                        "flex-1 text-left py-1.5 text-xs truncate transition-colors cursor-pointer",
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
                            <SidebarItem
                                icon={<Users size={18} />}
                                label="Character Bible"
                                isExpanded={isSidebarExpanded}
                                onClick={() => setShowCharacterBible(true)}
                                isActive={showCharacterBible}
                            />
                            <SidebarItem
                                icon={<Download size={18} />}
                                label="Export File"
                                isExpanded={isSidebarExpanded}
                                onClick={() => handleExport('pdf')}
                            />
                        </div>

                        {/* Group 2: Tools */}
                        <div className="space-y-1">
                            <AnimatePresence>
                                {isSidebarExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2"
                                    >
                                        Tools
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {voiceSupported && (
                                <SidebarItem
                                    icon={<Mic size={18} className={cn(isListening && "text-red-500")} />}
                                    label="Voice Dictate"
                                    isExpanded={isSidebarExpanded}
                                    onClick={toggleListening}
                                    isActive={isListening}
                                />
                            )}
                            <SidebarItem
                                icon={<Wand2 size={18} />}
                                label="AI Composer"
                                isExpanded={isSidebarExpanded}
                                onClick={() => setShowPromptInput(true)}
                            />
                            <SidebarItem
                                icon={<Sparkles size={18} />}
                                label="Refine Draft"
                                isExpanded={isSidebarExpanded}
                                onClick={handleImprove}
                                disabled={isLoading}
                            />
                            <SidebarItem
                                icon={<Timer size={18} />}
                                label="Smart Pace"
                                isExpanded={isSidebarExpanded}
                                onClick={() => setShowAutoPaceDialog(true)}
                            />
                            <SidebarItem
                                icon={<BarChart3 size={18} />}
                                label="Analytics"
                                isExpanded={isSidebarExpanded}
                                onClick={() => setShowAnalytics(true)}
                                isActive={showAnalytics}
                            />
                        </div>

                        {/* Group 3: App */}
                        <div className="space-y-1">
                            <AnimatePresence>
                                {isSidebarExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2"
                                    >
                                        Application
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <SidebarItem
                                icon={<CommandIcon size={18} />}
                                label="Shortcuts"
                                isExpanded={isSidebarExpanded}
                                onClick={() => setIsCommandPaletteOpen(true)}
                            />
                            <SidebarItem
                                icon={<SettingsIcon size={18} />}
                                label="Preferences"
                                isExpanded={isSidebarExpanded}
                                onClick={() => setShowSettings(true)}
                                isActive={showSettings}
                            />
                        </div>

                        {/* Script Metadata / Tagging Section */}
                        {isSidebarExpanded && currentScriptId && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-4 py-8 border-t border-white/5"
                            >
                                <div className="flex items-center gap-2 mb-4 text-zinc-500">
                                    <Tag size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Metadata</span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(currentScript?.tags || []).map(tag => (
                                        <div
                                            key={tag}
                                            className="px-2 py-1 rounded-md bg-white/5 border border-white/5 flex items-center gap-2 group/tag"
                                        >
                                            <Hash size={10} className="text-zinc-500" />
                                            <span className="text-[10px] font-bold text-zinc-400">{tag}</span>
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="opacity-0 group-hover/tag:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {(currentScript?.tags || []).length === 0 && (
                                        <span className="text-[10px] text-zinc-600 italic">No tags assigned...</span>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag(newTag)}
                                        placeholder="Add tag..."
                                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-[10px] font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-colors"
                                    />
                                    <Plus size={12} className="absolute right-3 top-2.5 text-zinc-600" />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-1">
                                    {['Sci-Fi', 'Dark', 'Draft', 'Final'].filter(t => !(currentScript?.tags || []).includes(t)).map(suggested => (
                                        <button
                                            key={suggested}
                                            onClick={() => handleAddTag(suggested)}
                                            className="text-[8px] font-black uppercase tracking-tighter text-zinc-500 hover:text-white transition-colors"
                                        >
                                            +{suggested}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </LayoutGroup>
                </motion.nav>

                <div className="px-1 mt-2">
                    <SettingsCapsule settings={settings} onSettingsChange={onSettingsChange} />
                </div>
            </motion.aside>

            {/* Mobile Sidebar Toggle */}
            <AnimatePresence>
                {isMobile && !isSidebarExpanded && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsHovered(true)}
                        className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-white text-black shadow-2xl z-[60] flex items-center justify-center border border-black/10"
                    >
                        <Zap size={20} fill="currentColor" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* --- MAIN CONTENT --- */}
            <motion.main
                animate={{
                    marginRight: showCharacterBible && !isMobile ? 384 : 0,
                    width: 'auto'
                }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="flex-1 flex flex-col relative overflow-hidden bg-transparent"
            >
                <div className={cn(
                    "absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-transparent transition-all duration-1000",
                    studioConfigs.vignette
                )} />

                <header className="h-14 flex items-center justify-between px-4 md:px-8 z-20 transition-opacity duration-300 hover:opacity-100 opacity-60">
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                        <div className="hidden sm:block text-[10px] uppercase tracking-widest text-zinc-600">
                            Editor /
                        </div>
                        <input
                            type="text"
                            value={scriptTitle}
                            onChange={(e) => setScriptTitle(e.target.value)}
                            onBlur={() => onSave(scriptTitle)}
                            placeholder="Untitled Script"
                            className="bg-transparent text-sm font-medium text-zinc-300 focus:text-white focus:outline-none w-full max-w-[150px] sm:max-w-sm transition-colors truncate"
                        />
                    </div>

                    <div className="flex items-center gap-2 md:gap-6 shrink-0">
                        {/* Collaborators Indicator */}
                        <div className="flex items-center -space-x-1.5 mr-2">
                            {Object.values(collaborators).map((collab) => (
                                <motion.div
                                    key={collab.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="w-6 h-6 rounded-full border-2 border-surface-1 flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                                    style={{ backgroundColor: collab.color }}
                                    title={collab.name + (collab.id === currentUserId ? ' (You)' : '')}
                                >
                                    {collab.name.charAt(0).toUpperCase()}
                                </motion.div>
                            ))}
                        </div>

                        <LayoutGroup id="studio-switcher">
                            <div className="flex items-center gap-1 bg-surface-2/50 backdrop-blur-sm rounded-full p-1 border border-white/5">
                                {([
                                    { id: 'creator', label: 'Creator', icon: '📹' },
                                    { id: 'speech', label: 'Speech', icon: '🎤' },
                                    { id: 'custom', label: 'Studio', icon: '⚙️' },
                                    { id: 'e-ink', label: 'E-Ink', icon: '📄' },
                                ] as const).map(studio => (
                                    <motion.button
                                        key={studio.id}
                                        onClick={() => {
                                            onSettingsChange({ editorMood: studio.id });
                                            if (studio.id === 'custom') {
                                                setShowStudioFeaturePanel(true);
                                            }
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className={cn(
                                            "px-2 md:px-3 py-1 text-[9px] md:text-[10px] uppercase tracking-wider rounded-full transition-colors flex items-center gap-1 relative",
                                            settings.editorMood === studio.id
                                                ? "text-black font-bold"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        {settings.editorMood === studio.id && (
                                            <motion.div
                                                layoutId="studio-active-pill"
                                                className="absolute inset-0 bg-white rounded-full"
                                                style={{ originX: 0.5, originY: 0.5 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="hidden md:inline relative z-10">{studio.icon}</span>
                                        <span className="relative z-10">{isMobile ? studio.label[0] : studio.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </LayoutGroup>

                        {studioConfigs.showTimer && (
                            <SessionTimer isCompact />
                        )}

                        <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono text-zinc-600">
                            <span className="flex items-center gap-1.5"><FileText size={12} /> {stats.words}</span>
                            <span className="flex items-center gap-1.5"><Clock size={12} /> {stats.time}</span>
                        </div>
                        <Button
                            onClick={onStartPrompter}
                            className="bg-white hover:bg-zinc-200 text-black font-bold h-8 px-3 md:px-4 rounded-full shadow-lg transition-all"
                        >
                            <Play size={14} fill="currentColor" className="md:mr-2" />
                            <span className="hidden md:inline">Broadcast</span>
                        </Button>
                    </div>
                </header>

                <div className="flex-1 relative flex flex-col items-center z-10">
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
                                        placeholder={studioConfigs.prompt}
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

                    <div className="absolute inset-0 w-full h-full overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-[50vh]">
                            <div className="max-w-3xl mx-auto px-8 md:px-12 py-12 md:py-20 min-h-full">
                                <TiptapEditor
                                    ref={editorRef}
                                    key={currentScriptId}
                                    scriptId={currentScriptId}
                                    content={scriptContent}
                                    onChange={setScriptContent}
                                    onUpdateCursor={updateCursor}
                                    onBroadcastChange={broadcastContentChange}
                                    onRefineSelection={refineSelection}
                                    textColor={settings.editorMood === 'e-ink' ? '#000000' : settings.editorTextColor}
                                    placeholder={studioConfigs.placeholder}
                                    typography={studioConfigs.typography}
                                    highlightedCharacter={highlightedCharacterName || undefined}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-6 right-6 flex items-center gap-2 p-1 pl-3 rounded-full bg-surface-1 border border-white/5 shadow-xl pointer-events-none opacity-30">
                        <span className="text-[10px] text-zinc-500 font-medium">Synced</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    </div>
                </div>
            </motion.main>

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
                                    <Timer size={16} /> Smart Auto-Pacer
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

            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-surface-1 border border-white/10 px-6 py-4 rounded-full shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
                    >
                        <div className="flex items-center gap-1 h-6">
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-full"
                                    animate={{ height: [8, 24, 8] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, repeatType: "reverse" }}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-medium text-white">Listening...</span>
                        <button onClick={toggleListening} className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCharacterBible && (
                    <CharacterBible
                        characters={characters}
                        onClose={() => setShowCharacterBible(false)}
                        onAdd={handleAddCharacter}
                        onUpdate={handleUpdateCharacter}
                        onDelete={handleDeleteCharacter}
                        highlightedId={highlightedCharId}
                        onToggleHighlight={setHighlightedCharId}
                        isDark={settings.editorMood !== 'e-ink'}
                    />
                )}
            </AnimatePresence>

            {/* Webcam Overlay for Creator Studio */}
            {studioConfigs.showWebcam && (
                <WebcamOverlay
                    isEnabled={settings.enableWebcam}
                    onToggle={() => onSettingsChange({ enableWebcam: !settings.enableWebcam })}
                />
            )}

            {/* Studio Feature Panel for Custom Studio */}
            <StudioFeaturePanel
                isOpen={showStudioFeaturePanel}
                onClose={() => setShowStudioFeaturePanel(false)}
                settings={settings}
                onSettingsChange={onSettingsChange}
            />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json,.md,.txt,.fdx,.fountain,.pdf,.docx,.pages"
                onChange={handleImportFile}
            />
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
    <motion.button
        layout
        onClick={onClick}
        disabled={disabled}
        whileHover={{ x: isExpanded ? 6 : 0, scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative outline-none focus-visible:ring-2 focus-visible:ring-white/20",
            isActive
                ? "bg-gradient-to-r from-white/10 to-white/5 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                : "hover:bg-white/5 text-zinc-500 hover:text-white",
            disabled && "opacity-30 cursor-not-allowed"
        )}
    >
        {isActive && (
            <motion.div
                layoutId="active-pill"
                className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        )}
        <div className={cn(
            "shrink-0 transition-all duration-300",
            isActive ? "text-white scale-110" : "group-hover:text-white group-hover:scale-110"
        )}>
            {icon}
        </div>
        <div className="flex-1 overflow-hidden relative h-5">
            <AnimatePresence mode="popLayout">
                {isExpanded && (
                    <motion.span
                        key="label"
                        initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="text-sm font-medium whitespace-nowrap block absolute inset-0"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
        {!isExpanded && (
            <div className="absolute left-16 px-3 py-1.5 bg-zinc-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] shadow-2xl border border-white/10 translate-x-2 group-hover:translate-x-0 transition-all duration-300 uppercase tracking-widest">
                {label}
            </div>
        )}
    </motion.button>
);

export default StudioEditor;

