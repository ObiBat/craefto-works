import { ogCard } from "@/lib/og/card";

export const alt = "How we work at Craefto Works: six stages, shaped to the work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "How we work",
    title: "Six stages, shaped to the work",
    description: "Discover, Define, Create, Build / Produce, Launch and Evolve, for brand, product, systems, media and growth.",
  });
}
