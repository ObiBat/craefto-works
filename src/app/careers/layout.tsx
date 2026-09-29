import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Careers",
  description:
    "Join Craefto, a creative tech studio for designers, engineers and builders who care about craft. Remote first, meaningful projects, real ownership.",
  path: "/careers",
  image: "route",
});

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
