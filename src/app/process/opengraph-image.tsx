import { ogCard } from "@/lib/og/card";

export const alt = "How Craefto works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "How we work",
    title: "Four clear phases",
    description: "From understanding your goals to launch and growth. No surprises, no scope creep, fixed pricing.",
  });
}
