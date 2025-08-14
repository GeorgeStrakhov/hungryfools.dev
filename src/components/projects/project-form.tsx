"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DeleteProjectButton } from "./delete-project-button";
import { MediaUpload } from "./media-upload";
import type { ProjectMedia } from "@/db/schema/profile";

interface ProjectFormData {
  name: string;
  slug: string;
  url: string;
  oneliner: string;
  description: string;
  featured: boolean;
  media: ProjectMedia[];
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export function ProjectForm({
  initialData = {},
  onSubmit,
  onDelete,
  submitLabel = "Save Project",
  isLoading = false,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData.name || "",
    slug: initialData.slug || "",
    url: initialData.url || "",
    oneliner: initialData.oneliner || "",
    description: initialData.description || "",
    featured: initialData.featured || false,
    media: initialData.media || [],
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate slug if it's empty or was auto-generated
      slug:
        prev.slug === "" || prev.slug === slugify(prev.name)
          ? slugify(name)
          : prev.slug,
    }));
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleMediaUpdate = (media: ProjectMedia[]) => {
    setFormData((prev) => ({ ...prev, media }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Project slug is required");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error: unknown) {
      // Check if this is a Next.js redirect (which is expected)
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.includes("NEXT_REDIRECT")
      ) {
        // This is a successful redirect, don't show error
        return;
      }
      // Only show error for actual errors
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save project";
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Project Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div>
            <label htmlFor="slug" className="mb-2 block text-sm font-medium">
              URL Slug *
            </label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  slug: slugify(e.target.value),
                }))
              }
              placeholder="my-awesome-project"
              required
            />
            <p className="text-muted-foreground mt-1 text-xs">
              This will be used in your project URL
            </p>
          </div>

          <div>
            <label htmlFor="url" className="mb-2 block text-sm font-medium">
              Project URL
            </label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="https://github.com/username/project or https://myproject.com"
            />
          </div>

          <div>
            <label
              htmlFor="oneliner"
              className="mb-2 block text-sm font-medium"
            >
              One-liner
            </label>
            <Input
              id="oneliner"
              value={formData.oneliner}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, oneliner: e.target.value }))
              }
              placeholder="A brief tagline for your project"
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Tell people about your project. What does it do? What problem does it solve? What technologies did you use?"
              rows={6}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="featured"
              type="checkbox"
              checked={formData.featured}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, featured: e.target.checked }))
              }
              className="rounded"
            />
            <label htmlFor="featured" className="text-sm font-medium">
              Featured project (show prominently on profile)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Media Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaUpload
            projectSlug={formData.slug}
            media={formData.media}
            onMediaUpdate={handleMediaUpdate}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : submitLabel}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/profile/projects">Cancel</a>
          </Button>
        </div>

        {onDelete && (
          <DeleteProjectButton
            onDelete={onDelete}
            projectName={formData.name || "this project"}
          />
        )}
      </div>
    </form>
  );
}
