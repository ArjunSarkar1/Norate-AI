import NoteEditor from "@/components/NoteEditor";
import NoteList from "@/components/NoteList";

export default function NoteDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Note Details (ID: {params.id})</h1>
      <NoteEditor />
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Other Notes</h2>
        <NoteList />
      </div>
    </div>
  );
} 