"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import type { LeadStatus, LeadSource, PriorityLevel } from "@/types/database";

const leadSelect = `
  *,
  assignee:profiles!leads_assigned_to_fkey(id, full_name, email),
  client:clients!leads_converted_client_id_fkey(id, name, company)
`;

export async function getLeads(filters?: {
  status?: LeadStatus;
  assignedTo?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select(leadSelect)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLead(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(leadSelect)
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const estimated = formData.get("estimated_value") as string;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      company: (formData.get("company") as string) || null,
      title: (formData.get("title") as string) || null,
      source: (formData.get("source") as LeadSource) || "other",
      status: (formData.get("status") as LeadStatus) || "new",
      priority: (formData.get("priority") as PriorityLevel) || "medium",
      estimated_value: estimated ? parseFloat(estimated) : null,
      notes: (formData.get("notes") as string) || null,
      next_follow_up: (formData.get("next_follow_up") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateLead(id: string, formData: FormData) {
  const supabase = await createClient();
  const estimated = formData.get("estimated_value") as string;

  const { error } = await supabase
    .from("leads")
    .update({
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      company: (formData.get("company") as string) || null,
      title: (formData.get("title") as string) || null,
      source: formData.get("source") as LeadSource,
      status: formData.get("status") as LeadStatus,
      priority: formData.get("priority") as PriorityLevel,
      estimated_value: estimated ? parseFloat(estimated) : null,
      notes: (formData.get("notes") as string) || null,
      next_follow_up: (formData.get("next_follow_up") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const supabase = await createClient();
  const user = await getUser();

  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  if (user) {
    await supabase.from("lead_activities").insert({
      lead_id: id,
      message: `Status changed to ${status}`,
      activity_type: "status_change",
      author_id: user.id,
    });
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { success: true };
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/trash");
  return { success: true };
}

export async function getLeadActivities(leadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_activities")
    .select(`*, author:profiles!lead_activities_author_id_fkey(id, full_name, email)`)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addLeadActivity(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const leadId = formData.get("lead_id") as string;

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    message: formData.get("message") as string,
    activity_type: (formData.get("activity_type") as string) || "note",
    author_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function convertLeadToClient(leadId: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) return { error: "Lead not found" };
  if (lead.converted_client_id) return { error: "Lead already converted" };

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company || lead.name,
      status: "onboarding",
      priority: lead.priority,
      contract_value: lead.estimated_value,
      notes: lead.notes,
      lead_id: lead.id,
      assigned_to: lead.assigned_to,
      created_by: user.id,
    })
    .select()
    .single();

  if (clientError) return { error: clientError.message };

  await supabase
    .from("leads")
    .update({ status: "won", converted_client_id: client.id })
    .eq("id", leadId);

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    message: `Converted to client: ${client.company}`,
    activity_type: "status_change",
    author_id: user.id,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/clients");
  revalidatePath(`/clients/${client.id}`);
  return { data: client };
}
