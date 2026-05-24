"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createNote, togglePinNote } from "@/actions/notes";
import { runAI } from "@/actions/ai";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Note } from "@/types/database";

export function NotesView({ notes: initialNotes }: { notes: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createNote(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Note created");
      setDialogOpen(false);
      router.refresh();
    });
  };

  const handlePin = (id: string, pinned: boolean) => {
    startTransition(async () => {
      await togglePinNote(id, pinned);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_pinned: pinned } : n))
      );
      router.refresh();
    });
  };

  const handleSummarize = (note: Note) => {
    startTransition(async () => {
      const result = await runAI("summarize_note", note.content, note.id);
      if (result.success) {
        toast.success("Note summarized");
        router.refresh();
      } else {
        toast.error(result.error ?? "Summarization failed");
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Notes" description="Second brain — ideas, workflows, meeting notes">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> New Note</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Note</DialogTitle></DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" rows={8} placeholder="Write your thoughts..." />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Creating..." : "Create Note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No notes found"
          description="Capture ideas, workflows, and decisions."
          action={{ label: "New Note", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <Card key={note.id} className="group transition-all hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/notes/${note.id}`}>
                    <CardTitle className="text-base line-clamp-1 hover:text-primary transition-colors">
                      {note.title}
                    </CardTitle>
                  </Link>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handlePin(note.id, !note.is_pinned)}
                    >
                      {note.is_pinned ? (
                        <PinOff className="h-3.5 w-3.5" />
                      ) : (
                        <Pin className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleSummarize(note)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {note.is_pinned && (
                  <span className="text-[10px] text-primary font-medium">PINNED</span>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.summary || note.content || "Empty note"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(note.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
