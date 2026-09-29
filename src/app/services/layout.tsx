import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description:
    "Brand identity, web design and development, digital products, AI automation and security audits, with transparent pricing from one team.",
  path: "/services",
  image: "route",
});

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
