import { redirect } from "next/navigation";
import { getPostLoginPath } from "@/lib/auth/account-type";
import { getProfile, getUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  redirect(getPostLoginPath(profile));
}
