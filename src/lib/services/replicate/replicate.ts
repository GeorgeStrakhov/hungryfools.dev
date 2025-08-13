import Replicate from "replicate";
import { uploadFromUrl } from "@/lib/services/s3";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3";
  safetyFilterLevel?:
    | "block_low_and_above"
    | "block_medium_and_above"
    | "block_only_high";
  folder?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  key: string;
  size: number;
}

export async function generateImage(
  options: ImageGenerationOptions,
): Promise<ImageGenerationResult> {
  const {
    prompt,
    aspectRatio = "16:9",
    safetyFilterLevel = "block_only_high",
    folder = "generated-images",
  } = options;

  try {
    const input = {
      prompt,
      aspect_ratio: aspectRatio,
      output_format: "png" as const,
      safety_filter_level: safetyFilterLevel,
    };

    const output = await replicate.run("google/imagen-4", { input });

    if (!output || typeof output !== "object" || !("url" in output)) {
      throw new Error("Invalid response from Replicate API");
    }

    const replicateUrl = (output as { url(): string }).url();
    if (!replicateUrl) {
      throw new Error("No image URL returned from Replicate");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `imagen-4-${timestamp}.png`;

    const uploadResult = await uploadFromUrl(replicateUrl, filename, {
      folder,
      contentType: "image/png",
    });

    return {
      imageUrl: uploadResult.publicUrl,
      key: uploadResult.key,
      size: uploadResult.size,
    };
  } catch (error) {
    console.error("Image generation error:", error);
    throw new Error(
      `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
