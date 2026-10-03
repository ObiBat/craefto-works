import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Careers",
  brand: "Craefto Works",
  description:
    "Join Craefto Works, a creative & technology studio in Sydney: designers, developers, strategists, filmmakers, photographers and technologists working as one team. Remote first.",
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
