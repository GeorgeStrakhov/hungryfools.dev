"use client";

import * as React from "react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  uploadUrl: string; // API endpoint that accepts FormData { file }
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  uploadUrl,
  label = "Upload logo",
  disabled = false,
  className,
}: ImageUploadProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(file: File) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Upload failed");
      }
      onChange(data.url as string);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileChange(f);
          }}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "relative block cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            disabled || uploading
              ? "border-muted-foreground/30 text-muted-foreground cursor-not-allowed opacity-70"
              : "hover:border-foreground/40 border-muted-foreground/40",
          )}
        >
          <div className="space-y-2">
            <div className="text-muted-foreground">
              <svg
                className="mx-auto h-10 w-10"
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
            <div className="space-y-1">
              <div className="font-medium">
                {uploading ? "Uploading…" : value ? "Replace logo" : label}
              </div>
              <div className="text-muted-foreground text-xs">
                PNG, JPG, GIF, WEBP, SVG up to 5MB
              </div>
            </div>
          </div>
        </label>
      </div>

      {value && (
        <div className="flex items-center gap-3">
          <img src={value} alt="Logo preview" className="h-12 w-12 rounded" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(null)}
            disabled={disabled || uploading}
          >
            Remove
          </Button>
        </div>
      )}

      {error && <div className="text-destructive text-sm">{error}</div>}
    </div>
  );
}
