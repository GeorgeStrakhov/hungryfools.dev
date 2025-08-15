// Main email exports
export { renderEmailTemplate } from "./renderer";
export { createBaseTemplate } from "./templates/base";
export {
  renderIntroductionEmail,
  createIntroductionPrompt,
} from "./templates/introduction";

// Type exports
export type {
  EmailTemplateData,
  IntroductionEmailData,
  RenderedEmail,
  EmailType,
} from "./templates/types";
