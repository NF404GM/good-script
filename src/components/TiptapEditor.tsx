import React, { useCallback, useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bold, Italic, Loader2 } from 'lucide-react';
import { cn } from '~/src/lib/utils';
import { useCollaboration } from '~/src/hooks/useCollaboration';

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
    onRefineSelection?: (selectedText: string) => Promise<string>;
    placeholder?: string;
    className?: string;
    textColor?: string;
    typography?: string;
    highlightedCharacter?: string;
    scriptId?: string | null;
    onUpdateCursor?: (pos: number) => void;
    onBroadcastChange?: (html: string) => void;
}

export interface TiptapEditorRef {
    insertContent: (text: string) => void;
    scrollToHeader: (text: string) => void;
}

import { FloatingToolbar } from './FloatingToolbar';

// Simple component to show collaborator cursors (visual only for now)
const RemoteCursor: React.FC<{ color: string; name: string; pos: number }> = ({ color, name, pos }) => {
    // This is a placeholder. Real implementation requires calculating coordinates from editor pos.
    return null;
};

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(({
    content,
    onChange,
    onRefineSelection,
    placeholder = "Start typing your script...",
    className,
    textColor = '#ffffff',
    typography = 'text-lg leading-relaxed',
    highlightedCharacter,
    scriptId,
    onUpdateCursor,
    onBroadcastChange,
}, ref) => {
    // Wrap the async onRefineSelection to match FloatingToolbar's expected signature if needed
    const handleRefine = useCallback(async (text: string) => {
        if (onRefineSelection) {
            const refined = await onRefineSelection(text);
            editor?.chain().focus().deleteSelection().insertContent(refined).run();
        }
    }, [onRefineSelection]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: 'tiptap prose prose-invert max-w-none focus:outline-none min-h-full selection:bg-white/20',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
            // Broadcast content change to others
            onBroadcastChange?.(html);
        },
        onSelectionUpdate: ({ editor }) => {
            const pos = editor.state.selection.from;
            onUpdateCursor?.(pos);
        }
    });

    useImperativeHandle(ref, () => ({
        insertContent: (text: string) => {
            editor?.chain().focus().insertContent(text).run();
        },
        scrollToHeader: (text: string) => {
            if (!editor) return;
            const { dom } = editor.view;
            const headers = Array.from(dom.querySelectorAll('h1, h2, h3'));
            const target = headers.find(h => h.textContent?.includes(text));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Briefly highlight
                target.animate([
                    { backgroundColor: 'transparent' },
                    { backgroundColor: 'rgba(255,255,255,0.1)' },
                    { backgroundColor: 'transparent' }
                ], { duration: 1000 });
            }
        }
    }), [editor]);

    // Sync editor content when prop changes (loading a script or remote collab update)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // If it's a remote update (handled via StudioEditor -> TiptapEditor 'content' prop)
            // we only apply if not focused OR if it's the initial load
            if (!editor.isFocused) {
                const { from, to } = editor.state.selection;
                // @ts-ignore - Tiptap types can be tricky with emitUpdate
                editor.commands.setContent(content, false);
                // Restore selection if possible
                editor.commands.setTextSelection({ from, to });
            }
        }
    }, [content, editor]);

    // Handle character highlighting
    useEffect(() => {
        if (!editor) return;

        const dom = editor.view.dom;
        const paragraphs = dom.querySelectorAll('p');

        if (!highlightedCharacter) {
            paragraphs.forEach(p => {
                p.classList.remove('highlight-focused');
                p.style.opacity = '1';
            });
            return;
        }

        const targetName = highlightedCharacter.toUpperCase();

        paragraphs.forEach((p, idx) => {
            const text = p.textContent?.trim().toUpperCase();

            // If it's the character name OR if it's the dialogue following the character name
            const isChar = p.classList.contains('s-character') && text === targetName;

            // Check if previous was the target character
            const prev = paragraphs[idx - 1];
            const isDialogueOfChar = p.classList.contains('s-dialogue') &&
                prev?.classList.contains('s-character') &&
                prev.textContent?.trim().toUpperCase() === targetName;

            if (isChar || isDialogueOfChar) {
                p.classList.add('highlight-focused');
                p.style.opacity = '1';
            } else {
                p.classList.remove('highlight-focused');
                p.style.opacity = '0.2';
            }
        });
    }, [highlightedCharacter, editor, content]); // Also re-run if content changes so we re-scan DOM

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            {/* Unified Floating Toolbar */}
            <FloatingToolbar editor={editor} onRefineSelection={handleRefine} />

            {/* Editor Content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ color: textColor }}
                className={typography}
            >
                <EditorContent editor={editor} />
            </motion.div>
        </div>
    );
});

export default TiptapEditor;
