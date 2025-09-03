"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  File,
  Code,
  Globe,
  Loader2,
  Check,
  Settings,
  Filter,
  Calendar,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/utils";
import { toast } from "sonner";
import { exportService, ExportOptions, NoteData } from "@/lib/export-service";

interface ExportNotesProps {
  selectedNoteIds?: string[];
  onClose?: () => void;
  className?: string;
}

const formatOptions = [
  {
    id: "pdf",
    label: "PDF",
    icon: FileText,
    description: "Portable document with formatting",
    extension: ".pdf",
  },
  {
    id: "markdown",
    label: "Markdown",
    icon: File,
    description: "Plain text with markdown syntax",
    extension: ".md",
  },
  {
    id: "html",
    label: "HTML",
    icon: Globe,
    description: "Web page with styling",
    extension: ".html",
  },
  {
    id: "json",
    label: "JSON",
    icon: Code,
    description: "Structured data format",
    extension: ".json",
  },
  {
    id: "txt",
    label: "Plain Text",
    icon: FileText,
    description: "Simple text file",
    extension: ".txt",
  },
];

export default function ExportNotes({
  selectedNoteIds = [],
  onClose,
  className = "",
}: ExportNotesProps) {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [exportOptions, setExportOptions] = useState<
    Omit<ExportOptions, "format">
  >({
    includeMetadata: true,
    includeTags: true,
    includeSummary: true,
    customFileName: "",
  });
  const [filters, setFilters] = useState({
    dateRange: "all", // all, week, month, year
    withTags: false,
    withSummary: false,
    searchQuery: "",
  });
  const [selectAll, setSelectAll] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(
    new Set(selectedNoteIds)
  );

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notes, filters]);

  useEffect(() => {
    if (selectedNoteIds.length > 0) {
      setSelectedNotes(new Set(selectedNoteIds));
    }
  }, [selectedNoteIds]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch("/api/notes");
      const data = await response.json();

      if (response.ok && data.notes) {
        const notesData: NoteData[] = data.notes.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          summary: note.summary,
          tags: note.tags || [],
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        }));

        setNotes(notesData);
      } else {
        toast.error("Failed to load notes");
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notes];

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      let cutoffDate = new Date();

      switch (filters.dateRange) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(
        (note) => new Date(note.updatedAt) >= cutoffDate
      );
    }

    // Tags filter
    if (filters.withTags) {
      filtered = filtered.filter((note) => note.tags && note.tags.length > 0);
    }

    // Summary filter
    if (filters.withSummary) {
      filtered = filtered.filter((note) => note.summary);
    }

    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (note) =>
          (note.title && note.title.toLowerCase().includes(query)) ||
          (note.summary && note.summary.toLowerCase().includes(query)) ||
          (note.tags &&
            note.tags.some((tag) => tag.name.toLowerCase().includes(query)))
      );
    }

    setFilteredNotes(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedNotes(new Set(filteredNotes.map((note) => note.id)));
    } else {
      setSelectedNotes(new Set());
    }
  };

  const handleNoteSelect = (noteId: string, checked: boolean) => {
    const newSelected = new Set(selectedNotes);
    if (checked) {
      newSelected.add(noteId);
    } else {
      newSelected.delete(noteId);
    }
    setSelectedNotes(newSelected);
    setSelectAll(newSelected.size === filteredNotes.length);
  };

  const handleExport = async () => {
    const notesToExport = filteredNotes.filter((note) =>
      selectedNotes.has(note.id)
    );

    if (notesToExport.length === 0) {
      toast.warning("Please select at least one note to export");
      return;
    }

    try {
      setExporting(true);

      const options: ExportOptions = {
        format: selectedFormat as any,
        ...exportOptions,
      };

      await exportService.exportNotes(notesToExport, options);

      toast.success(
        `${notesToExport.length} note${
          notesToExport.length > 1 ? "s" : ""
        } exported successfully!`
      );

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export notes. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSelectedFormat = () => {
    return formatOptions.find((option) => option.id === selectedFormat);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading notes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Format & Options
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Let's export your notes in the desired format.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.id;

                return (
                  <div
                    key={format.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <h4 className="font-medium text-sm">{format.label}</h4>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Export Options
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      includeMetadata: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">Include metadata</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTags}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      includeTags: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">Include tags</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSummary}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      includeSummary: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">Include AI summaries</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename" className="text-sm">
                Custom filename (optional)
              </Label>
              <Input
                id="filename"
                placeholder="Leave empty for auto-generated name"
                value={exportOptions.customFileName}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    customFileName: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Filter Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm">Date Range</Label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
                className="w-full border rounded px-2 py-1 text-sm mt-1"
              >
                <option value="all">All time</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last month</option>
                <option value="year">Last year</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="withTags"
                checked={filters.withTags}
                onChange={(e) =>
                  setFilters({ ...filters, withTags: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="withTags" className="text-sm">
                Only notes with tags
              </Label>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="withSummary"
                checked={filters.withSummary}
                onChange={(e) =>
                  setFilters({ ...filters, withSummary: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="withSummary" className="text-sm">
                Only notes with summaries
              </Label>
            </div>
          </div>

          <div>
            <Label className="text-sm">Search notes</Label>
            <Input
              placeholder="Search by title, tags, or summary..."
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters({ ...filters, searchQuery: e.target.value })
              }
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Note Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Select Notes ({selectedNotes.size} of {filteredNotes.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="selectAll" className="text-sm">
                Select all
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notes found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more notes
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 border rounded-lg ${
                    selectedNotes.has(note.id)
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedNotes.has(note.id)}
                      onChange={(e) =>
                        handleNoteSelect(note.id, e.target.checked)
                      }
                      className="rounded mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {note.title || "Untitled Note"}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(note.updatedAt)}
                        </div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span>Tags: {note.tags.length}</span>
                          </div>
                        )}
                        {note.summary && (
                          <Badge variant="secondary" className="text-xs">
                            Summary
                          </Badge>
                        )}
                      </div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{note.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Action */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ready to export</h3>
              <p className="text-sm text-muted-foreground">
                {selectedNotes.size} note{selectedNotes.size !== 1 ? "s" : ""}{" "}
                selected • {getSelectedFormat()?.label} format
              </p>
            </div>
            <div className="flex gap-2">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleExport}
                disabled={exporting || selectedNotes.size === 0}
                className="px-6"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exporting ? "Exporting..." : "Export Notes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
