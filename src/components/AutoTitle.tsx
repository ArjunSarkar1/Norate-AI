"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  Lightbulb,
  Wand2,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/utils";
import { toast } from "sonner";

interface AutoTitleProps {
  noteId?: string;
  content: any;
  currentTitle?: string;
  onTitleSelect?: (title: string) => void;
  onTitleApply?: (title: string) => void;
  className?: string;
  compact?: boolean;
}

interface TitleSuggestion {
  suggestions: string[];
  recommended: string;
  confidence: number;
}

export default function AutoTitle({
  noteId,
  content,
  currentTitle,
  onTitleSelect,
  onTitleApply,
  className = "",
  compact = false,
}: AutoTitleProps) {
  const [suggestions, setSuggestions] = useState<TitleSuggestion | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (currentTitle) {
      setSelectedTitle(currentTitle);
    }
  }, [currentTitle]);

  const generateTitleSuggestions = async () => {
    if (!content) {
      toast.warning("Please add some content first");
      return;
    }

    try {
      setGenerating(true);
      const response = await authenticatedFetch("/api/ai/auto-title", {
        method: "POST",
        body: JSON.stringify({
          noteId,
          content,
          applyTitle: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuggestions({
          suggestions: data.suggestions || [],
          recommended: data.recommended,
          confidence: data.confidence || 0.5,
        });

        if (!selectedTitle && data.recommended) {
          setSelectedTitle(data.recommended);
        }

        toast.success("Title suggestions generated!");
      } else {
        toast.error(data.error || "Failed to generate titles");
      }
    } catch (error) {
      console.error("Error generating titles:", error);
      toast.error("Failed to generate title suggestions");
    } finally {
      setGenerating(false);
    }
  };

  const applyTitle = async (title: string) => {
    if (!title.trim()) {
      toast.warning("Please select a title");
      return;
    }

    if (!noteId) {
      // If no noteId, just call the callback
      if (onTitleSelect) {
        onTitleSelect(title);
      }
      toast.success("Title selected!");
      return;
    }

    try {
      setApplying(true);
      const response = await authenticatedFetch("/api/ai/auto-title", {
        method: "POST",
        body: JSON.stringify({
          noteId,
          content,
          applyTitle: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (onTitleApply) {
          onTitleApply(title);
        }
        toast.success("Title applied successfully!");
      } else {
        toast.error(data.error || "Failed to apply title");
      }
    } catch (error) {
      console.error("Error applying title:", error);
      toast.error("Failed to apply title");
    } finally {
      setApplying(false);
    }
  };

  const handleTitleSelect = (title: string) => {
    setSelectedTitle(title);
    if (onTitleSelect) {
      onTitleSelect(title);
    }
  };

  const handleCustomTitleSubmit = () => {
    if (customTitle.trim()) {
      handleTitleSelect(customTitle.trim());
      setCustomTitle("");
      setShowCustomInput(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50 border-green-200";
    if (confidence >= 0.6) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateTitleSuggestions}
            disabled={generating}
            className="flex-shrink-0"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Wand2 className="h-4 w-4 mr-1" />
            )}
            {generating ? "Generating..." : "AI Title"}
          </Button>

          {suggestions && suggestions.suggestions.length > 0 && (
            <div className="flex-1 min-w-0">
              <select
                value={selectedTitle}
                onChange={(e) => handleTitleSelect(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm truncate"
              >
                <option value="">Select a title...</option>
                {suggestions.suggestions.map((suggestion, index) => (
                  <option key={index} value={suggestion}>
                    {suggestion}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTitle && noteId && (
            <Button
              size="sm"
              onClick={() => applyTitle(selectedTitle)}
              disabled={applying}
            >
              {applying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Apply
            </Button>
          )}
        </div>

        {suggestions && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>
              {suggestions.suggestions.length} suggestions generated
            </span>
            {suggestions.confidence && (
              <Badge
                variant="outline"
                className={`text-xs ${getConfidenceColor(suggestions.confidence)}`}
              >
                {Math.round(suggestions.confidence * 100)}% confidence
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Title Suggestions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Let AI suggest perfect titles based on your content
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={generateTitleSuggestions}
            disabled={generating}
            className="flex-1"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {generating ? "Generating..." : "Generate Suggestions"}
          </Button>
          <Button
            variant="outline"
            onClick={generateTitleSuggestions}
            disabled={generating}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {suggestions && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4" />
              <span>{suggestions.suggestions.length} suggestions generated</span>
              {suggestions.confidence && (
                <Badge
                  variant="outline"
                  className={getConfidenceColor(suggestions.confidence)}
                >
                  {Math.round(suggestions.confidence * 100)}% confidence
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Select a title:</h4>
              <div className="space-y-2">
                {suggestions.suggestions.map((suggestion, index) => {
                  const isRecommended = suggestion === suggestions.recommended;
                  const isSelected = suggestion === selectedTitle;

                  return (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => handleTitleSelect(suggestion)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1 text-sm">{suggestion}</span>
                        <div className="flex items-center gap-2">
                          {isRecommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Or create custom:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  Custom
                </Button>
              </div>

              {showCustomInput && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your custom title..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCustomTitleSubmit();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleCustomTitleSubmit}
                    disabled={!customTitle.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            {selectedTitle && (
              <div className="flex gap-2 pt-2 border-t">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    Selected title:
                  </p>
                  <p className="text-sm font-medium">{selectedTitle}</p>
                </div>
                <Button
                  onClick={() => applyTitle(selectedTitle)}
                  disabled={applying || !selectedTitle}
                >
                  {applying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {applying ? "Applying..." : noteId ? "Apply to Note" : "Use Title"}
                </Button>
              </div>
            )}
          </div>
        )}

        {!suggestions && !generating && (
          <div className="text-center py-6">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-2">Ready to suggest titles</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add some content to your note, then click "Generate Suggestions" to get AI-powered title ideas.
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground max-w-sm mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Analyzes your content context</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Suggests multiple creative options</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Provides confidence ratings</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
