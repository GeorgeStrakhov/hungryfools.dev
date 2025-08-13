import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api/admin-auth";
import { sendEmail, SendEmailOptions } from "@/lib/services/email/email";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }

    const body = await request.json();
    const { from, to, subject, htmlBody, textBody, cc, bcc, tag, metadata } =
      body;

    if (!from || !to || !subject) {
      return NextResponse.json(
        { error: "from, to, and subject are required" },
        { status: 400 },
      );
    }

    if (!htmlBody && !textBody) {
      return NextResponse.json(
        { error: "Either htmlBody or textBody must be provided" },
        { status: 400 },
      );
    }

    const startTime = Date.now();

    const emailOptions: SendEmailOptions = {
      from,
      to,
      subject,
    };

    if (htmlBody) emailOptions.htmlBody = htmlBody;
    if (textBody) emailOptions.textBody = textBody;
    if (cc) emailOptions.cc = cc;
    if (bcc) emailOptions.bcc = bcc;
    if (tag) emailOptions.tag = tag;
    if (metadata) emailOptions.metadata = metadata;

    const response = await sendEmail(emailOptions);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      response,
      executionTime,
    });
  } catch (error) {
    console.error("Email test error:", error);
    const executionTime = Date.now();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        executionTime,
      },
      { status: 500 },
    );
  }
}
