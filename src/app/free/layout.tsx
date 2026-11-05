import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Free resources",
  brand: "Craefto Works",
  description: "Backgrounds, templates and tools from the Craefto studio, free for personal and client work.",
  path: "/free",
  image: { url: "/free/backgrounds/og.jpg", width: 1200, height: 630, alt: "Free resources from Craefto" },
});

export default function FreeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
