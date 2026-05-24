import { notFound } from "next/navigation";
import { getNote } from "@/actions/notes";
import { NoteEditor } from "@/components/notes/note-editor";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const note = await getNote(id);
    return <NoteEditor note={note} />;
  } catch {
    notFound();
  }
}
