import { ogCard } from "@/lib/og/card";

export const alt = "New to Craefto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "First time here?",
    title: "New here? Let us introduce ourselves.",
    description: "A small, focused team in Sydney that designs and builds digital products for businesses that care about quality.",
  });
}
