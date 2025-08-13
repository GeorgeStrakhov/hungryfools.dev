import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api/admin-auth";
import { uploadFile } from "@/lib/services/s3/s3";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.isValid) {
      return authResult.response;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;
    const metadataString = formData.get("metadata") as string;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const startTime = Date.now();

    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Parse metadata if provided
      let metadata: Record<string, string> | undefined;
      if (metadataString) {
        try {
          metadata = JSON.parse(metadataString);
        } catch {
          return NextResponse.json(
            { error: "Invalid metadata JSON" },
            { status: 400 },
          );
        }
      }

      const result = await uploadFile(buffer, file.name, {
        folder: folder || "test-uploads",
        contentType: file.type,
        metadata,
      });

      const executionTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        key: result.key,
        publicUrl: result.publicUrl,
        size: result.size,
        executionTime,
      });
    } catch (serviceError) {
      const executionTime = Date.now() - startTime;

      return NextResponse.json(
        {
          success: false,
          error:
            serviceError instanceof Error
              ? serviceError.message
              : "Upload failed",
          executionTime,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("S3 test error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
