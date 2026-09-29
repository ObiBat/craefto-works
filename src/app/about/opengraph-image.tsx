import { ogCard } from "@/lib/og/card";

export const alt = "About Craefto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "About",
    title: "About Craefto",
    description: "A creative tech studio in Sydney building brands, products and systems for founders and teams who think long-term.",
  });
}
