"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import NoteList from "@/components/NoteList";
import { usePathname } from "next/navigation";

export default function DashboardPage() {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col p-4 gap-4">
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Norate AI</h2>
          <Button
            asChild
            className="w-full mb-2"
            variant={pathname === "/dashboard/new" ? "default" : "outline"}
          >
            <Link href="/dashboard/new">New Note</Link>
          </Button>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <h2 className="mb-2 text-primary font-semibold">All Notes</h2>
            </li>
            <li>
              <span className="text-muted-foreground">Tags (coming soon)</span>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <Button variant="outline" className="w-full">
            Settings
          </Button>
        </div>
      </aside>
      {/* Main Area */}
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Notes</h1>
          <p className="text-muted-foreground">
            Create, organize and find notes.
          </p>
        </div>
        <NoteList />
      </main>
    </div>
  );
}
