"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Loader2,
  Upload,
  Copy,
  Check,
  File,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface S3TestResult {
  success: boolean;
  key?: string;
  publicUrl?: string;
  size?: number;
  executionTime: number;
  error?: string;
}

export default function S3TestingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folder, setFolder] = useState("test-uploads");
  const [metadata, setMetadata] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<S3TestResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const addMetadata = () => {
    setMetadata([...metadata, { key: "", value: "" }]);
  };

  const removeMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const updateMetadata = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const updated = [...metadata];
    updated[index][field] = value;
    setMetadata(updated);
  };

  const handleTest = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", folder);

      // Add metadata
      const validMetadata = metadata.filter(
        (m) => m.key.trim() && m.value.trim(),
      );
      if (validMetadata.length > 0) {
        formData.append(
          "metadata",
          JSON.stringify(
            Object.fromEntries(
              validMetadata.map((m) => [m.key.trim(), m.value.trim()]),
            ),
          ),
        );
      }

      const response = await fetch("/api/admin/test-s3", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload file");
      }

      const result = await response.json();
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Upload className="h-8 w-8" />
          File Upload Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test file uploads to Cloudflare R2 storage
        </p>
      </div>

      {/* File Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select File</label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-accent flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors"
            >
              <File className="h-4 w-4" />
              Choose File
            </button>
            {selectedFile && (
              <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2">
                {isImageFile(selectedFile) ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
                )}
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Folder</label>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="test-uploads"
            className="w-full rounded-lg border p-3"
          />
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Metadata (optional)</label>
            <button
              onClick={addMetadata}
              className="hover:bg-accent flex items-center gap-1 rounded px-2 py-1 text-xs"
            >
              <Upload className="h-3 w-3" />
              Add
            </button>
          </div>
          {metadata.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item.key}
                onChange={(e) => updateMetadata(index, "key", e.target.value)}
                placeholder="key"
                className="flex-1 rounded border p-2 text-sm"
              />
              <input
                type="text"
                value={item.value}
                onChange={(e) => updateMetadata(index, "value", e.target.value)}
                placeholder="value"
                className="flex-1 rounded border p-2 text-sm"
              />
              <button
                onClick={() => removeMetadata(index)}
                className="hover:bg-accent rounded p-2"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={isLoading || !selectedFile}
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload File
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          {result.success && result.publicUrl ? (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Upload Result</h3>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span>
                    Size: {result.size ? formatFileSize(result.size) : "?"}
                  </span>
                  <span>Time: {result.executionTime}ms</span>
                  <button
                    onClick={() => copyToClipboard(result.publicUrl!)}
                    className="hover:bg-accent flex items-center gap-1 rounded px-2 py-1"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copy URL
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✅ File uploaded successfully
                  </p>
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    Key: {result.key}
                  </p>
                </div>

                {selectedFile && isImageFile(selectedFile) && (
                  <div className="rounded-lg border p-4">
                    <p className="mb-2 text-sm font-medium">Preview:</p>
                    <Image
                      src={result.publicUrl}
                      alt="Uploaded file"
                      width={400}
                      height={400}
                      className="h-auto max-w-full rounded-lg border"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                )}

                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="mb-1 text-sm font-medium">Public URL:</p>
                  <p className="font-mono text-xs break-all">
                    {result.publicUrl}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            result.error && (
              <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  ❌ Upload failed: {result.error}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
