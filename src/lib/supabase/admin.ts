import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local to enable founder-created client credentials."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return serviceRoleKey;
}

/** Lookup auth user by email (service role REST API). */
export async function getAuthUserByEmail(email: string) {
  const serviceRoleKey = getServiceRoleKey();
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { users?: { id: string; email?: string }[] };
  return data.users?.[0] ?? null;
}

export async function linkClientPortalProfile(
  admin: SupabaseClient,
  {
    userId,
    email,
    fullName,
    clientId,
    password,
  }: {
    userId: string;
    email: string;
    fullName: string | null;
    clientId: string;
    password?: string;
  }
) {
  if (password) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
      password,
    });
    if (passwordError) return { error: passwordError.message };
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      user_type: "client",
      role: null,
      portal_client_id: clientId,
    },
    { onConflict: "id" }
  );
  if (profileError) return { error: profileError.message };

  return { success: true as const };
}
