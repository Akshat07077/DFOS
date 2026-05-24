import { getProjects } from "@/actions/projects";
import { ProjectsView } from "@/components/projects/projects-view";

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsView projects={projects} />;
}
