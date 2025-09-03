"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Loader2,
  RefreshCw,
  BookOpen,
  TrendingUp,
  Clock,
  FileText,
  Sparkles,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/utils";
import { toast } from "sonner";

interface SummaryData {
  summary: string;
  keyPoints: string[];
  confidence: number;
  cached?: boolean;
}

interface Note {
  id: string;
  title?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AIRecap() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, SummaryData>>({});
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(
    null
  );
  const [stats, setStats] = useState({
    totalNotes: 0,
    notesWithSummaries: 0,
    recentlyUpdated: 0,
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch("/api/notes");
      const data = await response.json();

      if (response.ok && data.notes) {
        const sortedNotes = data.notes
          .sort(
            (a: Note, b: Note) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, 5); // Show only recent 5 notes

        setNotes(sortedNotes);

        // Calculate stats
        const totalNotes = data.notes.length;
        const notesWithSummaries = data.notes.filter(
          (note: Note) => note.summary
        ).length;
        const recentlyUpdated = data.notes.filter((note: Note) => {
          const updatedDate = new Date(note.updatedAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return updatedDate > weekAgo;
        }).length;

        setStats({ totalNotes, notesWithSummaries, recentlyUpdated });

        // Load existing summaries
        const existingSummaries: Record<string, SummaryData> = {};
        sortedNotes.forEach((note: Note) => {
          if (note.summary) {
            existingSummaries[note.id] = {
              summary: note.summary,
              keyPoints: [],
              confidence: 1.0,
              cached: true,
            };
          }
        });
        setSummaries(existingSummaries);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (noteId: string) => {
    try {
      setGeneratingSummary(noteId);
      const response = await authenticatedFetch(
        `/api/ai/summarize?noteId=${noteId}`
      );
      const data = await response.json();

      if (response.ok) {
        setSummaries((prev) => ({
          ...prev,
          [noteId]: {
            summary: data.summary,
            keyPoints: data.keyPoints || [],
            confidence: data.confidence || 0.5,
            cached: data.cached || false,
          },
        }));

        if (!data.cached) {
          toast.success("Summary generated successfully!");
        }
      } else {
        toast.error(data.error || "Failed to generate summary");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setGeneratingSummary(null);
    }
  };

  const generateBulkSummaries = async () => {
    const notesWithoutSummaries = notes.filter((note) => !summaries[note.id]);

    if (notesWithoutSummaries.length === 0) {
      toast.info("All visible notes already have summaries");
      return;
    }

    for (const note of notesWithoutSummaries) {
      await generateSummary(note.id);
      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your notes...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your Notes Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">
                {stats.totalNotes}
              </p>
              <p className="text-sm text-muted-foreground">Total Notes</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {stats.notesWithSummaries}
              </p>
              <p className="text-sm text-muted-foreground">With AI Summaries</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-600">
                {stats.recentlyUpdated}
              </p>
              <p className="text-sm text-muted-foreground">Updated This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notes with AI Summaries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Recent Notes & AI Summaries
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadNotes}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateBulkSummaries}
                disabled={generatingSummary !== null}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notes found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first note to see AI-powered summaries here
              </p>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note, index) => {
                const summary = summaries[note.id];
                const isGenerating = generatingSummary === note.id;

                return (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium truncate">
                          {note.title || "Untitled Note"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.updatedAt)}
                          </span>
                          {summary?.cached && (
                            <Badge variant="secondary" className="text-xs">
                              Cached
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!summary && !isGenerating && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateSummary(note.id)}
                        >
                          <Brain className="h-4 w-4 mr-1" />
                          Summarize
                        </Button>
                      )}
                      {isGenerating && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generating...
                        </div>
                      )}
                    </div>

                    {summary && (
                      <div className="space-y-3">
                        <Separator />
                        <div>
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            AI Summary
                            {summary.confidence && (
                              <Badge
                                variant={
                                  summary.confidence > 0.8
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {Math.round(summary.confidence * 100)}%
                                confidence
                              </Badge>
                            )}
                          </h5>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {summary.summary}
                          </p>
                        </div>

                        {summary.keyPoints && summary.keyPoints.length > 0 && (
                          <div>
                            <h6 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                              Key Points
                            </h6>
                            <ul className="list-disc list-inside space-y-1">
                              {summary.keyPoints.map((point, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-muted-foreground"
                                >
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
