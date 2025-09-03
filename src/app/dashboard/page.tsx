"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import NoteList from "@/components/NoteList";
import AIRecap from "@/components/AIRecap";
import AISearch from "@/components/AISearch";
import ExportNotes from "@/components/ExportNotes";
import { usePathname } from "next/navigation";
import {
  FileText,
  Brain,
  Search,
  Download,
  Settings,
  Sparkles,
  Save,
  Zap,
} from "lucide-react";

type ViewType = "notes" | "ai-recap" | "ai-search" | "export";

export default function DashboardPage() {
  const pathname = usePathname();
  const [activeView, setActiveView] = useState<ViewType>("notes");

  const navigationItems = [
    {
      id: "notes" as ViewType,
      label: "All Notes",
      icon: FileText,
      description: "View and manage your notes",
    },
    {
      id: "ai-recap" as ViewType,
      label: "AI Recap",
      icon: Sparkles,
      description: "AI-powered summaries",
      badge: "AI",
    },
    {
      id: "ai-search" as ViewType,
      label: "Semantic Search",
      icon: Search,
      description: "Search with natural language",
      badge: "AI",
    },
    {
      id: "export" as ViewType,
      label: "Export Notes",
      icon: Download,
      description: "Export in multiple formats",
    },
  ];

  const renderMainContent = () => {
    switch (activeView) {
      case "notes":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Notes</h1>
              <p className="text-muted-foreground">
                Create, organize and find your notes with AI-powered features.
              </p>
            </div>
            <NoteList />
          </div>
        );
      case "ai-recap":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                AI Recap
              </h1>
              <p className="text-muted-foreground">
                Get intelligent summaries and insights from your notes using
                advanced AI.
              </p>
            </div>
            <AIRecap />
          </div>
        );
      case "ai-search":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                Semantic Search
              </h1>
              <p className="text-muted-foreground">
                Find your notes using natural language queries. AI understands
                context, not just keywords.
              </p>
            </div>
            <AISearch />
          </div>
        );
      case "export":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                Export Notes
              </h1>
              <p className="text-muted-foreground">
                Export your notes in various formats including PDF, Markdown,
                HTML, and more.
              </p>
            </div>
            <ExportNotes />
          </div>
        );
      default:
        return null;
    }
  };

  const getViewTitle = () => {
    const item = navigationItems.find((item) => item.id === activeView);
    return item?.label || "Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Enhanced Sidebar */}
      <aside className="w-72 bg-card border-r border-border flex flex-col p-4 gap-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">Norate AI</h2>
          </div>

          <Button
            asChild
            className="w-full mb-4"
            variant={pathname === "/dashboard/new" ? "default" : "outline"}
          >
            <Link href="/dashboard/new">New Note</Link>
          </Button>
        </div>

        <nav className="flex-1 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted/50"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* AI Features Highlight */}
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">AI-Powered Features</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Automatic summarization</li>
            <li>• Semantic search</li>
            <li>• Smart title suggestions</li>
            <li>• Multi-format export</li>
          </ul>
        </Card>

        <div className="mt-auto space-y-2">
          <Button variant="outline" className="w-full" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">{renderMainContent()}</main>
    </div>
  );
}
