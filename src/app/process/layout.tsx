import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How we work",
  brand: "Craefto Works",
  description:
    "Six stages, from Discover to Evolve, shaped to the work: brand, product, systems, media or growth. A fixed price before any work begins, and support after launch.",
  path: "/process",
  image: "route",
});

export default function ProcessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
