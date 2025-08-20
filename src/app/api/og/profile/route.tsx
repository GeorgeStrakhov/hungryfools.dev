import { ImageResponse } from "@vercel/og";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// Use fetch with absolute URL for better Vercel compatibility
async function getPixelifySansFont() {
  try {
    // Try local file first (for local development)
    const fs = await import("fs");
    const path = await import("path");
    const fontPath = path.join(
      process.cwd(),
      "public/fonts/PixelifySans-Regular.ttf",
    );
    return fs.readFileSync(fontPath);
  } catch {
    // Fallback to fetch from public URL (for Vercel/production)
    const fontUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://hungryfools.dev"}/fonts/PixelifySans-Regular.ttf`;
    const response = await fetch(fontUrl);
    return Buffer.from(await response.arrayBuffer());
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return new Response("Missing handle parameter", { status: 400 });
    }

    // Fetch profile data
    const [result] = await db
      .select({
        profile: profiles,
        user: users,
      })
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.handle, handle.toLowerCase()))
      .limit(1);

    if (!result?.profile) {
      return new Response("Profile not found", { status: 404 });
    }

    const profile = result.profile;
    const user = result.user;

    // Get avatar URL with fallbacks
    const avatarUrl = profile.profileImage || user?.image || null;
    const displayName = profile.displayName || profile.handle;
    const headline = profile.headline;
    const vibeTags = profile.vibeTags || [];

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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
            }}
          >
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt=""
                width={120}
                height={120}
                style={{
                  borderRadius: "50%",
                  marginRight: 30,
                  border: "4px solid #333",
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h1
                style={{
                  fontSize: 60,
                  fontWeight: "bold",
                  color: "#fff",
                  margin: 0,
                  marginBottom: 10,
                }}
              >
                {displayName}
              </h1>
              <p
                style={{
                  fontSize: 28,
                  color: "#888",
                  margin: 0,
                }}
              >
                @{handle}
              </p>
            </div>
          </div>

          {headline && (
            <p
              style={{
                fontSize: 32,
                color: "#ccc",
                textAlign: "center",
                maxWidth: "80%",
                margin: "0 auto 30px",
                lineHeight: 1.4,
              }}
            >
              {headline}
            </p>
          )}

          {vibeTags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "center",
                maxWidth: "80%",
              }}
            >
              {vibeTags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#222",
                    border: "1px solid #444",
                    borderRadius: "20px",
                    fontSize: 24,
                    color: "#aaa",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

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
