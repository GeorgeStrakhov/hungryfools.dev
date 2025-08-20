"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import type { ProjectMedia } from "@/db/schema/profile";

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

interface Project {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  githubUrl: string | null;
  oneliner: string | null;
  description: string | null;
  featured: boolean;
  media: ProjectMedia[];
}

interface Profile {
  handle: string;
  userId: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handle = Array.isArray(params.handle)
    ? params.handle[0]
    : params.handle;
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/");
      return;
    }

    // Fetch project data
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/projects/${handle}/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/404");
            return;
          }
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data.project);
        setProfile(data.profile);

        // Check ownership
        if (data.profile.userId !== session.user.id) {
          router.push(`/u/${handle}`);
          return;
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast.error("Failed to load project");
        router.push(`/u/${handle}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, status, router, handle, slug]);

  const handleUpdate = async (data: ProjectFormData) => {
    if (!project || !profile) return;

    setIsUpdating(true);
    try {
      await updateProject(project.id, data);
      toast.success("Project updated successfully!");
      router.push(`/u/${profile.handle}`);
    } catch (error) {
      console.error("Project update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update project",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !profile) return;

    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success("Project deleted successfully!");
      router.push(`/u/${profile.handle}`);
    } catch (error) {
      console.error("Project deletion error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="hf-container py-6 md:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !project || !profile) {
    return null; // Will redirect
  }

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
          isLoading={isUpdating || isDeleting}
        />
      </div>
    </div>
  );
}
