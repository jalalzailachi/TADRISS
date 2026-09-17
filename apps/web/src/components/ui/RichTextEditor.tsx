'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  action,
  isActive,
  icon,
  label,
}: {
  editor: Editor;
  action: () => void;
  isActive: boolean;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={action}
      aria-label={label}
      className={`p-1.5 rounded-md transition-colors ${
        isActive
          ? 'bg-primary-container/20 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3 text-on-surface',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest overflow-hidden"
      data-placeholder={placeholder}
    >
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-outline-variant/30 bg-surface-container-low/50">
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon="format_bold"
          label="Bold"
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon="format_italic"
          label="Italic"
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon="format_underlined"
          label="Underline"
        />
        <div className="mx-1 h-5 w-px bg-outline-variant/40" />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon="title"
          label="Heading"
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon="format_list_bulleted"
          label="Bullet list"
        />
        <ToolbarButton
          editor={editor}
          action={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon="format_list_numbered"
          label="Numbered list"
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
