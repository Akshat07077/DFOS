"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClientRecord, updateClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Client, ClientStatus, PriorityLevel, Profile } from "@/types/database";

export function ClientFormDialog({
  client,
  profiles,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  client?: Client;
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
      const result = client ? await updateClient(client.id, formData) : await createClientRecord(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(client ? "Client updated" : "Client created");
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
          <DialogTitle>{client ? "Edit Client" : "New Client"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input id="company" name="company" required defaultValue={client?.company} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Primary contact *</Label>
            <Input id="name" name="name" required defaultValue={client?.name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" placeholder="https://" defaultValue={client?.website ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" defaultValue={client?.industry ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={client?.status ?? "onboarding"} className={selectClass}>
                {(["onboarding", "active", "paused", "churned"] as ClientStatus[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" name="priority" defaultValue={client?.priority ?? "medium"} className={selectClass}>
                {(["low", "medium", "high", "urgent"] as PriorityLevel[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract_value">Contract value ($)</Label>
            <Input id="contract_value" name="contract_value" type="number" step="0.01" defaultValue={client?.contract_value ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Account owner</Label>
            <select id="assigned_to" name="assigned_to" defaultValue={client?.assigned_to ?? ""} className={selectClass}>
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : client ? "Update Client" : "Create Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
