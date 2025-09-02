"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Edit,
  Trash2,
  Share2,
  Calendar,
  FileText,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/utils";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string | null;
  content: Record<string, unknown>;
  summary: string | null;
  tags: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await authenticatedFetch("/api/notes");
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      } else {
        toast.error("Failed to fetch notes. Please refresh the page.");
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Something went wrong while fetching notes.");
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await authenticatedFetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotes(notes.filter((note) => note.id !== noteId));
        setNoteToDelete(null);
        toast.success("Note deleted successfully!");
      } else {
        toast.error("Failed to delete note. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Something went wrong while deleting the note.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getContentPreview = (content: Record<string, unknown>) => {
    if (!content) return "No content";

    // Extract plain text from TipTap JSON content
    let text = "";
    if (typeof content === "string") {
      text = content;
    } else if (content.content) {
      text = extractTextFromTiptap(content);
    }

    return text.length > 150 ? text.substring(0, 150) + "..." : text;
  };

  const extractTextFromTiptap = (content: Record<string, unknown>): string => {
    if (!content.content || !Array.isArray(content.content)) return "";

    let text = "";
    content.content.forEach((node: Record<string, unknown>) => {
      if (node.type === "text" && typeof node.text === "string") {
        text += node.text;
      } else if (node.content) {
        text += extractTextFromTiptap(node);
      }
    });
    return text;
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      searchQuery === "" ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getContentPreview(note.content)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === null || note.tags.some((tag) => tag.id === selectedTag);

    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)));

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedTag === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTag(null)}
          >
            All
          </Button>
          {allTags.slice(0, 3).map((tag) => (
            <Button
              key={tag.id}
              variant={selectedTag === tag.id ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSelectedTag(selectedTag === tag.id ? null : tag.id)
              }
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No notes found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedTag
                  ? "Try adjusting your search or filters"
                  : "Create your first note to get started"}
              </p>
            </div>
            {!searchQuery && !selectedTag && (
              <Button asChild>
                <Link href="/dashboard/new">Create Note</Link>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {note.title || "Untitled Note"}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link href={`/dashboard/${note.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => setNoteToDelete(note)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {getContentPreview(note.content)}
                </p>

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(note.updatedAt)}
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {noteToDelete?.title || "Untitled Note"}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => noteToDelete && deleteNote(noteToDelete.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
