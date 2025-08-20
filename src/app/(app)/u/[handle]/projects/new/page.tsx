"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { createProject } from "@/lib/actions/projects";
import { toast } from "sonner";

interface ProjectFormData {
  name: string;
  slug: string;
  url: string;
  githubUrl: string;
  oneliner: string;
  description: string;
  featured: boolean;
  media: Array<{
    url: string;
    type: "image" | "video";
    filename: string;
    size: number;
    key: string;
  }>;
}

export default function NewProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handle = Array.isArray(params.handle)
    ? params.handle[0]
    : params.handle;

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/");
      return;
    }

    // Basic auth check - in a real app you'd verify the handle belongs to the user
    setIsCheckingAuth(false);
  }, [session, status, router]);

  const handleSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    try {
      await createProject(data);
      toast.success("Project created successfully!");
      router.push(`/u/${handle}`);
    } catch (error) {
      console.error("Project creation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create project",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isCheckingAuth) {
    return (
      <div className="hf-container py-6 md:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  return (
    <div className="hf-container py-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Add New Project</h1>
          <p className="text-muted-foreground mt-2">
            Showcase your work to the community
          </p>
        </div>
        <ProjectForm
          onSubmit={handleSubmit}
          submitLabel="Create Project"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
