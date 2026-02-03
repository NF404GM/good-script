import React, { useState, useMemo, useRef, useEffect } from 'react';
import { generateScript, improveScript, autoPaceScript } from '../services/geminiService';
import { Toast, ToastType } from './Toast';
import { ScriptData } from '../types';
import { 
  Wand2, Sparkles, Copy, Loader2, Play, Timer, 
  FileText, Clock, ChevronRight, X, Type, 
  Eraser, CaseUpper, CaseLower, AlignLeft, Trash2,
  Save, FolderOpen, Plus, Search, Bold, Italic, Palette, Upload
} from 'lucide-react';

interface EditorProps {
  scriptContent: string;
  setScriptContent: (content: string) => void;
  onStartPrompter: () => void;
  scripts: ScriptData[];
  currentScriptId: string | null;
  onSave: (title: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export const Editor: React.FC<EditorProps> = ({ 
    scriptContent, setScriptContent, onStartPrompter,
    scripts, currentScriptId, onSave, onLoad, onDelete, onNew
}) => {
  // AI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  
  // Library States
  const [showLibrary, setShowLibrary] = useState(false);
  const [scriptTitle, setScriptTitle] = useState('');

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatchCount, setSearchMatchCount] = useState(0);

  // Auto Pace State
  const [showAutoPaceDialog, setShowAutoPaceDialog] = useState(false);
  const [targetDuration, setTargetDuration] = useState('');

  // Toast State
  const [toast, setToast] = useState<{ msg: string; type: ToastType; show: boolean }>({
    msg: '', type: 'info', show: false
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToast({ msg, type, show: true });
  };

  // Sync content from props to editable div when switching scripts
  useEffect(() => {
      if (editorRef.current && editorRef.current.innerHTML !== scriptContent) {
          editorRef.current.innerHTML = scriptContent;
      }
      
      // Update title if script is loaded
      if (currentScriptId) {
          const s = scripts.find(s => s.id === currentScriptId);
          if (s) setScriptTitle(s.title);
      } else {
          setScriptTitle('');
      }
  }, [currentScriptId, scripts]);


  // Stats
  const stats = useMemo(() => {
    // Strip HTML tags for stats
    const div = document.createElement('div');
    div.innerHTML = scriptContent;
    const cleanText = div.innerText.trim();
    
    if (!cleanText) return { words: 0, time: '0s' };

    const words = cleanText.split(/\s+/).length;
    // Average speaking rate ~140 wpm
    const totalSeconds = Math.ceil((words / 140) * 60);
    
    if (totalSeconds < 60) return { words, time: `${totalSeconds}s` };
    
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return { words, time: `${min}m ${sec}s` };
  }, [scriptContent]);

  // --- EDITOR HANDLERS ---

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
      setScriptContent(e.currentTarget.innerHTML);
  };

  const execCmd = (command: string, value: string = '') => {
      document.execCommand(command, false, value);
      if (editorRef.current) setScriptContent(editorRef.current.innerHTML);
  };

  const handleSearch = () => {
      if (!searchTerm) return;
      // Use window.find to highlight
      // Cast window to any to allow non-standard method
      const found = (window as any).find(searchTerm, false, false, true, false, false, false);
      if (found) {
          setSearchMatchCount(prev => prev + 1); // Just to force re-render/feedback if needed
      } else {
          // Reset position if not found (wrap around logic could be here)
          window.getSelection()?.removeAllRanges();
          showToast('End of document or text not found', 'info');
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          // Convert plain text newlines to <br> or <p> for HTML editor
          const htmlText = text.split('\n').map(line => `<p>${line}</p>`).join('');
          setScriptContent(htmlText);
          if (editorRef.current) editorRef.current.innerHTML = htmlText;
          showToast('File imported successfully', 'success');
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };


  // --- AI HANDLERS ---

  const getPlainText = () => {
      return editorRef.current?.innerText || '';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const text = await generateScript(prompt);
      // Convert plain text to HTML paragraphs
      const html = text.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
      setScriptContent(html);
      if (editorRef.current) editorRef.current.innerHTML = html;
      setShowPromptInput(false);
      setPrompt('');
      showToast('Script generated successfully', 'success');
    } catch (e) {
      showToast('Failed to generate script. Check API Key.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprove = async () => {
    const text = getPlainText();
    if (!text.trim()) {
        showToast('Type something first to improve it', 'info');
        return;
    }
    setIsGenerating(true);
    try {
      const improvedText = await improveScript(text);
      const html = improvedText.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
      setScriptContent(html);
      if (editorRef.current) editorRef.current.innerHTML = html;
      showToast('Script polished and improved', 'success');
    } catch (e) {
      showToast('Failed to improve script.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoPace = async () => {
    const text = getPlainText();
    if (!text.trim()) {
        showToast('Please add a script first', 'info');
        return;
    }
    if (!targetDuration && !showAutoPaceDialog) {
        setShowAutoPaceDialog(true);
        return;
    }

    setShowAutoPaceDialog(false);
    setIsGenerating(true);
    try {
      const durationToUse = targetDuration || "Natural speaking pace";
      const pacedText = await autoPaceScript(text, durationToUse);
       const html = pacedText.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
      setScriptContent(html);
      if (editorRef.current) editorRef.current.innerHTML = html;
      showToast(`Pacing markers added for ${durationToUse}`, 'success');
    } catch (e) {
      showToast('Failed to auto-pace script.', 'error');
    } finally {
      setIsGenerating(false);
      setTargetDuration('');
    }
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-300 font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* --- STUDIO SIDEBAR --- */}
      <aside className="w-16 lg:w-64 bg-zinc-900/40 border-r border-zinc-800 flex flex-col justify-between py-6 z-20 backdrop-blur-xl shrink-0 transition-all duration-300">
         
         {/* Brand */}
         <div className="px-0 lg:px-6 mb-8 flex flex-col items-center lg:items-start">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl shadow-lg shadow-red-900/20 flex items-center justify-center shrink-0 border border-white/10">
                    <Play className="text-white fill-white ml-1" size={18} />
                 </div>
                 <div className="hidden lg:block">
                    <h1 className="text-lg font-bold text-white tracking-tight leading-none">GOOD SCRIPT</h1>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Studio</p>
                 </div>
             </div>
         </div>

         {/* Navigation */}
         <div className="flex-1 px-2 lg:px-4 space-y-1 overflow-y-auto custom-scrollbar">
            
            <div className="hidden lg:block px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Library</div>

            <button
                onClick={() => setShowLibrary(!showLibrary)}
                className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${showLibrary ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 hover:text-white'}`}
                title="My Scripts"
            >
                <FolderOpen size={20} className="text-zinc-500 group-hover:text-amber-400" />
                <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium">My Scripts</div>
                </div>
                {showLibrary && <ChevronRight size={14} className="ml-auto hidden lg:block opacity-50 rotate-90" />}
            </button>

             {showLibrary && (
                 <div className="pl-4 pr-2 space-y-1 mb-4 hidden lg:block animate-in slide-in-from-left-2 duration-200">
                    <button onClick={onNew} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg">
                        <Plus size={14}/> New Script
                    </button>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-0.5">
                        {scripts.map(s => (
                            <div key={s.id} className="flex items-center justify-between group/item">
                                <button 
                                    onClick={() => onLoad(s.id)}
                                    className={`text-left w-full truncate px-3 py-2 text-xs rounded-lg ${currentScriptId === s.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {s.title}
                                </button>
                                <button onClick={() => onDelete(s.id)} className="p-1 opacity-0 group-hover/item:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
                title="Import File"
            >
                <Upload size={20} className="text-zinc-500 group-hover:text-blue-400" />
                <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium">Import</div>
                </div>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.md,.json" 
                onChange={handleFileUpload} 
            />

            <div className="h-px bg-zinc-800/50 my-4 mx-2"></div>
            
            <div className="hidden lg:block px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Generate</div>
            
            <button
                onClick={() => setShowPromptInput(!showPromptInput)}
                className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-transparent ${showPromptInput ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'hover:bg-zinc-800 hover:text-white'}`}
                title="AI Script Writer"
            >
                <Wand2 size={20} className={showPromptInput ? "text-indigo-400" : "text-zinc-500 group-hover:text-indigo-400"} />
                <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium">Script Writer</div>
                </div>
            </button>

             <button
                onClick={handleImprove}
                disabled={isGenerating}
                className="w-full group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white disabled:opacity-30"
                title="Improve Grammar & Flow"
            >
                <Sparkles size={20} className="text-zinc-500 group-hover:text-purple-400" />
                <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium">Refine</div>
                </div>
            </button>

            <button
                onClick={() => setShowAutoPaceDialog(true)}
                disabled={isGenerating}
                className="w-full group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white disabled:opacity-30"
                title="Add Timing Markers"
            >
                <Timer size={20} className="text-zinc-500 group-hover:text-amber-400" />
                <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium">Auto Pacer</div>
                </div>
            </button>
         </div>

         {/* Start Button */}
         <div className="p-2 lg:p-6 border-t border-zinc-800 bg-zinc-900/20">
             <button
                onClick={onStartPrompter}
                className="w-full relative overflow-hidden flex items-center justify-center gap-3 p-3 lg:p-4 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl shadow-xl shadow-zinc-900/20 transition-all hover:scale-[1.02] active:scale-95 group font-bold tracking-tight"
                title="Start Teleprompter"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-300/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Play size={20} fill="currentColor" />
                <span className="hidden lg:block">Start</span>
             </button>
         </div>
      </aside>

      {/* --- MAIN CANVAS --- */}
      <main className="flex-1 flex flex-col relative bg-zinc-950 min-w-0">
        
        {/* Header Stats */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                 <input 
                    type="text" 
                    value={scriptTitle}
                    onChange={(e) => setScriptTitle(e.target.value)}
                    onBlur={() => onSave(scriptTitle)}
                    placeholder="Untitled Script"
                    className="bg-transparent text-sm font-medium text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-b border-zinc-700 w-full max-w-md"
                 />
                 <button onClick={() => onSave(scriptTitle)} className="text-zinc-500 hover:text-white"><Save size={16} /></button>
            </div>

            <div className="flex items-center gap-3">
                 {/* Search Bar */}
                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/50 mr-4">
                    <Search size={14} className="text-zinc-500" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Find text..."
                        className="bg-transparent text-xs text-white focus:outline-none w-24 md:w-32 placeholder-zinc-600"
                    />
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-md border border-zinc-700/50 hover:bg-zinc-800 transition-colors cursor-default">
                    <FileText size={14} className="text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-300">{stats.words}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-md border border-zinc-700/50 hover:bg-zinc-800 transition-colors cursor-default">
                    <Clock size={14} className="text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-300">{stats.time}</span>
                </div>
            </div>
        </header>

        {/* AI Command Input (Sliding) */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out border-b border-zinc-800 bg-zinc-900 ${showPromptInput ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 border-none'}`}>
             <div className="p-3 flex gap-2 max-w-3xl mx-auto">
                <div className="flex-1 relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500">
                        <Wand2 size={16} />
                    </div>
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        placeholder="Describe what you want to write..."
                        className="w-full bg-zinc-950 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-zinc-600"
                        autoFocus={showPromptInput}
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
                >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : 'Generate'}
                </button>
                 <button onClick={() => setShowPromptInput(false)} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-lg">
                    <X size={16} />
                </button>
             </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center group bg-zinc-950">
            <div className="w-full h-full max-w-3xl px-8 py-8 md:py-12 overflow-y-auto custom-scrollbar">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    className="w-full min-h-[500px] text-lg text-zinc-200 focus:outline-none font-sans leading-loose empty:before:content-[attr(placeholder)] empty:before:text-zinc-700"
                    placeholder="// Start typing your script here..."
                    spellCheck={false}
                    style={{ whiteSpace: 'pre-wrap' }}
                />
            </div>
            
            {/* FLOATING ACTION TOOLBAR (Updated for Rich Text) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-xl shadow-2xl z-20 transition-all duration-300 hover:scale-105">
                <button onMouseDown={(e) => {e.preventDefault(); execCmd('bold');}} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Bold">
                    <Bold size={18} />
                </button>
                <button onMouseDown={(e) => {e.preventDefault(); execCmd('italic');}} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Italic">
                    <Italic size={18} />
                </button>
                <button onMouseDown={(e) => {e.preventDefault(); execCmd('foreColor', '#fcd34d');}} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 transition-colors" title="Highlight Yellow">
                    <Palette size={18} />
                </button>
                 <button onMouseDown={(e) => {e.preventDefault(); execCmd('foreColor', '#ffffff');}} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Reset Color">
                    <Eraser size={18} />
                </button>
                <div className="w-px h-4 bg-zinc-700/50 mx-1"></div>
                <button onClick={() => {navigator.clipboard.writeText(editorRef.current?.innerText || ''); showToast('Copied Text');}} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Copy Text">
                    <Copy size={18} />
                </button>
                 <button onClick={() => {setScriptContent(''); if(editorRef.current) editorRef.current.innerHTML = '';}} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors" title="Clear All">
                    <Trash2 size={18} />
                </button>
            </div>
            
            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-10"></div>
        </div>
      </main>

       {/* Auto Pace Modal */}
      {showAutoPaceDialog && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl ring-1 ring-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Timer size={16} className="text-amber-500"/> 
                        Auto-Pace
                    </h3>
                    <button onClick={() => setShowAutoPaceDialog(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <p className="text-zinc-400 text-sm">
                        Desired duration? (e.g. "60s", "2m")
                    </p>

                    <div className="relative">
                        <input 
                            type="text" 
                            value={targetDuration}
                            onChange={(e) => setTargetDuration(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono text-sm"
                            autoFocus
                            placeholder="Natural Pace"
                        />
                    </div>

                    <button 
                        onClick={handleAutoPace}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-all text-sm"
                    >
                        Apply Markers
                    </button>
                </div>
             </div>
         </div>
      )}

      {/* Toast System */}
      <Toast 
        message={toast.msg} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
    </div>
  );
};