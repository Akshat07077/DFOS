import { notFound } from "next/navigation";
import { getClient, getClientActivities, getClientProjects } from "@/actions/clients";
import { getProfiles } from "@/services/dashboard";
import { ClientDetail } from "@/components/clients/client-detail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const [client, activities, projects, profiles] = await Promise.all([
      getClient(id),
      getClientActivities(id),
      getClientProjects(id),
      getProfiles(),
    ]);
    return (
      <ClientDetail
        client={client}
        activities={activities}
        projects={projects}
        profiles={profiles}
      />
    );
  } catch {
    notFound();
  }
}
