import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { caseStudies } from "@/content/case-studies";

const ownProducts = caseStudies.filter((study) => /^internal/i.test(study.client)).length;

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `Craefto Works is a Sydney studio for brand, digital products, business systems, media and growth, founded in 2025. ${caseStudies.length} projects shipped: ${caseStudies.length - ownProducts} for clients and ${ownProducts} of our own.`,
  path: "/about",
  image: "route",
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
