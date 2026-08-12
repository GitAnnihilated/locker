import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — square with brand fill (Apple auto-rounds the corners), so the mark gets room to breathe. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#101F3D",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 40 40" fill="none">
          <rect x="15.2" y="10.4" width="5.6" height="14.4" rx="1.6" fill="#FFFFFF" />
          <rect x="15.2" y="19.2" width="20.8" height="5.6" rx="1.2" fill="#FFFFFF" />
          <circle cx="18" cy="10.4" r="4.4" fill="#FFFFFF" />
          <circle cx="18" cy="10.4" r="3.6" fill="#3E6BE0" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
