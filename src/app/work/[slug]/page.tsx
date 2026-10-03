import type { Metadata } from "next";
import { capabilityName } from "@/content/capabilities";
import { notFound } from "next/navigation";
import { caseStudies, getCaseStudy } from "@/content/case-studies";
import { relatedWork } from "@/content/related-work";
import { pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { CaseStudyView } from "./case-study";
import imagePlaceholders from "@/content/image-placeholders.json";

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
    image: "route",
    type: "article",
  });
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();

  const url = `${SITE_URL}/work/${study.slug}`;
  const studio = { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        url,
        name: study.title,
        headline: `${study.title} case study`,
        description: study.description,
        image: `${SITE_URL}${study.heroImage}`,
        dateCreated: String(study.year),
        genre: study.capabilities.map(capabilityName).join(", "),
        keywords: study.services.join(", "),
        about: { "@type": "Organization", name: study.client },
        creator: studio,
        publisher: studio,
        inLanguage: "en-AU",
        ...(study.liveUrl ? { sameAs: study.liveUrl } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Case studies", item: `${SITE_URL}/work` },
          { "@type": "ListItem", position: 3, name: study.title, item: url },
        ],
      },
    ],
  };

  // Blurred previews for this study's images and every study's hero (the
  // "next project" card), so only a few hundred bytes reach the client.
  const blur: Record<string, string> = {};
  const all = imagePlaceholders as Record<string, string>;
  const photos = (study.photoSets ?? []).flatMap((set) => set.images.map((image) => image.src));
  for (const src of [study.heroImage, study.thumbnail, ...study.gallery.map((g) => g.src), ...photos, ...caseStudies.map((c) => c.heroImage)]) {
    if (src && all[src]) blur[src] = all[src];
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <CaseStudyView slug={slug} placeholders={blur} related={relatedWork(slug)} />
    </>
  );
}
