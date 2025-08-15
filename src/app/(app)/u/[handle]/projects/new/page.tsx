import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { createProject } from "@/lib/actions/projects";

type Params = { params: Promise<{ handle: string }> };

export default async function NewProjectPage({ params }: Params) {
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

  // Custom submit handler that redirects to the profile page
  const handleSubmit = async (data: unknown) => {
    "use server";
    await createProject(data);
    redirect(`/u/${profile.handle}`);
  };

  return (
    <div className="hf-container py-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Add New Project</h1>
          <p className="text-muted-foreground mt-2">
            Showcase your work to the community
          </p>
        </div>
        <ProjectForm onSubmit={handleSubmit} submitLabel="Create Project" />
      </div>
    </div>
  );
}
