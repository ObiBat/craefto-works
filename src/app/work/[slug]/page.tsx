import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseStudies, getCaseStudy } from "@/content/case-studies";
import { pageMetadata } from "@/lib/seo";
import { CaseStudyView } from "./case-study";

// Every case study is known at build time: prerender them all, 404 the rest.
export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};
  return pageMetadata({
    title: `${study.title} case study`,
    description: study.description,
    path: `/work/${study.slug}`,
    image: { url: study.thumbnail, alt: `${study.title}, ${study.industry}` },
    type: "article",
  });
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getCaseStudy(slug)) notFound();
  return <CaseStudyView slug={slug} />;
}
