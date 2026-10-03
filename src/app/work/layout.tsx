import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Case studies",
  brand: "Craefto Works",
  description:
    "Case studies across brand, product, systems, media and growth: identities, websites and apps, internal tools and automation, photography and film.",
  path: "/work",
  image: "route",
});

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
