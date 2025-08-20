import { ImageResponse } from "@vercel/og";
import { db } from "@/db";
import { profiles, projects } from "@/db/schema/profile";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

// Use fetch with absolute URL for better Vercel compatibility
async function getPixelifySansFont() {
  try {
    // Try local file first (for local development)
    const fs = await import("fs");
    const path = await import("path");
    const fontPath = path.join(process.cwd(), 'public/fonts/PixelifySans-Regular.ttf');
    return fs.readFileSync(fontPath);
  } catch {
    // Fallback to fetch from public URL (for Vercel/production)
    const fontUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hungryfools.dev'}/fonts/PixelifySans-Regular.ttf`;
    const response = await fetch(fontUrl);
    return Buffer.from(await response.arrayBuffer());
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");
    const slug = searchParams.get("slug");

    if (!handle || !slug) {
      return new Response("Missing handle or slug parameter", { status: 400 });
    }

    // Fetch profile data
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.handle, handle.toLowerCase()))
      .limit(1);

    if (!profile) {
      return new Response("Profile not found", { status: 404 });
    }

    // Fetch project data
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, profile.userId), eq(projects.slug, slug)))
      .limit(1);

    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    // Get first project image if available
    const projectImage =
      project.media?.[0]?.type === "image" ? project.media[0].url : null;

    const displayName = profile.displayName || profile.handle;
    const projectName = project.name;
    const oneliner = project.oneliner;
    const featured = project.featured;
    const hasUrl = Boolean(project.url);
    const hasGithub = Boolean(project.githubUrl);
    
    // Load font
    const pixelifySansBuffer = await getPixelifySansFont();

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000",
            backgroundImage: "linear-gradient(to bottom, #111, #000)",
            fontFamily: "Pixelify Sans",
            position: "relative",
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "8px",
              background: "linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)",
            }}
          />

          {/* Project image preview if available */}
          {projectImage && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={projectImage}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            {featured && (
              <span
                style={{
                  padding: "6px 16px",
                  backgroundColor: "#60a5fa",
                  color: "#000",
                  borderRadius: "20px",
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 20,
                }}
              >
                FEATURED
              </span>
            )}

            <h1
              style={{
                fontSize: 72,
                fontWeight: "bold",
                color: "#fff",
                margin: 0,
                marginBottom: 20,
                textAlign: "center",
                maxWidth: "90%",
              }}
            >
              {projectName}
            </h1>

            {oneliner && (
              <p
                style={{
                  fontSize: 36,
                  color: "#aaa",
                  textAlign: "center",
                  maxWidth: "80%",
                  margin: "0 auto 40px",
                  lineHeight: 1.3,
                }}
              >
                {oneliner}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: 20,
              }}
            >
              <span style={{ fontSize: 28, color: "#666" }}>by</span>
              <span style={{ fontSize: 32, color: "#fff", fontWeight: "bold" }}>
                {displayName}
              </span>
              <span style={{ fontSize: 28, color: "#666" }}>@{handle}</span>
            </div>

            {(hasUrl || hasGithub) && (
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  marginTop: 30,
                }}
              >
                {hasUrl && (
                  <span
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#222",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      fontSize: 24,
                      color: "#888",
                    }}
                  >
                    🔗 Live Demo
                  </span>
                )}
                {hasGithub && (
                  <span
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#222",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      fontSize: 24,
                      color: "#888",
                    }}
                  >
                    📦 Open Source
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom branding */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: 28, color: "#666" }}>hungryfools.dev</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Pixelify Sans",
            data: pixelifySansBuffer,
            style: "normal",
          },
        ],
      },
    );
  } catch (e) {
    console.error("OG Image generation error:", e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
