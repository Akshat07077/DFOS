"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLead, updateLead } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Lead, LeadStatus, LeadSource, PriorityLevel, Profile } from "@/types/database";
import { LEAD_SOURCE_LABELS } from "@/types/database";

export function LeadFormDialog({
  lead,
  profiles,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  lead?: Lead;
  profiles: Pick<Profile, "id" | "full_name" | "email">[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = lead ? await updateLead(lead.id, formData) : await createLead(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(lead ? "Lead updated" : "Lead created");
      setOpen(false);
      router.refresh();
    });
  };

  const selectClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "New Lead"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required defaultValue={lead?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" defaultValue={lead?.company ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={lead?.title ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <select id="source" name="source" defaultValue={lead?.source ?? "other"} className={selectClass}>
                {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
                  <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={lead?.status ?? "new"} className={selectClass}>
                {(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" name="priority" defaultValue={lead?.priority ?? "medium"} className={selectClass}>
                {(["low", "medium", "high", "urgent"] as PriorityLevel[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_value">Est. value ($)</Label>
              <Input id="estimated_value" name="estimated_value" type="number" step="0.01" defaultValue={lead?.estimated_value ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_follow_up">Next follow-up</Label>
            <Input
              id="next_follow_up"
              name="next_follow_up"
              type="datetime-local"
              defaultValue={lead?.next_follow_up ? new Date(lead.next_follow_up).toISOString().slice(0, 16) : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned to</Label>
            <select id="assigned_to" name="assigned_to" defaultValue={lead?.assigned_to ?? ""} className={selectClass}>
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={lead?.notes ?? ""} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
