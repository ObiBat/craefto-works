import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Case studies",
  description:
    "Selected brand, web and product work by Craefto, each built as a system rather than a one-off.",
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
