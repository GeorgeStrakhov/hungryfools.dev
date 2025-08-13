import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api/admin-auth";
import { generateImage } from "@/lib/services/replicate/replicate";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }

    const body = await request.json();
    const { prompt, aspectRatio, safetyFilterLevel, folder } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      const result = await generateImage({
        prompt,
        aspectRatio: aspectRatio || '16:9',
        safetyFilterLevel: safetyFilterLevel || 'block_only_high',
        folder: folder || 'test-images',
      });

      const executionTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        key: result.key,
        size: result.size,
        executionTime,
      });
    } catch (serviceError) {
      const executionTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: false,
        error: serviceError instanceof Error ? serviceError.message : "Image generation failed",
        executionTime,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Replicate test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}