import { getProjects } from "@/actions/projects";
import { getClients } from "@/actions/clients";
import { ProjectsView } from "@/components/projects/projects-view";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);
  return <ProjectsView projects={projects} clients={clients} />;
}
