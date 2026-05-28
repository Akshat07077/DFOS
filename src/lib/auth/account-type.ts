/** Profile fields used to decide founder vs client routing. */
export type AccountProfile = {
  user_type?: string | null;
  portal_client_id?: string | null;
} | null;

/** Client portal user — by explicit type or linked client record. */
export function isClientAccount(profile: AccountProfile): boolean {
  if (!profile) return false;
  return profile.user_type === "client" || !!profile.portal_client_id;
}

export function getPostLoginPath(profile: AccountProfile): "/client" | "/dashboard" {
  return isClientAccount(profile) ? "/client" : "/dashboard";
}
