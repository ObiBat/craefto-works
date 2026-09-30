import { ogCard } from "@/lib/og/card";

export const alt = "Craefto Works capabilities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Capabilities",
    title: "Brand, product, systems, media, growth",
    description: "Craefto Works brings brand, digital products, business systems and creative content together.",
  });
}
