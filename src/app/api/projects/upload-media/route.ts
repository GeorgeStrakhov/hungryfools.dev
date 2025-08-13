import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadFiles } from "@/lib/services/s3/s3";
import type { ProjectMedia } from "@/db/schema/profile";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/mov", "video/avi"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const projectSlug = formData.get("projectSlug") as string;

    if (!projectSlug) {
      return NextResponse.json(
        { error: "Project slug is required" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate files
    const errors: string[] = [];
    const validFiles: { file: File; buffer: Buffer }[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        continue;
      }

      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type (${file.type})`);
        continue;
      }

      // Convert to buffer
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        validFiles.push({ file, buffer });
      } catch (error) {
        errors.push(`${file.name}: Failed to process file`);
      }
    }

    if (validFiles.length === 0) {
      return NextResponse.json(
        { 
          error: "No valid files to upload",
          details: errors 
        },
        { status: 400 }
      );
    }

    // Upload to S3 with organized folder structure
    const uploadData = validFiles.map(({ file, buffer }) => ({
      file: buffer,
      filename: file.name,
    }));

    const uploadOptions = {
      folder: `projects/${session.user.id}/${projectSlug}`,
      metadata: {
        userId: session.user.id,
        projectSlug: projectSlug,
        uploadedAt: new Date().toISOString(),
      },
    };

    const uploadResults = await uploadFiles(uploadData, uploadOptions);

    // Transform upload results to ProjectMedia format
    const mediaItems: ProjectMedia[] = uploadResults.map((result, index) => {
      const originalFile = validFiles[index].file;
      return {
        url: result.publicUrl,
        type: ALLOWED_IMAGE_TYPES.includes(originalFile.type) ? "image" : "video",
        filename: originalFile.name,
        size: result.size,
        key: result.key,
      };
    });

    return NextResponse.json({
      success: true,
      media: mediaItems,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { 
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check upload status or limits
export async function GET() {
  return NextResponse.json({
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
    maxFiles: 10, // Reasonable limit
  });
}