"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, ArrowLeft, Tag, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/utils";
import { toast } from "sonner";
import EnhancedEditor from "./EnhancedEditor";

interface NoteEditorProps {
  noteId?: string;
  initialData?: {
    title?: string;
    content?: unknown; // Use unknown for stricter typing
    tags?: { id: string; name: string }[];
  };
}
export default function NoteEditor({ noteId, initialData }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(
    initialData?.content || { type: "doc", content: [] },
  );
  const [tags, setTags] = useState<{ id: string; name: string }[]>(
    initialData?.tags || [],
  );
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(!!noteId);
  const [redirecting, setRedirecting] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>(
    noteId,
  );
  const handleManualSaveRef = useRef<() => Promise<void>>(() =>
    Promise.resolve(),
  );
  const noteLoadedRef = useRef(false);

  // Auto-save functionality
  const saveNote = useCallback(
    async (isAutoSave = false) => {
      if (!content || (isAutoSave && !title && !content)) return;

      setSaving(true);
      try {
        const url = currentNoteId
          ? `/api/notes/${currentNoteId}`
          : "/api/notes";
        const method = currentNoteId ? "PUT" : "POST";

        const response = await authenticatedFetch(url, {
          method,
          body: JSON.stringify({
            title: title || null,
            content,
            tagIds: tags.map((tag) => tag.id),
          }),
        });

        if (response.ok) {
          // Only update noteId if this was a POST (new note)
          if (!currentNoteId) {
            const data = await response.json();
            if (data.note && data.note.id) {
              setCurrentNoteId(data.note.id);
            }
          }
          setLastSaved(new Date());
          if (!isAutoSave) toast.success("Note saved successfully!");
        }
      } catch (error) {
        console.error("Error saving note:", error);
        if (!isAutoSave) {
          toast.error("Failed to save note. Please try again.");
        } else {
          // Only show auto-save error if it's not a network issue
          toast.warning("Auto-save failed. Your changes may not be saved.");
        }
      } finally {
        setSaving(false);
      }
    },
    [title, content, tags, currentNoteId],
  );

  // Manual save with redirect
  const handleManualSave = useCallback(async () => {
    if (
      !content ||
      (typeof content === "object" &&
        (!("type" in content) || !("content" in content)))
    ) {
      toast.warning("Please add some content before saving.");
      return;
    }

    setSaving(true);
    try {
      await saveNote(false);
      // Show redirecting state
      setRedirecting(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      // Error already handled in saveNote
      toast.error("Failed to save and redirect. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [saveNote, router, content]);

  // Update ref with current function
  useEffect(() => {
    handleManualSaveRef.current = handleManualSave;
  }, [handleManualSave]);

  // Auto-save on content change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content && Object.keys(content).length > 0) {
        saveNote(true);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [content, saveNote]);

  // Keyboard shortcut for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSaveRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load existing note data
  useEffect(() => {
    if (noteId && !noteLoadedRef.current) {
      noteLoadedRef.current = true;
      setLoading(true);

      authenticatedFetch(`/api/notes/${noteId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.note) {
            setTitle(data.note.title || "");
            setContent(data.note.content || { type: "doc", content: [] });
            setTags(data.note.tags || []);
            // Only show success toast if it's actually a meaningful load (not empty note)
            if (
              data.note.title ||
              (data.note.content &&
                data.note.content.content &&
                data.note.content.content.length > 0)
            ) {
              toast.success("Note loaded successfully!");
            }
          } else {
            toast.error("Note not found.");
            router.push("/dashboard");
          }
        })
        .catch((error) => {
          console.error("Error loading note:", error);
          toast.error("Failed to load note. Redirecting to dashboard.");
          router.push("/dashboard");
        })
        .finally(() => setLoading(false));
    } else if (!noteId) {
      // Reset the ref when switching to a new note (without noteId)
      noteLoadedRef.current = false;
      setLoading(false);
    }
  }, [noteId, router]);

  const addTag = async () => {
    if (
      newTag.trim() &&
      !tags.find((tag) => tag.name.toLowerCase() === newTag.toLowerCase())
    ) {
      try {
        const response = await authenticatedFetch("/api/tags", {
          method: "POST",
          body: JSON.stringify({ name: newTag.trim() }),
        });

        if (response.ok) {
          const data = await response.json();
          setTags([...tags, data.tag]);
          setNewTag("");
          toast.success(`Tag "${newTag.trim()}" added successfully!`);
        } else {
          const errorData = await response.json();
          toast.error(
            errorData.error || "Failed to create tag. Please try again.",
          );
        }
      } catch (error) {
        console.error("Error creating tag:", error);
        toast.error("Failed to create tag. Please try again.");
      }
    }
  };

  const removeTag = (tagId: string) => {
    const removedTag = tags.find((tag) => tag.id === tagId);
    setTags(tags.filter((tag) => tag.id !== tagId));
    if (removedTag) {
      toast.warning(`Tag "${removedTag.name}" removed from note.`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading note...</span>
        </div>
      </Card>
    );
  }

  if (redirecting) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Saving note...</h3>
            <p className="text-muted-foreground">Redirecting to dashboard</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <CardTitle className="text-lg">
                {noteId ? "Edit Note" : "Create New Note"}
              </CardTitle>
              {lastSaved && (
                <p className="text-xs text-muted-foreground">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleManualSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            placeholder="Enter note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                {tag.name}
                <button
                  onClick={() => removeTag(tag.id)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addTag} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <EnhancedEditor
            content={content}
            onUpdate={setContent}
            placeholder="Start writing your note..."
            className="min-h-[400px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
