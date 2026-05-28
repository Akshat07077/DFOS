import { notFound } from "next/navigation";
import { getClient, getClientActivities, getClientProjects } from "@/actions/clients";
import { getClientFeedbackByClient, getClientPortalUsers } from "@/actions/client-portal";
import { getProfiles } from "@/services/dashboard";
import { ClientDetail } from "@/components/clients/client-detail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const [client, activities, projects, profiles, portalUsers, feedback] = await Promise.all([
      getClient(id),
      getClientActivities(id),
      getClientProjects(id),
      getProfiles(),
      getClientPortalUsers(id),
      getClientFeedbackByClient(id),
    ]);
    return (
      <ClientDetail
        client={client}
        activities={activities}
        projects={projects}
        profiles={profiles}
        portalUsers={portalUsers}
        feedback={feedback}
      />
    );
  } catch {
    notFound();
  }
}
