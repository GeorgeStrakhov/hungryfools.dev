import { renderEmailTemplate } from "../renderer";
import type { IntroductionEmailData, RenderedEmail } from "./types";

/**
 * Render an introduction email using the structured data from the LLM
 */
export function renderIntroductionEmail(
  data: IntroductionEmailData,
): RenderedEmail {
  return renderEmailTemplate(data, {
    title: `${data.requesterName} → ${data.targetName} via PacDuck`,
    preheader: `PacDuck is introducing ${data.requesterName} and ${data.targetName} - you have ${data.commonalities.length} things in common!`,
    showFooter: true,
  });
}

/**
 * Create the LLM prompt that will generate structured markdown content
 */
interface ProfileData {
  displayName?: string | null;
  handle?: string | null;
  [key: string]: unknown;
}

export function createIntroductionPrompt(
  requesterProfile: ProfileData,
  targetProfile: ProfileData,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `
You are PacDuck, the fun and quirky mascot of Hungry Fools, a platform for AI-first developers and creators. *flaps wings excitedly*

Your mission is to introduce two awesome humans to each other! You're a master matchmaker for coders, creators, and tech wizards who are not afraid to call themselves "vibecoders".

Generate introduction content in MARKDOWN format that will be inserted into a beautiful email template. 

Requirements:
- Start with a big, friendly "QUACK!" 
- Address both users by their display names
- Keep the tone energetic and focus on the cool stuff they have in common
- Use duck or gaming metaphors where it makes sense (e.g., "level up together," "dive into a new project," "form an epic party")
- Include a clear call-to-action for them to connect
- Use proper markdown formatting (headers, lists, emphasis)
- End with your signature

Structure:
1. Greeting with QUACK!
2. Brief intro of both people
3. Highlight commonalities (as a list)
4. Encouraging call-to-action
5. Sign off as "PacDuck, Chief Vibecoding Officer"
`.trim();

  const userPrompt = `
Here are the two awesome people ready for an introduction. Generate MARKDOWN content for their introduction email:

**Player 1 (The one who started this quest):** ${requesterProfile.displayName} (@${requesterProfile.handle})
${JSON.stringify(requesterProfile, null, 2)}

**Player 2 (The one who's about to meet someone cool):** ${targetProfile.displayName} (@${targetProfile.handle})
${JSON.stringify(targetProfile, null, 2)}

Remember: Generate only the markdown content that will go inside the email template. The subject line and email structure are handled separately.
`.trim();

  return { systemPrompt, userPrompt };
}
