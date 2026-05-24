import { getLeads } from "@/actions/leads";
import { getProfiles } from "@/services/dashboard";
import { LeadsView } from "@/components/leads/leads-view";

export default async function LeadsPage() {
  const [leads, profiles] = await Promise.all([getLeads(), getProfiles()]);
  return <LeadsView leads={leads} profiles={profiles} />;
}
