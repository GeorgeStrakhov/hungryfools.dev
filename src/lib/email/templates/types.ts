export interface EmailTemplateData {
  subject: string;
  content: string; // Markdown content
  metadata?: Record<string, unknown>;
}

export interface IntroductionEmailData extends EmailTemplateData {
  requesterName: string;
  targetName: string;
  commonalities: string[];
}

export interface RenderedEmail {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export type EmailType = "introduction" | "welcome" | "notification";
