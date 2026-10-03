import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  brand: "Craefto Works",
  description:
    "Start a project with Craefto Works: a brand, a campaign shoot, a website, a product or an automation system. Tell us what you need and we'll reply within one to two days.",
  path: "/contact",
  image: "route",
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
