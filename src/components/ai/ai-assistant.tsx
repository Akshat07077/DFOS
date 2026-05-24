"use client";

import { useState, useTransition } from "react";
import { Sparkles, Search, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  askWorkspace,
  generateWeeklySummary,
  semanticSearch,
  runAI,
} from "@/actions/ai";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_PROMPTS = [
  "What tasks are overdue?",
  "Summarize active projects",
  "What did we decide about AI workflows?",
  "Show delayed tasks",
];

export function AIAssistant() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ success: boolean; result: string; error?: string }>) => {
    startTransition(async () => {
      const response = await fn();
      if (response.success) {
        setResult(response.result);
      } else {
        toast.error(response.error ?? "AI request failed");
      }
    });
  };

  const handleAsk = () => {
    if (!query.trim()) return;
    run(() => askWorkspace(query));
  };

  const handleWeekly = () => run(() => generateWeeklySummary());

  const handleSearch = () => {
    if (!query.trim()) return;
    run(() => semanticSearch(query));
  };

  const handleSummarizeUpdates = () => {
    run(() => runAI("summarize_updates", "Summarize recent project updates"));
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      <PageHeader
        title="AI Assistant"
        description="Ask questions, search workspace data, generate summaries"
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <Textarea
            placeholder="Ask anything about your projects, tasks, or notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="mb-4 bg-background"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAsk} disabled={pending}>
              <MessageSquare className="h-4 w-4" /> Ask
            </Button>
            <Button variant="outline" onClick={handleSearch} disabled={pending}>
              <Search className="h-4 w-4" /> Search
            </Button>
            <Button variant="outline" onClick={handleWeekly} disabled={pending}>
              <Calendar className="h-4 w-4" /> Weekly Summary
            </Button>
            <Button variant="outline" onClick={handleSummarizeUpdates} disabled={pending}>
              <Sparkles className="h-4 w-4" /> Summarize Updates
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="secondary"
            size="sm"
            onClick={() => {
              setQuery(prompt);
              run(() => askWorkspace(prompt));
            }}
            disabled={pending}
          >
            {prompt}
          </Button>
        ))}
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {result}
            </div>
          </CardContent>
        </Card>
      )}

      {pending && (
        <p className="text-sm text-muted-foreground animate-pulse">Thinking...</p>
      )}
    </div>
  );
}
