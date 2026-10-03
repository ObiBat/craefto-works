import { ogCard } from "@/lib/og/card";

export const alt = "About Craefto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "About",
    title: "About Craefto Works",
    description: "A creative & technology studio in Sydney: brand, product, systems, media and growth under one roof.",
  });
}
