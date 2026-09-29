import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How we work",
  description:
    "Every Craefto project follows four clear phases, from understanding your goals to launch and growth. No surprises, no scope creep, fixed pricing.",
  path: "/process",
  image: "route",
});

export default function ProcessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
