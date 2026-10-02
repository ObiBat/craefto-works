import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "First time here?",
  description:
    "New to Craefto Works? The short version: who we are, the three ways to work with us and what they cost, what's different, and how to start.",
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
