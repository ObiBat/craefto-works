import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { construction } from "@/content/construction";

export const metadata: Metadata = pageMetadata({
  title: "Construction Operations & AI Integration",
  brand: "Craefto Works",
  description: construction.description,
  path: construction.path,
  image: "route",
});

export default function ConstructionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
