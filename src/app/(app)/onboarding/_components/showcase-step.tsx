"use client";

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
}

export function ShowcaseStep({ onNext, onBack, onSkip }: ShowcaseStepProps) {
  // For now, ProjectForm handles its own state management
  // TODO: Add project loading when we have a projects API endpoint

  const handleSubmit = async (data: ProjectFormData) => {
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

      <ProjectForm
        mode="onboarding"
        onSubmit={handleSubmit}
        onBack={onBack}
        onSkip={onSkip}
        enhanceWithAI={true}
        showPreview={true}
        submitLabel="Create Project"
        initialData={{
          featured: true, // First project is featured by default
        }}
      />
    </div>
  );
}
