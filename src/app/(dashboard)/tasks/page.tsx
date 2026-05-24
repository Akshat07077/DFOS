import { getTasks } from "@/actions/tasks";
import { getProjects } from "@/actions/projects";
import { getProfiles } from "@/services/dashboard";
import { TasksBoard } from "@/components/tasks/tasks-board";

export default async function TasksPage() {
  const [tasks, projects, profiles] = await Promise.all([
    getTasks(),
    getProjects(),
    getProfiles(),
  ]);

  return (
    <TasksBoard
      tasks={tasks}
      projects={projects.map((p) => ({ id: p.id, title: p.title }))}
      profiles={profiles}
    />
  );
}
