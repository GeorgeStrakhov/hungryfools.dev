import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserAuth } from "@/lib/api/user-auth";
import { getFullUserProfile } from "@/components/profile/profile.actions";
import { answerStructured } from "@/lib/services/llm/llm";
import { formatEmailAddress, sendEmail } from "@/lib/services/email/email";
import {
  createIntroductionPrompt,
  renderIntroductionEmail,
  type IntroductionEmailData,
} from "@/lib/email";

const introRequestSchema = z.object({
  handle: z.string().min(1, "Target handle is required"),
});

const introResponseSchema = z.object({
  subject: z
    .string()
    .describe(
      "A compelling and friendly subject line for the introduction email.",
    ),
  content: z
    .string()
    .describe(
      "The markdown content for the email body. Should be warm, personalized, and highlight commonalities. Address both users by their display names. Use proper markdown formatting (headers, lists, emphasis).",
    ),
  commonalities: z
    .array(z.string())
    .describe(
      "A list of key commonalities found between the two users (e.g., shared skills, interests, project domains).",
    ),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireUserAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }
    const { userId } = authResult;

    const body = await request.json();
    const validation = introRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { handle: targetHandle } = validation.data;

    // 1. Fetch profiles
    const requesterProfile = await getFullUserProfile({ userId });
    const targetProfile = await getFullUserProfile({ handle: targetHandle });

    if (!requesterProfile) {
      return NextResponse.json(
        { error: "Could not find your profile. Please complete it first." },
        { status: 400 },
      );
    }

    if (!targetProfile) {
      return NextResponse.json(
        { error: `User with handle "${targetHandle}" not found.` },
        { status: 404 },
      );
    }

    if (requesterProfile.id === targetProfile.id) {
      return NextResponse.json(
        { error: "You can't introduce yourself, silly!" },
        { status: 400 },
      );
    }

    // 2. Generate introduction with LLM
    const { systemPrompt, userPrompt } = createIntroductionPrompt(
      requesterProfile,
      targetProfile,
    );

    const introContent = await answerStructured({
      systemPrompt,
      userPrompt,
      responseSchema: introResponseSchema,
      temperature: 0.7,
    });

    // 3. Render the email using our template system
    const emailData: IntroductionEmailData = {
      subject: introContent.subject,
      content: introContent.content,
      requesterName: requesterProfile.displayName || requesterProfile.handle,
      targetName: targetProfile.displayName || targetProfile.handle,
      commonalities: introContent.commonalities,
    };

    const renderedEmail = renderIntroductionEmail(emailData);

    // 4. Send the email
    await sendEmail({
      from: formatEmailAddress(
        "PacDuck@hungryfools.dev",
        "PacDuck @ Hungry Fools",
      ),
      to: [requesterProfile.email, targetProfile.email],
      subject: renderedEmail.subject,
      htmlBody: renderedEmail.htmlBody,
      textBody: renderedEmail.textBody,
      tag: "introduction",
      metadata: {
        requesterId: requesterProfile.id,
        targetId: targetProfile.id,
      },
    });

    return NextResponse.json({
      message: "Introduction email sent successfully!",
      commonalities: introContent.commonalities,
    });
  } catch (error) {
    console.error("Introduction error:", error);
    return NextResponse.json(
      { error: "Failed to send introduction. Please try again later." },
      { status: 500 },
    );
  }
}
