import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { PageTransition } from "@/components/ui";
import { StudioCta } from "@/components/sections/studio-cta";
import { freeResources, getFreeResource } from "@/content/free-packs";
import { pageMetadata } from "@/lib/seo";
import { DownloadPackView } from "./download-pack-view";
import { LinkListView } from "./link-list-view";

// One page per free resource from the Instagram campaign: a pack of our own
// files, or a curated list with our notes. Data: content/free-packs.ts.

export function generateStaticParams() {
  return freeResources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = getFreeResource(slug);
  if (!resource) return {};
  return pageMetadata({
    title: resource.type === "download" ? `${resource.kind}: ${resource.title}` : resource.title.replace(/\.$/, ""),
    brand: "Craefto Works",
    description: `${resource.issue}. ${resource.lead}`,
    path: `/free/${resource.slug}`,
    image: { url: resource.og.src, width: 1200, height: 630, alt: resource.og.alt },
  });
}

export default async function FreeResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = getFreeResource(slug);
  if (!resource) notFound();

  return (
    <>
      <Header />
      <PageTransition>
        <main id="main-content" className="pt-20">
          {resource.type === "download" ? <DownloadPackView pack={resource} /> : <LinkListView list={resource} />}
          <StudioCta
            eyebrow="Made by Craefto"
            title={resource.type === "download" ? "Your brand deserves visuals nobody else has." : "Want this kind of care on your brand?"}
            text="We're a design and technology studio in Sydney. We make brand identities, websites and the systems behind them. If this is your taste, you'll like the rest of our work."
            secondary={{ href: "/work", label: "See our work" }}
          />
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
