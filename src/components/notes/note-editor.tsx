"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { updateNote } from "@/actions/notes";
import { runAI, convertNoteToTasks } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Note } from "@/types/database";

export function NoteEditor({ note }: { note: Note }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState(note.summary);

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateNote(note.id, formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Note saved");
        router.refresh();
      }
    });
  };

  const handleSummarize = () => {
    startTransition(async () => {
      const result = await runAI("summarize_note", note.content, note.id);
      if (result.success) {
        setSummary(result.result);
        toast.success("Summarized");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  };

  const handleToTasks = () => {
    startTransition(async () => {
      const result = await convertNoteToTasks(note.content);
      if (result.success) toast.success(result.result);
      else toast.error("error" in result && result.error ? result.error : "Failed");
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/notes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleSummarize} disabled={pending}>
          <Sparkles className="h-4 w-4" /> Summarize
        </Button>
        <Button variant="outline" size="sm" onClick={handleToTasks} disabled={pending}>
          <ListChecks className="h-4 w-4" /> To Tasks
        </Button>
      </div>

      <form action={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={note.title} required className="text-lg font-medium" />
        </div>
        <input type="hidden" name="is_pinned" value={note.is_pinned ? "true" : "false"} />
        <input type="hidden" name="summary" value={summary ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            name="content"
            defaultValue={note.content}
            rows={16}
            className="font-mono text-sm leading-relaxed"
            placeholder="Write markdown-style notes..."
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Note"}
        </Button>
      </form>

      {summary && (
        <Card>
          <CardHeader><CardTitle className="text-base">AI Summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
