"use client";

import { useState } from "react";
import { ProjectForm } from "@/components/projects/project-form";
import { saveShowcaseAction } from "@/app/(app)/onboarding/actions";
import { STEP_CONFIG } from "../_lib/steps";
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

interface ShowcaseStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isFinalizingProfile?: boolean;
}

export function ShowcaseStep({
  onNext,
  onBack,
  onSkip,
  isFinalizingProfile = false,
}: ShowcaseStepProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (data: ProjectFormData) => {
    setIsSaving(true);
    try {
      // Convert ProjectForm data to showcase action format for AI enhancement
      await saveShowcaseAction({
        title: data.name,
        link: data.url,
        githubUrl: data.githubUrl,
        oneliner: data.oneliner,
        summary: data.description,
        media: data.media,
      });
      onNext();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative space-y-6">
      {/* Loading overlay when creating profile */}
      {isFinalizingProfile && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="space-y-4 text-center">
            <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-lg font-medium">Creating your profile...</p>
            <p className="text-muted-foreground text-sm">
              This will just take a moment
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-semibold">{STEP_CONFIG.showcase.title}</h1>
        {STEP_CONFIG.showcase.subtitle && (
          <p className="text-muted-foreground mt-2">
            {STEP_CONFIG.showcase.subtitle}
          </p>
        )}
      </div>

      <ProjectForm
        mode="onboarding"
        onSubmit={handleSubmit}
        onBack={onBack}
        onSkip={onSkip}
        enhanceWithAI={true}
        showPreview={false}
        submitLabel="Create Project"
        isLoading={isSaving || isFinalizingProfile}
        initialData={{
          featured: true, // First project is featured by default
        }}
      />
    </div>
  );
}
