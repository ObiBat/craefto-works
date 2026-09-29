import { getAllRoleSlugs, getRoleBySlug } from "@/lib/careers";
import { ogCard } from "@/lib/og/card";

export const alt = "Open role at Craefto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllRoleSlugs().map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = getRoleBySlug(slug);
  return ogCard({
    eyebrow: role ? `Careers · ${role.department}` : "Careers",
    title: role?.title ?? "Join Craefto",
    description: role?.description,
    meta: role ? `${role.location} · ${role.type}` : null,
  });
}
