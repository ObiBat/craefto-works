import { ogCard } from "@/lib/og/card";

export const alt = "Craefto changelog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Changelog",
    title: "Building in public",
    description: "Every improvement, feature and refinement shipped to craefto.com since January 2026.",
  });
}
