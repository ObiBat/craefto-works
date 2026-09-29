import { ogCard } from "@/lib/og/card";

export const alt = "The Craefto Journal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Journal",
    title: "The Craefto Journal",
    description: "Insights on systems thinking, applied AI, product craft and creative technology from the Craefto team.",
  });
}
