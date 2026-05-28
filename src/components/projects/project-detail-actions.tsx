"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProject } from "@/actions/projects";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { Button } from "@/components/ui/button";
import type { Client, Project } from "@/types/database";

export function ProjectDetailActions({
  project,
  clients,
}: {
  project: Project;
  clients: Pick<Client, "id" | "company">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        `Delete project "${project.title}"? Tasks and updates linked to it will be removed.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Project deleted");
        router.push("/projects");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <ProjectFormDialog
        project={project}
        clients={clients}
        trigger={<Button variant="outline" size="sm">Edit</Button>}
      />
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={handleDelete}
        disabled={pending}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}
