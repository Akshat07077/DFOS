"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getUser } from "@/lib/supabase/server";
import type { ClientStatus, PriorityLevel } from "@/types/database";

const clientSelect = `
  *,
  assignee:profiles!clients_assigned_to_fkey(id, full_name, email)
`;

export async function getClients(filters?: {
  status?: ClientStatus;
  assignedTo?: string;
}) {
  const supabase = await createClient();
  let query = supabase.from("clients").select(clientSelect).order("updated_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.assignedTo) query = query.eq("assigned_to", filters.assignedTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClient(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select(clientSelect).eq("id", id).single();
  if (error) throw new Error(error.message);

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("client_id", id);

  return { ...data, project_count: count ?? 0 };
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const contractValue = formData.get("contract_value") as string;

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      company: formData.get("company") as string,
      website: (formData.get("website") as string) || null,
      industry: (formData.get("industry") as string) || null,
      status: (formData.get("status") as ClientStatus) || "onboarding",
      priority: (formData.get("priority") as PriorityLevel) || "medium",
      contract_value: contractValue ? parseFloat(contractValue) : null,
      notes: (formData.get("notes") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient();
  const contractValue = formData.get("contract_value") as string;

  const { error } = await supabase
    .from("clients")
    .update({
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      company: formData.get("company") as string,
      website: (formData.get("website") as string) || null,
      industry: (formData.get("industry") as string) || null,
      status: formData.get("status") as ClientStatus,
      priority: formData.get("priority") as PriorityLevel,
      contract_value: contractValue ? parseFloat(contractValue) : null,
      notes: (formData.get("notes") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateClientStatus(id: string, status: ClientStatus) {
  const supabase = await createClient();
  const user = await getUser();

  const { error } = await supabase.from("clients").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  if (user) {
    await supabase.from("client_activities").insert({
      client_id: id,
      message: `Status changed to ${status}`,
      activity_type: "status_change",
      author_id: user.id,
    });
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { success: true };
}

export async function deleteClient(id: string) {
  const supabase = await createClient();

  try {
    const admin = createAdminClient();
    const { data: portalUsers } = await admin
      .from("profiles")
      .select("id")
      .eq("portal_client_id", id);

    for (const user of portalUsers ?? []) {
      await admin.auth.admin.deleteUser(user.id);
    }
  } catch {
    // Service role missing — client row still deletes; clean auth users manually if needed
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/client");
  return { success: true };
}

export async function getClientActivities(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_activities")
    .select(`*, author:profiles!client_activities_author_id_fkey(id, full_name, email)`)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addClientActivity(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const clientId = formData.get("client_id") as string;

  const { error } = await supabase.from("client_activities").insert({
    client_id: clientId,
    message: formData.get("message") as string,
    activity_type: (formData.get("activity_type") as string) || "note",
    author_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function getClientProjects(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, status, priority, deadline, progress")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
