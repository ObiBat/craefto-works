import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Changelog",
  description:
    "Every improvement, feature and refinement shipped to craefto.com. Building in public since January 2026.",
  path: "/changelog",
});

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
