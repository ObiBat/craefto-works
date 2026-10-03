import { ogCard } from "@/lib/og/card";

export const alt = "Craefto Works, a creative & technology studio in Sydney";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Creative & technology studio",
    title: "Built to compound.",
    description: "We bring brand, product, systems, media and growth under one roof, helping businesses improve how they look, communicate and operate.",
  });
}
