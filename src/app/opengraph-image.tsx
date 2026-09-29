import { ogCard } from "@/lib/og/card";

export const alt = "Craefto, a creative tech studio in Sydney";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Creative tech studio",
    title: "Built to compound.",
    description: "We design and build brands, products and tools for founders and teams who value craft.",
  });
}
