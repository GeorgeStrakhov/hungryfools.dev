import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { createProject } from "../actions";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="hf-container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Project</h1>
        <p className="text-muted-foreground mt-2">
          Showcase your work to the community
        </p>
      </div>

      <div className="max-w-2xl">
        <ProjectForm onSubmit={createProject} submitLabel="Create Project" />
      </div>
    </div>
  );
}
