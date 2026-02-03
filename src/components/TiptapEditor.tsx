import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bold, Italic, Loader2 } from 'lucide-react';
import { cn } from '~/src/lib/utils';

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
    onRefineSelection?: (selectedText: string) => Promise<string>;
    placeholder?: string;
    className?: string;
    textColor?: string;
    typography?: string;
}

import { FloatingToolbar } from './FloatingToolbar';

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
    content,
    onChange,
    onRefineSelection,
    placeholder = "Start typing your script...",
    className,
    textColor = '#ffffff',
    typography = 'text-lg leading-relaxed',
}) => {
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
        },
    });

    // Sync editor content when prop changes (e.g. loading a different script)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

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
};

export default TiptapEditor;
