"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminClient,
  getAuthUserByEmail,
  linkClientPortalProfile,
} from "@/lib/supabase/admin";
import { createClient, getProfile, getUser } from "@/lib/supabase/server";
import type { FeedbackStatus, PriorityLevel } from "@/types/database";

function assertFounderUserType(userType?: string) {
  if (userType !== "founder") {
    throw new Error("Only founders can access this action");
  }
}

async function grantProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  clientId: string,
  founderId: string
) {
  const { data: projectRows, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId);
  if (projectError) return { error: projectError.message };

  if (projectRows && projectRows.length > 0) {
    const { error: accessError } = await supabase.from("client_project_access").upsert(
      projectRows.map((p) => ({
        client_profile_id: userId,
        client_id: clientId,
        project_id: p.id,
        created_by: founderId,
      })),
      { onConflict: "client_profile_id,project_id" }
    );
    if (accessError) return { error: accessError.message };
  }

  return { success: true as const };
}

export async function inviteClientPortalUser(formData: FormData) {
  const founder = await getProfile();
  assertFounderUserType(founder?.user_type);

  const supabase = await createClient();
  const admin = createAdminClient();

  const clientId = formData.get("client_id") as string;
  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) || undefined;

  if (!clientId || !email) {
    return { error: "Client and email are required." };
  }

  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .single();
  if (!existingClient) return { error: "Client not found." };

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, user_type, portal_client_id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile?.user_type === "founder") {
    return {
      error:
        "This email belongs to a founder account. Use a different email for the client portal.",
    };
  }

  if (existingProfile?.portal_client_id === clientId) {
    return { success: true, message: "This user is already linked to this client." };
  }

  let userId = existingProfile?.id;

  if (!userId) {
    const authUser = await getAuthUserByEmail(email);
    userId = authUser?.id;
  }

  if (userId) {
    if (!password) {
      return {
        error:
          "This email is already registered. Enter a new temporary password to link and reset access.",
      };
    }

    const linkResult = await linkClientPortalProfile(admin, {
      userId,
      email,
      fullName: fullName || null,
      clientId,
      password,
    });
    if (linkResult.error) return { error: linkResult.error };

    const accessResult = await grantProjectAccess(supabase, userId, clientId, founder!.id);
    if (accessResult.error) return { error: accessResult.error };

    revalidatePath(`/clients/${clientId}`);
    return {
      success: true,
      message: "Existing account linked to this client. They can log in with the new password.",
    };
  }

  if (!password) {
    return { error: "Password is required for new client logins." };
  }

  const createRes = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName ?? null,
      user_type: "client",
    },
  });

  if (createRes.error || !createRes.data.user) {
    const msg = createRes.error?.message ?? "Unable to create user";
    if (msg.toLowerCase().includes("already")) {
      return {
        error:
          "This email is already registered in Auth. Enter a password and submit again to link the existing account.",
      };
    }
    return { error: msg };
  }

  userId = createRes.data.user.id;

  const linkResult = await linkClientPortalProfile(admin, {
    userId,
    email,
    fullName: fullName || null,
    clientId,
  });
  if (linkResult.error) return { error: linkResult.error };

  const accessResult = await grantProjectAccess(supabase, userId, clientId, founder!.id);
  if (accessResult.error) return { error: accessResult.error };

  revalidatePath(`/clients/${clientId}`);
  return { success: true, message: "Client login created successfully." };
}

export async function getClientPortalUsers(clientId: string) {
  const profile = await getProfile();
  assertFounderUserType(profile?.user_type);

  const supabase = await createClient();

  const { data: directUsers, error: directError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("user_type", "client")
    .eq("portal_client_id", clientId)
    .order("created_at", { ascending: false });
  if (directError) throw new Error(directError.message);

  const users = new Map<string, { id: string; full_name: string | null; email: string }>();
  for (const row of directUsers ?? []) {
    users.set(row.id, row);
  }

  const { data: accessRows, error: accessError } = await supabase
    .from("client_project_access")
    .select(
      "client_profile_id, profile:profiles!client_project_access_client_profile_id_fkey(id, full_name, email)"
    )
    .eq("client_id", clientId);
  if (accessError) throw new Error(accessError.message);

  for (const row of accessRows ?? []) {
    const profileRow = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!profileRow || users.has(profileRow.id)) continue;
    users.set(profileRow.id, profileRow);
  }

  return Array.from(users.values());
}

export async function getClientFeedbackByClient(clientId: string) {
  const profile = await getProfile();
  assertFounderUserType(profile?.user_type);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_feedback")
    .select(
      "*, project:projects(id, title, status, progress), author:profiles(id, full_name, email)"
    )
    .in(
      "project_id",
      (
        await supabase.from("projects").select("id").eq("client_id", clientId)
      ).data?.map((p) => p.id) ?? []
    )
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateClientFeedbackStatus(id: string, status: FeedbackStatus) {
  const profile = await getProfile();
  assertFounderUserType(profile?.user_type);

  const supabase = await createClient();
  const { error } = await supabase.from("client_feedback").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/client");
  return { success: true };
}

export async function getClientPortalData() {
  const user = await getUser();
  const profile = await getProfile();
  if (!user || profile?.user_type !== "client") {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: accessRows, error: accessError } = await supabase
    .from("client_project_access")
    .select("project_id");
  if (accessError) throw new Error(accessError.message);

  const projectIds = (accessRows ?? []).map((r) => r.project_id);
  if (projectIds.length === 0) {
    return { projects: [], tasks: [], updates: [], feedback: [] };
  }

  const [projectsRes, tasksRes, updatesRes, feedbackRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, status, progress, deadline, updated_at")
      .in("id", projectIds)
      .order("updated_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, status, priority, deadline, project:projects(id, title)")
      .in("project_id", projectIds)
      .order("deadline", { ascending: true })
      .limit(25),
    supabase
      .from("updates")
      .select("id, message, created_at, project:projects(id, title), author:profiles(id, full_name, email)")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("client_feedback")
      .select("*, project:projects(id, title), author:profiles(id, full_name, email)")
      .in("project_id", projectIds)
      .order("updated_at", { ascending: false })
      .limit(30),
  ]);

  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (tasksRes.error) throw new Error(tasksRes.error.message);
  if (updatesRes.error) throw new Error(updatesRes.error.message);
  if (feedbackRes.error) throw new Error(feedbackRes.error.message);

  return {
    projects: projectsRes.data ?? [],
    tasks: tasksRes.data ?? [],
    updates: updatesRes.data ?? [],
    feedback: feedbackRes.data ?? [],
  };
}

export async function createClientFeedback(formData: FormData) {
  const user = await getUser();
  const profile = await getProfile();
  if (!user || profile?.user_type !== "client") {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const projectId = formData.get("project_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priority = ((formData.get("priority") as PriorityLevel) || "medium") as PriorityLevel;

  if (!projectId || !title || !description) {
    return { error: "Project, title, and description are required." };
  }

  const { error } = await supabase.from("client_feedback").insert({
    project_id: projectId,
    author_id: user.id,
    title,
    description,
    priority,
    status: "new",
  });
  if (error) return { error: error.message };

  revalidatePath("/client");
  return { success: true };
}
