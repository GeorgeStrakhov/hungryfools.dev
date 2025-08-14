"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getTransformedImageUrl } from "@/lib/services/s3/s3";
import type { ProjectMedia } from "@/db/schema/profile";

interface MediaUploadProps {
  projectSlug: string;
  media: ProjectMedia[];
  onMediaUpdate: (media: ProjectMedia[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function MediaUpload({
  projectSlug,
  media,
  onMediaUpdate,
  maxFiles = 10,
  disabled = false,
  className = "",
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    if (!projectSlug) {
      toast.error("Project slug is required for file upload");
      return;
    }

    if (media.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach((file) => {
        uploadFormData.append("files", file);
      });
      uploadFormData.append("projectSlug", projectSlug);

      const response = await fetch("/api/projects/upload-media", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        const newMedia = [...media, ...result.media];
        onMediaUpdate(newMedia);

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
      toast.error(
        error instanceof Error ? error.message : "Failed to upload media",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    onMediaUpdate(newMedia);
  };

  const canUpload =
    !disabled && !uploading && projectSlug && media.length < maxFiles;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          id="media-upload"
          disabled={!canUpload}
        />
        <label
          htmlFor="media-upload"
          className={`block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors ${
            canUpload
              ? "hover:border-gray-400"
              : "cursor-not-allowed opacity-50"
          }`}
        >
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg
                className="mx-auto h-12 w-12"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <span className="text-sm text-gray-600">
                {uploading
                  ? "Uploading..."
                  : "Click to upload images or videos"}
              </span>
              <p className="text-xs text-gray-500">
                Images: PNG, JPG, GIF, WEBP • Videos: MP4, WEBM, MOV • Max 10MB
                each
              </p>
              {maxFiles < 10 && (
                <p className="text-xs text-gray-500">
                  Max {maxFiles} files for onboarding
                </p>
              )}
              {!projectSlug && (
                <p className="mt-1 text-xs text-orange-600">
                  ⚠️ Project name required first
                </p>
              )}
              {media.length >= maxFiles && (
                <p className="mt-1 text-xs text-orange-600">
                  ⚠️ Maximum files reached
                </p>
              )}
            </div>
          </div>
        </label>
      </div>

      {/* Media Preview */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {media.map((item, index) => (
            <div key={index} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                {item.type === "image" ? (
                  <img
                    src={getTransformedImageUrl(item.url)}
                    alt={item.filename}
                    className="h-full w-full object-cover"
                    loading="lazy"
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
                      <svg
                        className="h-8 w-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                ×
              </button>
              <p className="mt-1 truncate text-xs text-gray-500">
                {item.filename}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
