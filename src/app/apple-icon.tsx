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
          background: "#00573C",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 40 40" fill="none">
          <path d="M13.5 20 V15 a6.5 6.5 0 0 1 13 0 V20" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <rect x="9" y="18.5" width="22" height="16" rx="6" fill="#FFFFFF" />
          <circle cx="20" cy="25" r="2.5" fill="#FF9500" />
          <path d="M18.5 26.2 L20 30.6 L21.5 26.2 Z" fill="#FF9500" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
