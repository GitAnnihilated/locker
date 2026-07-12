import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Locker",
    short_name: "Locker",
    description: "The shared brain of your class.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F7FAF8",
    theme_color: "#00573C",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
