import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
    Bold, Italic, List, Sparkles,
    Type, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '~/src/lib/utils';

interface FloatingToolbarProps {
    editor: Editor | null;
    onRefineSelection?: (text: string) => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor, onRefineSelection }) => {
    if (!editor) return null;

    return (
        <BubbleMenu
            editor={editor}
            updateDelay={100}
            className="flex items-center gap-0.5 p-1 bg-surface-2/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
        >
            <div className="flex items-center gap-0.5 border-r border-white/5 pr-1 mr-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                        "h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5",
                        editor.isActive('bold') && "text-white bg-white/10"
                    )}
                >
                    <Bold size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                        "h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5",
                        editor.isActive('italic') && "text-white bg-white/10"
                    )}
                >
                    <Italic size={14} />
                </Button>
            </div>

            <div className="flex items-center gap-0.5 border-r border-white/5 pr-1 mr-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn(
                        "h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5",
                        editor.isActive('heading', { level: 2 }) && "text-white bg-white/10"
                    )}
                >
                    <Type size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(
                        "h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5",
                        editor.isActive('bulletList') && "text-white bg-white/10"
                    )}
                >
                    <List size={14} />
                </Button>
            </div>

            <Button
                variant="ghost"
                className="h-8 px-2.5 flex items-center gap-2 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => {
                    const selection = editor.state.selection;
                    const text = editor.state.doc.textBetween(selection.from, selection.to);
                    if (text && onRefineSelection) {
                        onRefineSelection(text);
                    }
                }}
            >
                <Sparkles size={12} fill="currentColor" />
                AI Refine
            </Button>
        </BubbleMenu>
    );
};

export default FloatingToolbar;
