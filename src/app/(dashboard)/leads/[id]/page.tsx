import { notFound } from "next/navigation";
import { getLead, getLeadActivities } from "@/actions/leads";
import { getProfiles } from "@/services/dashboard";
import { LeadDetail } from "@/components/leads/lead-detail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const [lead, activities, profiles] = await Promise.all([
      getLead(id),
      getLeadActivities(id),
      getProfiles(),
    ]);
    return <LeadDetail lead={lead} activities={activities} profiles={profiles} />;
  } catch {
    notFound();
  }
}
