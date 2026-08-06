import { ImageResponse } from "next/og";

// 1200x630 is the recommended OpenGraph image size.
// Render at request time — no static asset to ship.
export const runtime = "edge";
export const alt = "Opportunity Hunter — AI Startup Discovery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
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
          background:
            "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "white",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 32,
          }}
        >
          <span style={{ marginRight: 24 }}>🎯</span>
          <span>Opportunity Hunter</span>
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Discover startup opportunities from Reddit, Hacker News, and
          Product Hunt — powered by AI.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 60,
            gap: 16,
            fontSize: 24,
            color: "#64748b",
          }}
        >
          <span>Pain Detection</span>
          <span>·</span>
          <span>Clustering</span>
          <span>·</span>
          <span>VC Scoring</span>
          <span>·</span>
          <span>Memos</span>
        </div>
      </div>
    ),
    { ...size },
  );
}