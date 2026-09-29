import { caseStudies, getCaseStudy } from "@/content/case-studies";
import { ogCard } from "@/lib/og/card";

export const alt = "Craefto case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// One card per case study, rendered at build time.
export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  return ogCard({
    eyebrow: study ? `Case study · ${study.category}` : "Case study",
    title: study?.title ?? "Case study",
    description: study?.description,
    image: study?.thumbnail,
    meta: study ? String(study.year) : null,
  });
}
