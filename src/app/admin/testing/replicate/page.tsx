"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Loader2,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageTestResult {
  success: boolean;
  imageUrl?: string;
  key?: string;
  size?: number;
  executionTime: number;
  error?: string;
}

const promptExamples = [
  {
    name: "Abstract Art",
    prompt:
      "A vibrant abstract painting with flowing colors and dynamic brushstrokes, digital art",
  },
  {
    name: "Landscape",
    prompt:
      "A serene mountain landscape at sunset with a crystal clear lake reflection, photorealistic",
  },
  {
    name: "Portrait",
    prompt:
      "Professional headshot of a confident software developer, studio lighting, modern background",
  },
  {
    name: "Logo Design",
    prompt:
      "Modern minimalist logo for a tech startup, clean geometric shapes, blue and white color scheme",
  },
  {
    name: "Product Photo",
    prompt:
      "A sleek smartphone on a clean white background, product photography, professional lighting",
  },
];

const aspectRatios = [
  { label: "Square (1:1)", value: "1:1" },
  { label: "Landscape (16:9)", value: "16:9" },
  { label: "Portrait (9:16)", value: "9:16" },
  { label: "Standard (4:3)", value: "4:3" },
  { label: "Portrait (3:4)", value: "3:4" },
  { label: "Wide (3:2)", value: "3:2" },
  { label: "Tall (2:3)", value: "2:3" },
];

const safetyLevels = [
  { label: "Block Only High", value: "block_only_high" },
  { label: "Block Medium and Above", value: "block_medium_and_above" },
  { label: "Block Low and Above", value: "block_low_and_above" },
];

export default function ReplicateTestingPage() {
  const [prompt, setPrompt] = useState(promptExamples[0].prompt);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [safetyLevel, setSafetyLevel] = useState<string>("block_only_high");
  const [folder, setFolder] = useState("test-images");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageTestResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExampleSelect = (example: (typeof promptExamples)[0]) => {
    setPrompt(example.prompt);
  };

  const handleTest = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/test-replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          safetyFilterLevel: safetyLevel,
          folder,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate image");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <ImageIcon className="h-8 w-8" />
          Image Generation Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test AI image generation using Replicate models
        </p>
      </div>

      {/* Example Prompts */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Example Prompts</label>
        <div className="flex flex-wrap gap-2">
          {promptExamples.map((example) => (
            <button
              key={example.name}
              onClick={() => handleExampleSelect(example)}
              className="hover:bg-accent rounded-full border px-3 py-1 text-xs transition-colors"
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="h-32 w-full resize-none rounded-lg border p-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Folder (optional)</label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="test-images"
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Aspect Ratio</label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue placeholder="Select aspect ratio..." />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Safety Filter Level</label>
            <Select value={safetyLevel} onValueChange={setSafetyLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select safety level..." />
              </SelectTrigger>
              <SelectContent>
                {safetyLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={isLoading || !prompt.trim()}
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Image...
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4" />
            Generate Image
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
          {result.success && result.imageUrl ? (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Generated Image</h3>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span>
                    Size: {result.size ? Math.round(result.size / 1024) : "?"}{" "}
                    KB
                  </span>
                  <span>Time: {result.executionTime}ms</span>
                  <button
                    onClick={() => copyToClipboard(result.imageUrl!)}
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

              <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
                <Image
                  src={result.imageUrl}
                  alt="Generated image"
                  width={500}
                  height={500}
                  className="h-auto max-w-full rounded-lg border"
                  style={{ maxHeight: "500px" }}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Key: {result.key}
                  </span>
                  <a
                    href={result.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:bg-accent flex items-center gap-1 rounded px-2 py-1"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          ) : (
            result.error && (
              <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  ❌ Image generation failed: {result.error}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
