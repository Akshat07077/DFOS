"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geminiService, type AIRequestType } from "@/lib/ai/gemini";
import { createTask } from "@/actions/tasks";

async function buildWorkspaceContext() {
  const supabase = await createClient();

  const [projects, tasks, notes, updates] = await Promise.all([
    supabase.from("projects").select("id, title, status, priority, deadline, description").limit(20),
    supabase.from("tasks").select("id, title, status, priority, deadline, project_id, blockers").neq("status", "done").limit(30),
    supabase.from("notes").select("id, title, content, summary").order("updated_at", { ascending: false }).limit(15),
    supabase.from("updates").select("message, created_at, project_id").order("created_at", { ascending: false }).limit(20),
  ]);

  return JSON.stringify(
    {
      projects: projects.data ?? [],
      openTasks: tasks.data ?? [],
      recentNotes: (notes.data ?? []).map((n) => ({
        ...n,
        content: n.content?.slice(0, 500),
      })),
      recentUpdates: updates.data ?? [],
    },
    null,
    2
  );
}

export async function runAI(
  type: AIRequestType,
  content: string,
  noteId?: string
) {
  const context = await buildWorkspaceContext();
  const response = await geminiService.generate({ type, content, context });

  if (type === "summarize_note" && noteId && response.success) {
    const supabase = await createClient();
    await supabase.from("notes").update({ summary: response.result }).eq("id", noteId);
    revalidatePath(`/notes/${noteId}`);
    revalidatePath("/notes");
  }

  return response;
}

export async function convertNoteToTasks(noteContent: string) {
  const response = await geminiService.generate({
    type: "note_to_tasks",
    content: noteContent,
  });

  if (!response.success) return response;

  try {
    const tasks = JSON.parse(response.result) as Array<{
      title: string;
      priority: string;
      description: string;
    }>;

    const results = [];
    for (const task of tasks) {
      const fd = new FormData();
      fd.set("title", task.title);
      fd.set("description", task.description || "");
      fd.set("priority", task.priority || "medium");
      const result = await createTask(fd);
      results.push(result);
    }

    return { success: true, result: `Created ${results.length} tasks`, tasks: results };
  } catch {
    return { success: false, result: "", error: "Failed to parse AI task output" };
  }
}

export async function askWorkspace(question: string) {
  return runAI("ask_question", question);
}

export async function generateWeeklySummary() {
  const context = await buildWorkspaceContext();
  return geminiService.generate({
    type: "weekly_summary",
    content: "Generate this week's founder summary",
    context,
  });
}

export async function semanticSearch(query: string) {
  const context = await buildWorkspaceContext();
  return geminiService.generate({
    type: "semantic_search",
    content: query,
    context,
  });
}
