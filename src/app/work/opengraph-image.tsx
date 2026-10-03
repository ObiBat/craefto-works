import { ogCard } from "@/lib/og/card";

export const alt = "Craefto Works case studies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Case studies",
    title: "Selected work",
    description: "Brand, product, systems, media and growth: projects by Craefto Works, each written up as a case study.",
  });
}
