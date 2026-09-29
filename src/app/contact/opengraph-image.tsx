import { ogCard } from "@/lib/og/card";

export const alt = "Start a project with Craefto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Contact",
    title: "Start a project",
    description: "Tell us what you're building and we'll reply within one to two days.",
  });
}
