"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPostLoginPath, isClientAccount } from "@/lib/auth/account-type";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, portal_client_id")
      .eq("id", user.id)
      .single();

    // Self-heal: linked client users must not stay on founder type
    if (profile?.portal_client_id && profile.user_type !== "client") {
      await supabase
        .from("profiles")
        .update({ user_type: "client", role: null })
        .eq("id", user.id);
      redirect("/client");
    }

    redirect(getPostLoginPath(profile));
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Fallback if DB trigger didn't create profile
  if (data.user) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email: email,
        full_name: fullName || null,
        user_type: "founder",
      },
      { onConflict: "id" }
    );
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
