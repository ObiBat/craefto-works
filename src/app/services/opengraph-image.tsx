import { ogCard } from "@/lib/og/card";

export const alt = "Craefto services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Services",
    title: "Five services, one team",
    description: "Brand identity, web design and development, digital products, AI automation and security audits, with transparent pricing.",
  });
}
