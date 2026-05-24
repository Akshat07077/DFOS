import { getUpdates } from "@/actions/updates";
import { getProjects } from "@/actions/projects";
import { UpdatesFeed } from "@/components/updates/updates-feed";

export default async function UpdatesPage() {
  const [updates, projects] = await Promise.all([getUpdates(), getProjects()]);

  return (
    <UpdatesFeed
      updates={updates}
      projects={projects.map((p) => ({ id: p.id, title: p.title }))}
    />
  );
}
