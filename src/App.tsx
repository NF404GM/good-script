import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudioEditor } from '~/src/components/StudioEditor';
import { Prompter } from '~/src/components/Prompter';
import { RemoteClient } from '~/src/components/RemoteClient';
import { InstallPrompt } from '~/src/components/InstallPrompt';
import { AppMode, Script, Settings, Character } from '~/src/types';
import { useScriptSync } from '~/src/hooks/useScriptSync';

// Default settings with Deep Navy theme
const DEFAULT_SETTINGS: Settings = {
    scrollSpeed: 2.5,
    fontSize: 80,
    isMirrored: false,
    isPlaying: false,
    paddingX: 15,
    fontFamily: 'sans',
    theme: 'broadcast',
    useSmartPacing: true,
    enableWebcam: false,
    enableGestures: false,
    enableVoiceScroll: false,
    editorTextColor: '#ffffff',
    editorMood: 'creator',
};

const DEFAULT_CONTENT = `<h1>Welcome to GOOD SCRIPT V2</h1>
<p></p>
<p>Type your script here, or use the "Script Writer" button to generate one with AI.</p>
<p></p>
<p><strong>New Features:</strong></p>
<p>• Tiptap Rich Text Editor</p>
<p>• AI Refine (select text → bubble menu)</p>
<p>• Deep Navy Broadcast Theme</p>
<p>• shadcn/ui Components</p>
<p>• Phone Remote Control</p>
<p>• Real-time Sync (with Supabase)</p>`;

// Check for remote mode from URL
const getRemoteIdFromUrl = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get('remote');
};

const App: React.FC = () => {
    const remoteId = getRemoteIdFromUrl();

    // If this is a remote client, render the RemoteClient component
    if (remoteId) {
        return <RemoteClient roomId={remoteId} />;
    }

    return <MainApp />;
};

// Main application component
const MainApp: React.FC = () => {
    const [mode, setMode] = useState<AppMode>(AppMode.EDITOR);

    // Script Management via Hook
    const { scripts, saveScript, deleteScript } = useScriptSync();
    const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
    const [scriptContent, setScriptContent] = useState<string>(DEFAULT_CONTENT);

    // Settings (shared between Editor and Prompter)
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    // Load settings - KEEP manual settings load as useScriptSync only handles scripts
    useEffect(() => {
        const savedSettings = localStorage.getItem('goodscript_v2_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        }
    }, []);

    // Save settings to local storage
    useEffect(() => {
        localStorage.setItem('goodscript_v2_settings', JSON.stringify(settings));
    }, [settings]);

    const handleSaveScript = async (title: string, characters?: Character[]) => {
        const existingScript = scripts.find(s => s.id === currentScriptId);
        const newScript: Script = {
            id: currentScriptId || crypto.randomUUID(),
            title: title || 'Untitled Script',
            content: scriptContent,
            lastModified: Date.now(),
            createdAt: existingScript ? existingScript.createdAt : Date.now(),
            characters: characters || existingScript?.characters || [],
        };

        await saveScript(newScript);

        if (!currentScriptId) {
            setCurrentScriptId(newScript.id);
        }
    };

    const handleLoadScript = (id: string) => {
        const script = scripts.find(s => s.id === id);
        if (script) {
            setCurrentScriptId(script.id);
            setScriptContent(script.content);
        }
    };

    const handleDeleteScript = async (id: string) => {
        await deleteScript(id);
        if (currentScriptId === id) {
            setCurrentScriptId(null);
            setScriptContent(DEFAULT_CONTENT);
        }
    };

    const handleNewScript = () => {
        setCurrentScriptId(null);
        setScriptContent('');
    };

    const handleImportScript = async (imported: Partial<Script>) => {
        const newScript: Script = {
            id: crypto.randomUUID(),
            title: imported.title || 'Imported Script',
            content: imported.content || '',
            lastModified: Date.now(),
            createdAt: Date.now(),
        };

        await saveScript(newScript);
        setCurrentScriptId(newScript.id);
        setScriptContent(newScript.content);
    };

    const handleSettingsChange = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <div className="h-full w-full bg-navy-deep text-foreground flex flex-col">
            <AnimatePresence mode="wait">
                {mode === AppMode.EDITOR ? (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full w-full"
                    >
                        <StudioEditor
                            scriptContent={scriptContent}
                            setScriptContent={setScriptContent}
                            onStartPrompter={() => setMode(AppMode.PROMPTER)}
                            scripts={scripts}
                            currentScriptId={currentScriptId}
                            onSave={handleSaveScript}
                            onLoad={handleLoadScript}
                            onDelete={handleDeleteScript}
                            onNew={handleNewScript}
                            onImport={handleImportScript}
                            settings={settings}
                            onSettingsChange={handleSettingsChange}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="prompter"
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        transition={{
                            scaleY: { type: "spring", stiffness: 200, damping: 20 },
                            opacity: { duration: 0.15 }
                        }}
                        style={{ originY: 0.5, transformOrigin: "center" }}
                        className="h-full w-full bg-black"
                    >
                        {/* TV scan line effect overlay */}
                        <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-b from-white/5 via-transparent to-white/5"
                            style={{
                                backgroundSize: "100% 4px",
                                backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 2px)"
                            }}
                        />
                        <Prompter
                            text={scriptContent}
                            onExit={() => setMode(AppMode.EDITOR)}
                            initialSettings={settings}
                            onSettingsChange={handleSettingsChange}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <InstallPrompt />
        </div>
    );
};

export default App;
