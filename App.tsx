import React, { useState, useEffect } from 'react';
import { AppMode, ScriptData } from './types';
import { Editor } from './components/Editor';
import { Prompter } from './components/Prompter';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.EDITOR);
  
  // Script Management
  const [scripts, setScripts] = useState<ScriptData[]>([]);
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  
  // The current active content (synced with the current script or scratchpad)
  const [scriptContent, setScriptContent] = useState<string>(`<h1>Welcome to GOOD SCRIPT.</h1><p><br></p><p>Type your script here, or use the "AI Write" button to generate one automatically.</p><p><br></p><p><b>Features:</b></p><p>- Rich Text Editing</p><p>- Webcam Background</p><p>- Script Library</p>`);

  // Load scripts from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('prompter_scripts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScripts(parsed);
      } catch (e) {
        console.error("Failed to load scripts", e);
      }
    }
  }, []);

  // Save scripts to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('prompter_scripts', JSON.stringify(scripts));
  }, [scripts]);

  const handleSaveScript = (title: string) => {
    const newScript: ScriptData = {
      id: currentScriptId || crypto.randomUUID(),
      title: title || 'Untitled Script',
      content: scriptContent,
      lastModified: Date.now()
    };

    if (currentScriptId) {
      setScripts(prev => prev.map(s => s.id === currentScriptId ? newScript : s));
    } else {
      setScripts(prev => [...prev, newScript]);
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

  const handleDeleteScript = (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id));
    if (currentScriptId === id) {
      setCurrentScriptId(null);
      setScriptContent('');
    }
  };

  const handleNewScript = () => {
    setCurrentScriptId(null);
    setScriptContent('');
  };

  return (
    <div className="h-full w-full bg-zinc-950 text-zinc-100 flex flex-col">
      {mode === AppMode.EDITOR ? (
        <Editor 
          scriptContent={scriptContent} 
          setScriptContent={setScriptContent} 
          onStartPrompter={() => setMode(AppMode.PROMPTER)}
          scripts={scripts}
          currentScriptId={currentScriptId}
          onSave={handleSaveScript}
          onLoad={handleLoadScript}
          onDelete={handleDeleteScript}
          onNew={handleNewScript}
        />
      ) : (
        <Prompter 
          text={scriptContent} 
          onExit={() => setMode(AppMode.EDITOR)}
        />
      )}
    </div>
  );
};

export default App;