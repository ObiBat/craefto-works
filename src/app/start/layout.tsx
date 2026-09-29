import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "First time here?",
  description:
    "Craefto is a small, focused team in Sydney that designs and builds digital products for businesses that care about quality. Here is how we work.",
  path: "/start",
  image: "route",
});

export default function StartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
