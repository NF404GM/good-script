import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Command, Wand2, Play, Save,
    Settings as SettingsIcon, FilePlus, Sparkles, Timer,
    Hash, History, X
} from 'lucide-react';
import { cn } from '~/src/lib/utils';

interface CommandItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
    category: 'General' | 'AI' | 'Scripts';
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredCommands = commands.filter(cmd =>
        cmd.title.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => (i + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
                onClose();
            }
        }
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    // Group by category
    const categories = Array.from(new Set(filteredCommands.map(c => c.category)));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-surface-1/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-4 border-b border-white/5 bg-white/[0.02]">
                            <Search className="text-zinc-500 mr-3" size={20} />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 text-lg"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                <span className="text-[10px] font-bold text-zinc-500">ESC</span>
                            </div>
                        </div>

                        {/* Command List */}
                        <div className="max-h-[60vh] overflow-y-auto py-2 custom-scrollbar">
                            {filteredCommands.length === 0 ? (
                                <div className="px-6 py-12 text-center text-zinc-500">
                                    No commands found for "{search}"
                                </div>
                            ) : (
                                categories.map(cat => (
                                    <div key={cat} className="mb-2">
                                        <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            {cat}
                                        </div>
                                        {filteredCommands.filter(c => c.category === cat).map((cmd) => {
                                            const globalIndex = filteredCommands.findIndex(fc => fc.id === cmd.id);
                                            const isSelected = globalIndex === selectedIndex;

                                            return (
                                                <button
                                                    key={cmd.id}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    onClick={() => {
                                                        cmd.action();
                                                        onClose();
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-4 px-4 py-3 transition-all text-left",
                                                        isSelected ? "bg-accent-cyan/10 text-white" : "text-zinc-400 hover:text-zinc-200"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                        isSelected ? "bg-white text-black" : "bg-white/5 text-zinc-500"
                                                    )}>
                                                        {cmd.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium">{cmd.title}</div>
                                                        <div className="text-xs text-zinc-500 truncate">{cmd.description}</div>
                                                    </div>
                                                    {cmd.shortcut && (
                                                        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-600">
                                                            {cmd.shortcut.split('+').map(key => (
                                                                <span key={key} className="px-1.5 py-0.5 rounded border border-white/5 bg-white/5 lowercase">
                                                                    {key}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                                <div className="flex items-center gap-1">
                                    <span className="px-1 py-0.5 rounded bg-white/5 border border-white/10 uppercase font-mono tracking-tighter">↑↓</span>
                                    <span>to navigate</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="px-1 py-0.5 rounded bg-white/5 border border-white/10 uppercase font-mono tracking-tighter">Enter</span>
                                    <span>to select</span>
                                </div>
                            </div>
                            <div className="text-[10px] text-white/40 font-medium tracking-widest uppercase">
                                GOOD SCRIPT STUDIO
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
