import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api/admin-auth";
import { transcribeAudio } from "@/lib/services/speech/speech";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }

    const formData = await request.formData();
    const inputType = formData.get("inputType") as string;
    const language = formData.get("language") as string;
    const temperature = parseFloat(formData.get("temperature") as string || "0");

    const startTime = Date.now();

    try {
      let audioSource: string | Buffer;

      if (inputType === "file") {
        const file = formData.get("file") as File;
        if (!file) {
          return NextResponse.json(
            { error: "file is required when inputType is 'file'" },
            { status: 400 }
          );
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        audioSource = Buffer.from(arrayBuffer);
      } else if (inputType === "url") {
        const audioUrl = formData.get("audioUrl") as string;
        if (!audioUrl) {
          return NextResponse.json(
            { error: "audioUrl is required when inputType is 'url'" },
            { status: 400 }
          );
        }
        audioSource = audioUrl;
      } else {
        return NextResponse.json(
          { error: "inputType must be 'file' or 'url'" },
          { status: 400 }
        );
      }

      const transcription = await transcribeAudio(audioSource, {
        language: language === "auto" ? undefined : language,
        temperature,
      });

      const executionTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        transcription,
        executionTime,
      });
    } catch (serviceError) {
      const executionTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: false,
        error: serviceError instanceof Error ? serviceError.message : "Transcription failed",
        executionTime,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Speech test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}