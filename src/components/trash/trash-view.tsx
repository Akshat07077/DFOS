"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { restoreAllTrash, restoreTrashItem, type TrashItem } from "@/actions/trash";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TrashView({ initialItems }: { initialItems: TrashItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [pending, startTransition] = useTransition();

  const handleRestore = (item: TrashItem) => {
    startTransition(async () => {
      const result = await restoreTrashItem(item.table, item.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id || i.table !== item.table));
      toast.success(`${item.label} restored`);
    });
  };

  const handleRestoreAll = () => {
    if (!confirm(`Restore all ${items.length} items from trash?`)) return;

    startTransition(async () => {
      const result = await restoreAllTrash();
      setItems([]);
      toast.success(`Restored ${result.count ?? 0} items`);
    });
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Trash"
        description="Deleted items are kept here. Restore anything you removed by mistake."
      >
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRestoreAll}
            disabled={pending}
          >
            <RotateCcw className="h-4 w-4" />
            Restore all
          </Button>
        )}
      </PageHeader>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Trash is empty</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.table}-${item.id}`}>
              <Card>
                <CardContent className="flex items-start gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {item.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => handleRestore(item)}
                    disabled={pending}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Nothing is permanently removed from the database. Run{" "}
        <code className="rounded bg-muted px-1">supabase/migration-soft-delete.sql</code> in
        Supabase if restore fails (column missing).
      </p>
    </div>
  );
}
