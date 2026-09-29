import { ogCard } from "@/lib/og/card";

export const alt = "Craefto case studies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Case studies",
    title: "Selected work",
    description: "Brand, web and product work by Craefto, each built as a system rather than a one-off.",
  });
}
