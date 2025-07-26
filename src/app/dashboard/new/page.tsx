import NoteEditor from "@/components/NoteEditor";

export default function NewNotePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create a New Note</h1>
      <NoteEditor />
    </div>
  );
} 