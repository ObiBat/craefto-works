import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Craefto is a creative tech studio in Sydney building brands, products and systems for founders and teams who think long-term.",
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
