import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  brand: "Craefto Works",
  description:
    "Craefto Works brings brand, digital products, business systems and creative content together: five services, commissioned on their own or combined.",
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
