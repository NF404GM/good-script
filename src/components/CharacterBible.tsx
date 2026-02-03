import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus, X, Trash2, Edit2, Check, UserCircle, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { Character } from '~/src/types';
import { cn } from '~/src/lib/utils';
import { Button } from './ui/button';
import { useGemini } from '~/src/hooks/useGemini';

interface CharacterBibleProps {
    characters: Character[];
    onClose: () => void;
    onAdd: (character: Character) => void;
    onUpdate: (character: Character) => void;
    onDelete: (id: string) => void;
    highlightedId: string | null;
    onToggleHighlight: (id: string | null) => void;
    isDark?: boolean;
}

export const CharacterBible: React.FC<CharacterBibleProps> = ({
    characters,
    onClose,
    onAdd,
    onUpdate,
    onDelete,
    highlightedId,
    onToggleHighlight,
    isDark = true,
}) => {
    const { generateCharacterBio, isLoading: isAiLoading } = useGemini();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newChar, setNewChar] = useState<Partial<Character>>({
        name: '',
        description: '',
        traits: [],
        color: '#ffffff',
    });

    const handleAiBio = async (name: string) => {
        if (!name) return;
        try {
            const bio = await generateCharacterBio(name);
            if (editingId) {
                const char = characters.find(c => c.id === editingId);
                if (char) onUpdate({ ...char, description: bio });
            } else {
                setNewChar(prev => ({ ...prev, description: bio }));
            }
        } catch (e) {
            console.error("AI bio generation failed", e);
        }
    };

    const handleSaveNew = () => {
        if (!newChar.name) return;
        const char: Character = {
            id: crypto.randomUUID(),
            name: newChar.name,
            description: newChar.description || '',
            traits: newChar.traits || [],
            color: newChar.color || '#ffffff',
            ...newChar,
        } as Character;
        onAdd(char);
        setIsAdding(false);
        setNewChar({ name: '', description: '', traits: [], color: '#ffffff' });
    };

    const handleUpdate = (char: Character) => {
        onUpdate(char);
        setEditingId(null);
    };

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
                "fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 shadow-2xl z-50 flex flex-col border-l",
                isDark ? "bg-surface-1 border-white/5 text-white" : "bg-[#f5f5f5] border-black/10 text-black"
            )}
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <UserCircle className="text-zinc-500" size={24} />
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Character Bible</h2>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none mt-1">Consistency Tracker</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <X size={20} className="text-zinc-500" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {characters.length === 0 && !isAdding && (
                    <div className="text-center py-12 opacity-40">
                        <User size={48} className="mx-auto mb-4" />
                        <p className="text-sm">No characters defined yet.</p>
                        <p className="text-xs mt-1">Start adding your cast to keep them consistent.</p>
                    </div>
                )}

                {characters.map((char) => (
                    <div
                        key={char.id}
                        className={cn(
                            "p-4 rounded-xl border transition-all duration-200 group",
                            isDark ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white border-black/5 hover:border-black/10"
                        )}
                    >
                        {editingId === char.id ? (
                            <div className="space-y-3">
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-white/20"
                                    value={char.name}
                                    onChange={(e) => onUpdate({ ...char, name: e.target.value })}
                                    autoFocus
                                />
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs min-h-[60px] focus:outline-none focus:border-white/20"
                                    value={char.description}
                                    onChange={(e) => onUpdate({ ...char, description: e.target.value })}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingId(null)} className="p-1 px-3 text-xs opacity-50 hover:opacity-100 italic">Cancel</button>
                                    <button onClick={() => setEditingId(null)} className="p-1 px-3 bg-white text-black rounded text-xs font-bold">Done</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onToggleHighlight(highlightedId === char.id ? null : char.id)}
                                            className={cn(
                                                "p-1 rounded transition-colors",
                                                highlightedId === char.id ? "bg-white text-black" : "hover:bg-white/10 text-zinc-500"
                                            )}
                                        >
                                            {highlightedId === char.id ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <h3 className="font-bold text-sm uppercase tracking-wide">{char.name}</h3>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                        <button onClick={() => setEditingId(char.id)} className="p-1 hover:bg-white/10 rounded">
                                            <Edit2 size={14} className="text-zinc-500" />
                                        </button>
                                        <button onClick={() => onDelete(char.id)} className="p-1 hover:bg-red-500/10 rounded group/del">
                                            <Trash2 size={14} className="text-zinc-500 group-hover/del:text-red-500" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 italic line-clamp-3 mb-3 leading-relaxed">
                                    {char.description || "No description provided."}
                                </p>
                                <div className="flex items-center gap-2">
                                    {char.role && (
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-400 uppercase tracking-tighter">
                                            {char.role}
                                        </span>
                                    )}
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: char.color }} />
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "p-4 rounded-xl border border-dashed border-white/20",
                            isDark ? "bg-white/5" : "bg-white"
                        )}
                    >
                        <input
                            placeholder="Name..."
                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm mb-2 focus:outline-none focus:border-white/20"
                            value={newChar.name}
                            onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                            autoFocus
                        />
                        <div className="relative">
                            <textarea
                                placeholder="Description, bio, motivation..."
                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs min-h-[80px] mb-3 focus:outline-none focus:border-white/20 pr-8"
                                value={newChar.description}
                                onChange={(e) => setNewChar({ ...newChar, description: e.target.value })}
                            />
                            <button
                                onClick={() => handleAiBio(newChar.name || '')}
                                disabled={isAiLoading || !newChar.name}
                                className="absolute right-2 bottom-5 p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
                                title="Generate AI Bio"
                            >
                                {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            </button>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="text-xs opacity-50 hover:opacity-100 px-2">Cancel</button>
                            <Button onClick={handleSaveNew} size="sm" className="bg-white text-black hover:bg-zinc-200 h-8">
                                <Check size={14} className="mr-1" /> Save Cast
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Footer / Add Button */}
            {!isAdding && (
                <div className="p-6">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 border border-dashed border-white/10 hover:border-white/30 rounded-xl flex items-center justify-center gap-2 group transition-all"
                    >
                        <div className="p-1 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                            <Plus size={16} className="text-zinc-500 group-hover:text-white" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500 group-hover:text-white">Add Character</span>
                    </button>
                </div>
            )}
        </motion.div>
    );
};
