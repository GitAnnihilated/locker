import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Site-wide social preview image (OG + Twitter card fallback). Next.js
// resolves this per-segment: any route without its own opengraph-image
// inherits this one, so every public page gets a real preview image
// instead of the browser's blank-link fallback.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#101F3D",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 20,
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <svg width="56" height="56" viewBox="0 0 40 40" fill="none">
              <rect x="15.2" y="10.4" width="5.6" height="14.4" rx="1.6" fill="#FFFFFF" />
              <rect x="15.2" y="19.2" width="20.8" height="5.6" rx="1.2" fill="#FFFFFF" />
              <circle cx="18" cy="10.4" r="4.4" fill="#FFFFFF" />
              <circle cx="18" cy="10.4" r="3.6" fill="#3E6BE0" />
            </svg>
          </div>
          <span style={{ fontSize: 84, fontWeight: 700, color: "#FFFFFF" }}>Locker</span>
        </div>
        <span style={{ marginTop: 28, fontSize: 32, color: "#B7C0D8" }}>
          The student platform for homework, groups & achievements
        </span>
      </div>
    ),
    { ...size },
  );
}
