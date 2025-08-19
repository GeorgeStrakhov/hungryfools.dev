import { OnboardingWizardProvider } from "./_context/wizard-context";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingWizardProvider>
      <div className="hf-container max-w-xl py-8">{children}</div>
    </OnboardingWizardProvider>
  );
}
