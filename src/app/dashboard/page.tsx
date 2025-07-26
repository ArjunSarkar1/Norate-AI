"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import NoteList from "@/components/NoteList";
import NoteEditor from "@/components/NoteEditor";
import AIRecap from "@/components/AIRecap";
import AISearch from "@/components/AISearch";
import { usePathname } from "next/navigation";

export default function DashboardPage() {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col p-4 gap-4">
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Norate AI</h2>
          <Button asChild className="w-full mb-2" variant={pathname === "/dashboard/new" ? "default" : "outline"}>
            <Link href="/dashboard/new">+ New Note</Link>
          </Button>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className={pathname === "/dashboard" ? "text-primary font-semibold" : "text-foreground hover:underline"}>All Notes</Link>
            </li>
            <li>
              <span className="text-muted-foreground">Tags (coming soon)</span>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <Button variant="outline" className="w-full">Settings</Button>
        </div>
      </aside>
      {/* Main Area */}
      <main className="flex-1 p-8 space-y-8">
        <section>
          <h1 className="text-2xl font-bold mb-4">Your Notes</h1>
          <NoteList />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Note Editor</h2>
          <NoteEditor />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">AI Recap</h2>
          <AIRecap />
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Semantic Search</h2>
          <AISearch />
        </section>
      </main>
    </div>
  );
} 