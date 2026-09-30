import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Capabilities",
  brand: "Craefto Works",
  description:
    "Craefto Works brings brand, digital products, business systems and creative content together: five capabilities, commissioned on their own or combined.",
  path: "/services",
  image: "route",
});

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
