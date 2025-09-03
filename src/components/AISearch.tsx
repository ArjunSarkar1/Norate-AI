"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Loader2,
  Brain,
  FileText,
  Clock,
  Zap,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface SearchResult {
  id: string;
  title?: string;
  summary?: string;
  similarity: number;
  createdAt: string;
  updatedAt: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  threshold: number;
  totalFound: number;
  totalNotes: number;
  message: string;
}

interface EmbeddingStats {
  totalNotes: number;
  notesWithEmbeddings: number;
  notesWithoutEmbeddings: number;
  embeddingCoverage: string;
}

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(
    null
  );
  const [processingEmbeddings, setProcessingEmbeddings] = useState(false);
  const [threshold, setThreshold] = useState(0.7);
  const [searchInfo, setSearchInfo] = useState<{
    totalFound: number;
    totalNotes: number;
  } | null>(null);

  useEffect(() => {
    loadEmbeddingStats();
  }, []);

  const loadEmbeddingStats = async () => {
    try {
      const response = await authenticatedFetch("/api/ai/embeddings");
      const data = await response.json();

      if (response.ok) {
        setEmbeddingStats(data);
      }
    } catch (error) {
      console.error("Error loading embedding stats:", error);
    }
  };

  const processAllEmbeddings = async () => {
    try {
      setProcessingEmbeddings(true);
      const response = await authenticatedFetch("/api/ai/embeddings", {
        method: "POST",
        body: JSON.stringify({ batchProcess: true }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Processed ${data.processed} notes. ${data.errors} errors.`
        );
        loadEmbeddingStats(); // Refresh stats
      } else {
        toast.error(data.error || "Failed to process embeddings");
      }
    } catch (error) {
      console.error("Error processing embeddings:", error);
      toast.error("Failed to process embeddings");
    } finally {
      setProcessingEmbeddings(false);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      toast.warning("Please enter a search query");
      return;
    }

    try {
      setSearching(true);
      const response = await authenticatedFetch("/api/ai/search", {
        method: "POST",
        body: JSON.stringify({
          query: searchQuery.trim(),
          threshold,
          limit: 20,
        }),
      });
      const data: SearchResponse = await response.json();

      if (response.ok) {
        setResults(data.results);
        setSearchInfo({
          totalFound: data.totalFound,
          totalNotes: data.totalNotes,
        });
        setHasSearched(true);

        if (data.results.length === 0) {
          toast.info(
            "No relevant notes found. Try adjusting your search or threshold."
          );
        }
      } else {
        toast.error(data.error || "Search failed");
      }
    } catch (error) {
      console.error("Error performing search:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = useCallback(() => {
    performSearch(query);
  }, [query, threshold]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
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

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9)
      return "bg-green-100 text-green-800 border-green-200";
    if (similarity >= 0.8) return "bg-blue-100 text-blue-800 border-blue-200";
    if (similarity >= 0.7)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI-Powered Semantic Search
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search your notes using natural language. AI understands context,
            not just keywords.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="What are you looking for? (e.g., 'meeting notes about project timeline')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="px-6"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <label>Similarity Threshold:</label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="0.6">60% (More Results)</option>
                <option value="0.7">70% (Balanced)</option>
                <option value="0.8">80% (More Precise)</option>
                <option value="0.9">90% (Very Precise)</option>
              </select>
            </div>
            {searchInfo && (
              <div className="text-muted-foreground">
                Found {searchInfo.totalFound} relevant notes from{" "}
                {searchInfo.totalNotes} total
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Embedding Status */}
      {embeddingStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Search Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {embeddingStats.totalNotes}
                </p>
                <p className="text-sm text-muted-foreground">Total Notes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {embeddingStats.notesWithEmbeddings}
                </p>
                <p className="text-sm text-muted-foreground">Searchable</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {embeddingStats.notesWithoutEmbeddings}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {embeddingStats.embeddingCoverage}
                </p>
                <p className="text-sm text-muted-foreground">Coverage</p>
              </div>
            </div>

            {embeddingStats.notesWithoutEmbeddings > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">
                    {embeddingStats.notesWithoutEmbeddings} notes need
                    processing
                  </p>
                  <p className="text-xs text-orange-700">
                    Process these notes to make them searchable with AI
                  </p>
                </div>
                <Button
                  onClick={processAllEmbeddings}
                  disabled={processingEmbeddings}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {processingEmbeddings ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {processingEmbeddings ? "Processing..." : "Process All"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Search Results
              {results.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {results.length}
                </Badge>
              )}
            </CardTitle>
            {query && (
              <p className="text-sm text-muted-foreground">
                Results for: <span className="font-medium">"{query}"</span>
              </p>
            )}
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try different keywords or lower the similarity threshold
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>Tips for better results:</p>
                  <ul className="mt-2 text-left inline-block">
                    <li>• Use descriptive phrases instead of single words</li>
                    <li>• Try synonyms or related terms</li>
                    <li>
                      • Lower the similarity threshold for broader results
                    </li>
                    <li>• Ensure your notes are processed for search</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Link
                    key={result.id}
                    href={`/dashboard/notes/${result.id}`}
                    className="block"
                  >
                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium truncate">
                            {result.title || "Untitled Note"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(result.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <Badge
                          className={getSimilarityColor(result.similarity)}
                          variant="outline"
                        >
                          {Math.round(result.similarity * 100)}% match
                        </Badge>
                      </div>

                      {result.summary && (
                        <>
                          <Separator className="mb-3" />
                          <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {result.summary}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!hasSearched && !searching && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-xl font-semibold mb-3">
                Ready to search your knowledge
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Enter a query above to find relevant notes using AI-powered
                semantic search. The system understands context and meaning, not
                just exact word matches.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-primary mb-2" />
                    <h4 className="font-medium text-sm ml-2 mb-1.5">
                      Example Searches
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    "project meeting yesterday", "budget planning ideas"
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-primary mb-2" />
                    <h4 className="font-medium text-sm ml-2 mb-1.5">
                      Semantic Understanding
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Finds related concepts even without exact word matches
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
