export const STEPS = [
  "purpose",
  "handle",
  "location",
  "vibe",
  "stack",
  "expertise",
  "showcase",
  "done",
] as const;

export type Step = (typeof STEPS)[number];

export interface StepConfig {
  title: string;
  subtitle?: string;
  canSkip?: boolean;
  requiresHandle?: boolean;
}

export const STEP_CONFIG: Record<Step, StepConfig> = {
  purpose: {
    title: "PacDuck says welcome!",
    subtitle: "What are you here for, dear?",
  },
  handle: {
    title: "Pick your handle",
    subtitle: "This will be your unique identifier",
  },
  location: {
    title: "Where are you based?",
    subtitle: "Help others find local collaborators",
    canSkip: true,
    requiresHandle: true,
  },
  vibe: {
    title: "What's your vibe?",
    subtitle: "Pick tags that describe your AI development style",
    requiresHandle: true,
  },
  stack: {
    title: "What's your stack?",
    subtitle: "Technologies you love working with",
    requiresHandle: true,
  },
  expertise: {
    title: "Any other expertise?",
    subtitle: "Skills beyond coding",
    canSkip: true,
    requiresHandle: true,
  },
  showcase: {
    title: "Add your first project?",
    subtitle: "Show off something cool you've built",
    canSkip: true,
    requiresHandle: true,
  },
  done: {
    title: "PacDuck says hooray!",
    subtitle: "You're all set. Go find AI developers to vibe with.",
  },
};

export function isValidStep(step: string): step is Step {
  return STEPS.includes(step as Step);
}

export function getNextStep(currentStep: Step): Step | null {
  const currentIndex = STEPS.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === STEPS.length - 1) {
    return null;
  }
  return STEPS[currentIndex + 1];
}

export function getPrevStep(currentStep: Step): Step | null {
  const currentIndex = STEPS.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return STEPS[currentIndex - 1];
}

export function getStepProgress(currentStep: Step): number {
  const currentIndex = STEPS.indexOf(currentStep);
  return Math.round(((currentIndex + 1) / STEPS.length) * 100);
}

export function buildStepUrl(step: Step, handle?: string): string {
  const url = `/onboarding/${step}`;
  if (handle && STEP_CONFIG[step].requiresHandle) {
    return `${url}?handle=${encodeURIComponent(handle)}`;
  }
  return url;
}
