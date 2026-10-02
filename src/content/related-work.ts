import { capabilities } from "@/content/capabilities";
import { caseStudies, type CaseStudy } from "@/content/case-studies";

// The "next case study" at the foot of each case study: the others, ranked by
// how closely they relate to it, with ties going to more recent work.
// Relevance comes from what the site already says about each study: the
// capabilities that list it as their work, its services, sector and category,
// and whether it's client work or one of our own products. The page shows the
// first one the visitor hasn't opened yet this session (see case-study.tsx).

export interface RelatedWork {
  slug: string;
  /** Why it comes next, shown after "Next case study". */
  reason?: string;
}

// Sectors that read as one across the case studies' industry labels.
const SECTORS: Record<string, { label: string; words: string[] }> = {
  property: { label: "property", words: ["property", "proptech", "real estate"] },
  finance: { label: "fintech", words: ["fintech", "finance", "trading"] },
  education: { label: "education", words: ["edtech", "education"] },
  industry: { label: "industrial", words: ["industrial", "manufacturing", "mining", "construction"] },
};

const sectorsOf = (study: CaseStudy) =>
  Object.keys(SECTORS).filter((key) => SECTORS[key].words.some((word) => study.industry.toLowerCase().includes(word)));
const capabilitiesOf = (study: CaseStudy) =>
  capabilities.filter((capability) => capability.work.some((work) => work.slug === study.slug)).map((capability) => capability.name);
const isOwnProduct = (study: CaseStudy) => /^internal/i.test(study.client);
/** "a, b and c" */
const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : (items[0] ?? ""));

/** Every other case study, most related first. */
export function relatedWork(slug: string): RelatedWork[] {
  const current = caseStudies.find((study) => study.slug === slug);
  if (!current) return [];
  // caseStudies runs newest first.
  const latestYear = Math.max(...caseStudies.map((study) => study.year));
  const services = new Set(current.services);
  const ownCapabilities = capabilitiesOf(current);
  const ownSectors = sectorsOf(current);

  return caseStudies
    .flatMap((study, index) => {
      if (study.slug === slug) return [];
      const sharedCapabilities = capabilitiesOf(study).filter((name) => ownCapabilities.includes(name));
      const sharedSector = sectorsOf(study).find((key) => ownSectors.includes(key));
      const sameCategory = study.category === current.category;
      const overlap = study.services.filter((service) => services.has(service)).length;
      const servicesShared = overlap / (services.size + study.services.length - overlap);
      const recency = (study.year === latestYear ? 0.8 : 0) + (0.6 * (caseStudies.length - index)) / caseStudies.length;
      const score =
        3 * sharedCapabilities.length +
        4 * servicesShared +
        (sharedSector ? 2 : 0) +
        (sameCategory ? 1.5 : 0) +
        (isOwnProduct(study) === isOwnProduct(current) ? 1.5 : 0) +
        recency;
      const reason = sharedCapabilities.length
        ? `More ${list(sharedCapabilities)} work`
        : sharedSector
          ? `More ${SECTORS[sharedSector].label} work`
          : sameCategory
            ? `More ${study.category === "SaaS" ? "SaaS" : study.category.toLowerCase()} work`
            : study.year === latestYear
              ? "Recent work"
              : undefined;
      return [{ slug: study.slug, reason, score, index }];
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ slug: next, reason }) => ({ slug: next, reason }));
}
