import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadFile } from "@/lib/services/s3/s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type (${file.type})` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(buffer, file.name, {
      folder: `company-logos/${session.user.id}`,
      metadata: {
        userId: session.user.id,
        uploadedAt: new Date().toISOString(),
        kind: "company-logo",
      },
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: result.publicUrl,
      key: result.key,
      size: result.size,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
