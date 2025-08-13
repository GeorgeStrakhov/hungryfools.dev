"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DeleteProjectButton } from "./delete-project-button";
import { getTransformedImageUrl } from "@/lib/services/s3/s3";
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

  const [mediaUploading, setMediaUploading] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate slug if it's empty or was auto-generated
      slug: prev.slug === "" || prev.slug === slugify(prev.name) 
        ? slugify(name) 
        : prev.slug,
    }));
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    if (!formData.slug) {
      toast.error("Please set a project slug before uploading files");
      return;
    }

    setMediaUploading(true);
    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach((file) => {
        uploadFormData.append('files', file);
      });
      uploadFormData.append('projectSlug', formData.slug);
      
      const response = await fetch('/api/projects/upload-media', {
        method: 'POST',
        body: uploadFormData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          media: [...prev.media, ...result.media]
        }));
        
        const uploadedCount = result.media.length;
        toast.success(`Uploaded ${uploadedCount} file(s) successfully!`);
        
        // Show warnings for any failed files
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error: string) => {
            toast.warning(error);
          });
        }
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload media");
    } finally {
      setMediaUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
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
    } catch (error: any) {
      // Check if this is a Next.js redirect (which is expected)
      if (error?.digest?.includes("NEXT_REDIRECT")) {
        // This is a successful redirect, don't show error
        return;
      }
      // Only show error for actual errors
      const errorMessage = error instanceof Error ? error.message : "Failed to save project";
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
            <label htmlFor="name" className="block text-sm font-medium mb-2">
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
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              URL Slug *
            </label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
              placeholder="my-awesome-project"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be used in your project URL
            </p>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Project URL
            </label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://github.com/username/project or https://myproject.com"
            />
          </div>

          <div>
            <label htmlFor="oneliner" className="block text-sm font-medium mb-2">
              One-liner
            </label>
            <Input
              id="oneliner"
              value={formData.oneliner}
              onChange={(e) => setFormData((prev) => ({ ...prev, oneliner: e.target.value }))}
              placeholder="A brief tagline for your project"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Tell people about your project. What does it do? What problem does it solve? What technologies did you use?"
              rows={6}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="featured"
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
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
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="media-upload"
              disabled={mediaUploading}
            />
            <label
              htmlFor="media-upload"
              className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors block ${
                mediaUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="space-y-2">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    {mediaUploading ? "Uploading..." : "Click to upload images or videos"}
                  </span>
                  <p className="text-xs text-gray-500">
                    Images: PNG, JPG, GIF, WEBP • Videos: MP4, WEBM, MOV • Max 10MB each
                  </p>
                  {!formData.slug && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Set project name first to generate slug
                    </p>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Media Preview */}
          {formData.media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.media.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {item.type === "image" ? (
                      <img
                        src={getTransformedImageUrl(item.url)}
                        alt={item.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">{item.filename}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || mediaUploading}>
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