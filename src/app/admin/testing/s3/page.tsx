"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, Copy, Check, File, Image as ImageIcon, X } from "lucide-react";

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
  const [metadata, setMetadata] = useState<Array<{key: string; value: string}>>([]);
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

  const updateMetadata = (index: number, field: "key" | "value", value: string) => {
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
      const validMetadata = metadata.filter(m => m.key.trim() && m.value.trim());
      if (validMetadata.length > 0) {
        formData.append("metadata", JSON.stringify(
          Object.fromEntries(validMetadata.map(m => [m.key.trim(), m.value.trim()]))
        ));
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
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
              className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <File className="h-4 w-4" />
              Choose File
            </button>
            {selectedFile && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                {isImageFile(selectedFile) ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
                )}
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
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
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Metadata (optional)</label>
            <button
              onClick={addMetadata}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-accent"
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
                className="flex-1 p-2 border rounded text-sm"
              />
              <input
                type="text"
                value={item.value}
                onChange={(e) => updateMetadata(index, "value", e.target.value)}
                placeholder="value"
                className="flex-1 p-2 border rounded text-sm"
              />
              <button
                onClick={() => removeMetadata(index)}
                className="p-2 hover:bg-accent rounded"
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
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <div className="border border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          {result.success && result.publicUrl ? (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Upload Result</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Size: {result.size ? formatFileSize(result.size) : '?'}</span>
                  <span>Time: {result.executionTime}ms</span>
                  <button
                    onClick={() => copyToClipboard(result.publicUrl!)}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy URL
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                    ✅ File uploaded successfully
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Key: {result.key}
                  </p>
                </div>

                {selectedFile && isImageFile(selectedFile) && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <img
                      src={result.publicUrl}
                      alt="Uploaded file"
                      className="max-w-full h-auto rounded-lg border"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                )}

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-1">Public URL:</p>
                  <p className="text-xs font-mono break-all">{result.publicUrl}</p>
                </div>
              </div>
            </div>
          ) : (
            result.error && (
              <div className="border border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
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