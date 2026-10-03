import { ogCard } from "@/lib/og/card";

export const alt = "Craefto Works, a creative & technology studio in Sydney";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Craefto Works · Creative & Technology Studio",
    title: "We build how businesses look, communicate and operate.",
    description: "Brand, Product, Systems, Media and Growth, brought together under one studio.",
  });
}
