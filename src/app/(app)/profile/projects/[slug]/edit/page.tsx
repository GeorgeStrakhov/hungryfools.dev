import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema/profile";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProject, deleteProject } from "../../actions";

type Params = { 
  params: Promise<{ slug: string }> 
};

export default async function EditProjectPage({ params }: Params) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const resolvedParams = await params;

  // Get the project
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, session.user.id),
        eq(projects.slug, resolvedParams.slug)
      )
    )
    .limit(1);

  if (!project) {
    notFound();
  }

  const handleUpdate = async (data: any) => {
    "use server";
    await updateProject(project.id, data);
  };

  const handleDelete = async () => {
    "use server";
    await deleteProject(project.id);
  };

  return (
    <div className="hf-container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground mt-2">
          Update your project details
        </p>
      </div>

      <div className="max-w-2xl">
        <ProjectForm
          initialData={{
            name: project.name,
            slug: project.slug,
            url: project.url || "",
            oneliner: project.oneliner || "",
            description: project.description || "",
            featured: project.featured,
            media: project.media || [],
          }}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
          submitLabel="Update Project"
        />
      </div>
    </div>
  );
}