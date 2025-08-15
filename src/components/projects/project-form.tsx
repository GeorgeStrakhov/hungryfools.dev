"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { DeleteProjectButton } from "./delete-project-button";
import { MediaUpload } from "./media-upload";
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

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  // Onboarding mode props
  mode?: "standard" | "onboarding";
  onBack?: () => void;
  onSkip?: () => void;
  enhanceWithAI?: boolean;
  showPreview?: boolean;
}

export function ProjectForm({
  initialData = {},
  onSubmit,
  onDelete,
  submitLabel = "Save Project",
  isLoading = false,
  mode = "standard",
  onBack,
  onSkip,
  enhanceWithAI = false,
  showPreview = false,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData.name || "",
    slug: initialData.slug || "",
    url: initialData.url || "",
    githubUrl: initialData.githubUrl || "",
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

    // In onboarding mode, allow empty forms (user can skip)
    if (mode === "standard") {
      if (!formData.name.trim()) {
        toast.error("Project name is required");
        return;
      }

      if (!formData.slug.trim()) {
        toast.error("Project slug is required");
        return;
      }
    }

    // For onboarding mode, check if we have any content before proceeding
    if (mode === "onboarding") {
      const hasContent =
        formData.name.trim() ||
        formData.url.trim() ||
        formData.githubUrl.trim() ||
        formData.oneliner.trim() ||
        formData.description.trim() ||
        formData.media.length > 0;
      if (!hasContent) {
        toast.error("Please fill in at least one field or skip this step");
        return;
      }
    }

    // Validate GitHub URL if provided
    if (formData.githubUrl && formData.githubUrl.trim()) {
      try {
        const url = new URL(formData.githubUrl);
        if (
          url.hostname !== "github.com" &&
          url.hostname !== "www.github.com"
        ) {
          toast.error("GitHub URL must be a valid GitHub repository URL");
          return;
        }
      } catch {
        toast.error("Invalid GitHub URL format");
        return;
      }
    }

    try {
      const finalData = formData;

      // Apply AI enhancement if enabled (onboarding mode)
      if (enhanceWithAI && mode === "onboarding") {
        // TODO: Integrate with moderation/enhancement service
        // For now, we'll pass the data as-is but this is where we'd call
        // the normalization service from the onboarding actions
      }

      await onSubmit(finalData);
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
              placeholder="https://myproject.com or https://demo.myproject.com"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Link to your live project or demo
            </p>
          </div>

          <div>
            <label
              htmlFor="githubUrl"
              className="mb-2 block text-sm font-medium"
            >
              GitHub URL
            </label>
            <Input
              id="githubUrl"
              type="url"
              value={formData.githubUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))
              }
              placeholder="https://github.com/username/project"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Link to your project&apos;s source code on GitHub
            </p>
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
            <Checkbox
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, featured: !!checked }))
              }
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

      {/* Project Preview - only show in onboarding mode */}
      {mode === "onboarding" &&
        showPreview &&
        (formData.name ||
          formData.description ||
          formData.media.length > 0) && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-lg">👀</span>
                Preview
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                This is how your project will appear on your profile
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.name && (
                  <div>
                    <h3 className="font-semibold">{formData.name}</h3>
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                      {formData.featured && (
                        <span className="bg-primary text-primary-foreground rounded px-2 py-1">
                          Featured
                        </span>
                      )}
                      {formData.url && (
                        <a
                          href={formData.url}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          View Project →
                        </a>
                      )}
                      {formData.githubUrl && (
                        <a
                          href={formData.githubUrl}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          GitHub →
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {formData.oneliner && (
                  <p className="text-muted-foreground text-sm font-medium">
                    {formData.oneliner}
                  </p>
                )}
                {formData.description && (
                  <p className="text-muted-foreground text-sm">
                    {formData.description}
                  </p>
                )}
                {formData.media.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {formData.media.slice(0, 2).map((item, index) => (
                      <div
                        key={index}
                        className="aspect-square overflow-hidden rounded-md bg-gray-100"
                      >
                        {item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.filename}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="relative h-full w-full">
                            <video
                              src={item.url}
                              className="h-full w-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <span className="text-xl text-white">▶</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Actions */}
      {mode === "onboarding" ? (
        <div className="nav-buttons flex justify-between">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          )}
          <div className="space-x-2">
            {onSkip && (
              <Button variant="outline" onClick={onSkip}>
                Skip for now
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Creating..."
                : formData.name ||
                    formData.description ||
                    formData.media.length > 0
                  ? "Create Project"
                  : "Next"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>

          {onDelete && (
            <DeleteProjectButton
              onDelete={onDelete}
              projectName={formData.name || "this project"}
            />
          )}
        </div>
      )}
    </form>
  );
}
