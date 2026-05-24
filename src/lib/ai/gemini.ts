import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIRequestType =
  | "summarize_note"
  | "summarize_updates"
  | "note_to_tasks"
  | "weekly_summary"
  | "semantic_search"
  | "ask_question";

export interface AIRequest {
  type: AIRequestType;
  content: string;
  context?: string;
}

export interface AIResponse {
  success: boolean;
  result: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are the AI assistant for DesignsVerse, a digital agency's internal Founder Operating System.
You help two founders manage projects, tasks, notes, and updates.
Be concise, actionable, and founder-focused. Use bullet points when listing items.
Never invent data not present in the provided context.`;

class GeminiService {
  private client: GoogleGenerativeAI | null = null;

  private getClient() {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  private getModel() {
    return this.getClient().getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      systemInstruction: SYSTEM_PROMPT,
    });
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    try {
      const model = this.getModel();
      const prompt = this.buildPrompt(request);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return { success: true, result: text };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI request failed";
      return { success: false, result: "", error: message };
    }
  }

  private buildPrompt(request: AIRequest): string {
    const contextBlock = request.context
      ? `\n\n--- CONTEXT ---\n${request.context}\n--- END CONTEXT ---`
      : "";

    switch (request.type) {
      case "summarize_note":
        return `Summarize this founder note in 2-4 bullet points. Highlight key decisions and action items.${contextBlock}\n\nNote:\n${request.content}`;

      case "summarize_updates":
        return `Summarize these project updates into a concise status report. Group by theme if helpful.${contextBlock}\n\nUpdates:\n${request.content}`;

      case "note_to_tasks":
        return `Convert this note into actionable tasks. Return as JSON array with objects: { "title": string, "priority": "low"|"medium"|"high"|"urgent", "description": string }. Only return valid JSON, no markdown.${contextBlock}\n\nNote:\n${request.content}`;

      case "weekly_summary":
        return `Generate a weekly founder summary covering: wins, blockers, overdue items, and priorities for next week. Be direct and scannable.${contextBlock}\n\nData:\n${request.content}`;

      case "semantic_search":
        return `Given the search query and workspace data, find remaining relevant items ranked by relevance. Format as a numbered list with brief explanations.${contextBlock}\n\nQuery: ${request.content}`;

      case "ask_question":
        return `Answer this question using only the provided workspace data. If insufficient data, say so clearly.${contextBlock}\n\nQuestion: ${request.content}`;

      default:
        return request.content + contextBlock;
    }
  }
}

export const geminiService = new GeminiService();
