"use client";

import { useState, useTransition } from "react";
import { Download, Database, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { exportDatabaseBackup } from "@/actions/backup";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BackupPanel() {
  const [pending, startTransition] = useTransition();
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportDatabaseBackup();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (!result.json || !result.filename) {
        toast.error("Export failed");
        return;
      }

      const blob = new Blob([result.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);

      const sizeKb = Math.round((result.sizeBytes ?? 0) / 1024);
      setLastExport(`${result.filename} (${sizeKb} KB)`);
      toast.success("Backup downloaded");
    });
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Database Backup"
        description="Download a full JSON snapshot — use this on Free tier since Supabase PITR is not available"
      />

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Export all data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Includes clients, leads, projects, tasks, notes, updates, portal access,
            feedback, and tags. Store the file somewhere safe (Google Drive, etc.).
          </p>
          <Button onClick={handleExport} disabled={pending} className="gap-2">
            <Download className="h-4 w-4" />
            {pending ? "Preparing backup..." : "Download JSON backup"}
          </Button>
          {lastExport && (
            <p className="text-xs text-muted-foreground">Last export: {lastExport}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-amber-300">
            <ShieldAlert className="h-4 w-4" />
            Why data was lost (fixed in migration)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Deleting an <strong className="text-foreground">auth user</strong> removed their
            profile, and old DB rules CASCADE-deleted every lead/project they created.
          </p>
          <p>
            Run <code className="text-xs bg-muted px-1 rounded">supabase/migration-safe-deletes.sql</code>{" "}
            in Supabase SQL Editor so that never happens again.
          </p>
          <p>Export backups weekly while on Free tier.</p>
        </CardContent>
      </Card>
    </div>
  );
}
