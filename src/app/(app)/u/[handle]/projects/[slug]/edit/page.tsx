import { auth } from "@/auth";
import { db } from "@/db";
import { projects, profiles, type ProjectMedia } from "@/db/schema/profile";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProject, deleteProject } from "@/lib/actions/projects";

interface ProjectFormData {
  name: string;
  slug: string;
  url: string;
  githubUrl: string;
  oneliner: string;
  description: string;
  featured: boolean;
  media: ProjectMedia[];
}

type Params = {
  params: Promise<{ handle: string; slug: string }>;
};

export default async function EditProjectPage({ params }: Params) {
  const resolvedParams = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // Get the profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, resolvedParams.handle.toLowerCase()))
    .limit(1);

  if (!profile) {
    notFound();
  }

  // Check if this is the owner
  if (profile.userId !== session.user.id) {
    redirect(`/u/${profile.handle}`);
  }

  // Get the project
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, session.user.id),
        eq(projects.slug, resolvedParams.slug),
      ),
    )
    .limit(1);

  if (!project) {
    notFound();
  }

  const handleUpdate = async (data: ProjectFormData) => {
    "use server";
    await updateProject(project.id, data);
    redirect(`/u/${profile.handle}`);
  };

  const handleDelete = async () => {
    "use server";
    await deleteProject(project.id);
    redirect(`/u/${profile.handle}`);
  };

  return (
    <div className="hf-container py-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Edit Project</h1>
          <p className="text-muted-foreground mt-2">
            Update your project details
          </p>
        </div>

        <ProjectForm
          initialData={{
            name: project.name,
            slug: project.slug,
            url: project.url || "",
            githubUrl: project.githubUrl || "",
            oneliner: project.oneliner || "",
            description: project.description || "",
            featured: project.featured,
            media: (project.media as ProjectMedia[]) || [],
          }}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
          submitLabel="Update Project"
        />
      </div>
    </div>
  );
}
