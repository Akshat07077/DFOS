import { getNotes } from "@/actions/notes";
import { NotesView } from "@/components/notes/notes-view";

export default async function NotesPage() {
  const notes = await getNotes();
  return <NotesView notes={notes} />;
}
