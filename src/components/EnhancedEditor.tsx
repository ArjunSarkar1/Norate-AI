"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import CodeBlock from "@tiptap/extension-code-block";
import Placeholder from "@tiptap/extension-placeholder";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Highlighter, 
  Eye, 
  EyeOff,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useCallback } from "react";

interface EnhancedEditorProps {
  content: any;
  onUpdate: (content: any) => void;
  placeholder?: string;
  className?: string;
}

export default function EnhancedEditor({ 
  content, 
  onUpdate, 
  placeholder = "Start writing your note...",
  className = ""
}: EnhancedEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 rounded p-4 font-mono text-sm',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:pl-6 [&_h1]:text-4xl [&_h2]:text-3xl [&_h3]:text-2xl [&_blockquote]:border-l-4 [&_blockquote]:relative [&_blockquote]:text-center [&_blockquote]:inline-block [&_blockquote]:mx-auto [&_blockquote]:pl-8 [&_blockquote]:pr-8 [&_blockquote]:max-w-2xl [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:before:content-["“"] [&_blockquote]:before:text-4xl [&_blockquote]:before:absolute [&_blockquote]:before:left-2 [&_blockquote]:before:bottom-4 [&_blockquote]:before:block [&_blockquote]:after:content-["”"] [&_blockquote]:after:text-4xl [&_blockquote]:after:absolute [&_blockquote]:after:right-2 [&_blockquote]:first-letter:uppercase',
      },
    },
  });

  // Define all callback functions before any conditional returns
  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageInput(false);
    }
  }, [editor, imageUrl]);

  const togglePreview = useCallback(() => {
    setIsPreview(!isPreview);
  }, [isPreview]);

  const getWordCount = useCallback(() => {
    return editor?.getText().split(/\s+/).filter(word => word.length > 0).length || 0;
  }, [editor]);

  const getCharacterCount = useCallback(() => {
    return editor?.getText().length || 0;
  }, [editor]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editor) return;
    
    // Don't handle shortcuts if user is typing in input fields
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
          break;
        case 'i':
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
          break;
        case 'u':
          e.preventDefault();
          editor.chain().focus().toggleUnderline().run();
          break;
        case 'k':
          e.preventDefault();
          setShowLinkInput(!showLinkInput);
          break;
        case 's':
          e.preventDefault();
          // Save functionality is handled by parent component
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsHelp(!showShortcutsHelp);
          break;
      }

      if (e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'x':
            e.preventDefault();
            editor.chain().focus().toggleStrike().run();
            break;
          case 'h':
            e.preventDefault();
            editor.chain().focus().toggleHighlight().run();
            break;
          case 'l':
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
            break;
          case 'o':
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
            break;
          case 'q':
            e.preventDefault();
            editor.chain().focus().toggleBlockquote().run();
            break;
          case 'c':
            e.preventDefault();
            editor.chain().focus().toggleCodeBlock().run();
            break;
          case 'i':
            e.preventDefault();
            setShowImageInput(!showImageInput);
            break;
          case 'p':
            e.preventDefault();
            togglePreview();
            break;
          case '1':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            break;
          case '2':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            break;
          case '3':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            break;
        }
      }
    }
  }, [editor, showLinkInput, showImageInput, showShortcutsHelp, togglePreview]);

  // Add keyboard shortcut listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    icon: Icon, 
    title,
    shortcut
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: any; 
    title: string;
    shortcut?: string;
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onMouseDown={(e) => { // one click to select the button
        e.preventDefault();
        onClick();
      }}
      className="h-8 w-8 p-0"
      title={shortcut ? `${title} (${shortcut})` : title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              icon={Bold}
              title="Bold"
              shortcut="Ctrl+B"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              icon={Italic}
              title="Italic"
              shortcut="Ctrl+I"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              icon={UnderlineIcon}
              title="Underline"
              shortcut="Ctrl+U"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              icon={Strikethrough}
              title="Strikethrough"
              shortcut="Ctrl+Shift+X"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              icon={Highlighter}
              title="Highlight"
              shortcut="Ctrl+Shift+H"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              icon={Heading1}
              title="Heading 1"
              shortcut="Ctrl+Shift+1"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              icon={Heading2}
              title="Heading 2"
              shortcut="Ctrl+Shift+2"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              icon={Heading3}
              title="Heading 3"
              shortcut="Ctrl+Shift+3"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              icon={List}
              title="Bullet List"
              shortcut="Ctrl+Shift+L"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              icon={ListOrdered}
              title="Numbered List"
              shortcut="Ctrl+Shift+O"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Block Elements */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              icon={Quote}
              title="Quote"
              shortcut="Ctrl+Shift+Q"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              icon={Code}
              title="Code Block"
              shortcut="Ctrl+Shift+C"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Links and Images */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => setShowLinkInput(!showLinkInput)}
              isActive={editor.isActive('link')}
              icon={LinkIcon}
              title="Add Link"
              shortcut="Ctrl+K"
            />
            <ToolbarButton
              onClick={() => setShowImageInput(!showImageInput)}
              icon={ImageIcon}
              title="Add Image"
              shortcut="Ctrl+Shift+I"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Preview Toggle */}
          <ToolbarButton
            onClick={togglePreview}
            isActive={isPreview}
            icon={isPreview ? EyeOff : Eye}
            title={isPreview ? "Exit Preview" : "Preview"}
            shortcut="Ctrl+Shift+P"
          />

          <Separator orientation="vertical" className="h-6" />

          {/* Help */}
          <ToolbarButton
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            icon={HelpCircle}
            title="Keyboard Shortcuts"
            shortcut="Ctrl+?"
          />
        </div>

        {/* Link Input */}
        {showLinkInput && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLink()}
              className="flex-1"
            />
            <Button size="sm" onClick={addLink}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)}>Cancel</Button>
          </div>
        )}

        {/* Image Input */}
        {showImageInput && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              placeholder="Enter image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addImage()}
              className="flex-1"
            />
            <Button size="sm" onClick={addImage}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setShowImageInput(false)}>Cancel</Button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {getWordCount()} words
            </Badge>
            <Badge variant="outline">
              {getCharacterCount()} characters
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            💡 Hover over buttons to see keyboard shortcuts
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        {showShortcutsHelp && (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-semibold mb-2">Text Formatting</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Bold:</span>
                    <code className="bg-background px-1 rounded">Ctrl+B</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Italic:</span>
                    <code className="bg-background px-1 rounded">Ctrl+I</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Underline:</span>
                    <code className="bg-background px-1 rounded">Ctrl+U</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Strikethrough:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+X</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Highlight:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+H</code>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Structure</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Heading 1:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+1</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Heading 2:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+2</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Heading 3:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+3</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Bullet List:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+L</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Numbered List:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+O</code>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Blocks</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Quote:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+Q</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Code Block:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+C</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Add Link:</span>
                    <code className="bg-background px-1 rounded">Ctrl+K</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Add Image:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+I</code>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Actions</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Preview:</span>
                    <code className="bg-background px-1 rounded">Ctrl+Shift+P</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Save:</span>
                    <code className="bg-background px-1 rounded">Ctrl+S</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Shortcuts Help:</span>
                    <code className="bg-background px-1 rounded">Ctrl+?</code>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t text-center">
              <Button size="sm" variant="outline" onClick={() => setShowShortcutsHelp(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className={`${isPreview ? 'bg-muted/30' : ''}`}>
        <EditorContent 
          editor={editor} 
          className={`min-h-[400px] p-4 focus:outline-none ${
            isPreview ? 'pointer-events-none' : ''
          }`}
        />
      </div>
    </div>
  );
} 