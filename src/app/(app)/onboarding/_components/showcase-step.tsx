"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaUpload } from "@/components/projects/media-upload";
import { saveShowcaseAction } from "@/app/(app)/onboarding/actions";
import { toast } from "sonner";
import { validateStep } from "@/lib/hooks/useModeration";
import { STEP_CONFIG } from "../_lib/steps";
import type { ProjectMedia } from "@/db/schema/profile";
import slugify from "slugify";

interface ShowcaseStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function ShowcaseStep({ onNext, onBack, onSkip }: ShowcaseStepProps) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [summary, setSummary] = useState("");
  const [media, setMedia] = useState<ProjectMedia[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);

  // Generate project slug from title
  const projectSlug = title
    ? slugify(title, { lower: true, strict: true, trim: true })
    : "";

  const handleNext = async () => {
    if (!title.trim() && !link.trim() && !summary.trim()) {
      toast.error("Please fill in at least one field or skip this step");
      return;
    }

    try {
      // Moderate showcase inputs if provided
      if (title.trim()) {
        await validateStep(title.trim(), "showcase-title", 100);
      }
      if (summary.trim()) {
        await validateStep(summary.trim(), "showcase-summary", 300);
      }
      // Note: Link validation could be added separately if needed

      await saveShowcaseAction({ title, link, summary, media });
      onNext();
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err?.name === "ModerationError") {
        toast.error(err.message || "Content did not pass moderation");
      } else {
        toast.error("Could not save. Try again.");
      }
    }
  };

  const handleSkip = async () => {
    onSkip();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.showcase.title}</h1>
        {STEP_CONFIG.showcase.subtitle && (
          <p className="text-muted-foreground mt-2">
            {STEP_CONFIG.showcase.subtitle}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium">
                Project name
              </label>
              <Input
                id="title"
                placeholder="AI Agent Dashboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {title && (
                <p className="text-muted-foreground mt-1 text-xs">
                  URL: hungryfools.dev/u/your-handle/p/
                  {projectSlug || "project-slug"}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="link" className="mb-2 block text-sm font-medium">
                Project URL
              </label>
              <Input
                id="link"
                placeholder="https://github.com/username/ai-agent-dashboard"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="summary"
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="summary"
                placeholder="Multi-agent RAG system built with CrewAI and Supabase. Orchestrates research agents that can analyze documents and provide insights through a Next.js dashboard..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Project Images</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMediaUpload(!showMediaUpload)}
              >
                {showMediaUpload ? "Hide" : "Add Images"}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              {showMediaUpload
                ? "Upload screenshots, demos, or other visuals (optional)"
                : "Add some visual flair to your project"}
            </p>
          </CardHeader>
          {showMediaUpload && (
            <CardContent>
              <MediaUpload
                projectSlug={projectSlug}
                media={media}
                onMediaUpdate={setMedia}
                maxFiles={3}
                className=""
              />
            </CardContent>
          )}
        </Card>

        {/* Project Preview */}
        {(title || summary || media.length > 0) && (
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
                {title && (
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                      <span className="bg-primary text-primary-foreground rounded px-2 py-1">
                        Featured
                      </span>
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          View Project →
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {summary && (
                  <p className="text-muted-foreground text-sm">{summary}</p>
                )}
                {media.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {media.slice(0, 2).map((item, index) => (
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

        <div className="nav-buttons flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button onClick={handleNext}>
              {title || summary || media.length > 0 ? "Create Project" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
