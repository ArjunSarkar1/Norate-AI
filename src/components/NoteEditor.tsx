"use client";

import { Card } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { EditorRoot, EditorContent } from "./editor";
import StarterKit from "@tiptap/starter-kit";

const Editor = dynamic(() => import("./editor").then(mod => ({ default: mod.EditorContent })), { ssr: false });

export default function NoteEditor() {
  return (
    <Card className="p-0">
      <EditorRoot>
        <Editor 
          className="min-h-[400px] p-4"
          extensions={[StarterKit]}
        />
      </EditorRoot>
    </Card>
  );
} 