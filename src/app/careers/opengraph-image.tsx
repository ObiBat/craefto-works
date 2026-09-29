import { ogCard } from "@/lib/og/card";

export const alt = "Careers at Craefto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Careers",
    title: "Join Craefto",
    description: "A creative tech studio for designers, engineers and builders who care about craft. Remote first, real ownership.",
  });
}
