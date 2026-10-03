"use client";

import { useQueryChoice } from "@/hooks/use-query-choice";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { ProjectImagePlaceholder } from "@/components/ui";
import { capabilities, capabilityName, type CapabilityId } from "@/content/capabilities";
import { cn } from "@/lib/utils";

export interface WorkCard {
  slug: string;
  title: string;
  description: string;
  industry: string;
  year: number;
  thumbnail: string;
  accentColor?: string;
  capabilities: CapabilityId[];
  engagement: "project" | "ongoing";
}

type Filter = CapabilityId | "ongoing" | "all";

/**
 * Case studies, filterable by capability. A study can sit under several. An
 * "Ongoing" filter appears once a case study comes from a monthly plan, and
 * the choice is kept in the address (?capability=media).
 */
export function WorkGrid({ studies }: { studies: WorkCard[] }) {
  const hasOngoing = studies.some((study) => study.engagement === "ongoing");
  const filters: { id: Filter; label: string; number?: string; count: number }[] = [
    { id: "all", label: "All work", count: studies.length },
    ...capabilities.map((capability) => ({
      id: capability.id as Filter,
      label: capability.name,
      number: capability.number,
      count: studies.filter((study) => study.capabilities.includes(capability.id)).length,
    })),
    ...(hasOngoing ? [{ id: "ongoing" as Filter, label: "Ongoing", count: studies.filter((study) => study.engagement === "ongoing").length }] : []),
  ];

  const [filter, choose] = useQueryChoice<Filter>("capability", filters.map((entry) => entry.id), "all");

  const shown = studies.filter((study) =>
    filter === "all" ? true : filter === "ongoing" ? study.engagement === "ongoing" : study.capabilities.includes(filter),
  );
  const active = capabilities.find((capability) => capability.id === filter);

  return (
    <>
      <div className="flex flex-col gap-5">
        <div role="radiogroup" aria-label="Filter case studies" className="flex flex-wrap gap-2">
          {filters.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={filter === entry.id}
              onClick={() => choose(entry.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                filter === entry.id
                  ? "bg-[hsl(var(--color-accent))] text-white"
                  : "bg-[hsl(var(--color-background-subtle))] text-[hsl(var(--color-foreground-muted))] hover:bg-[hsl(var(--color-accent-subtle))] hover:text-[hsl(var(--color-accent))]",
              )}
            >
              {entry.number && (
                <span className={cn("font-mono text-xs tabular-nums", filter === entry.id ? "text-white/70" : "text-[hsl(var(--color-accent))]")}>
                  {entry.number}
                </span>
              )}
              {entry.label}
              <span className={cn("tabular-nums", filter === entry.id ? "text-white/70" : "text-[hsl(var(--color-foreground-subtle))]")}>{entry.count}</span>
            </button>
          ))}
        </div>
        <p className="min-h-[1.75rem] text-[hsl(var(--color-foreground-muted))]" aria-live="polite">
          {active ? active.scope : filter === "ongoing" ? "Ongoing work under a monthly plan." : "Every case study, across all five capabilities."}
        </p>
      </div>

      {shown.length > 0 ? (
        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {shown.map((study, index) => (
            <li key={study.slug}>
              <Link href={`/work/${study.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                  <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                    {study.thumbnail ? (
                      <Image
                        src={study.thumbnail}
                        alt={`${study.title} case study`}
                        fill
                        priority={index < 2}
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <ProjectImagePlaceholder projectName={study.title} imageType="thumb" accentColor={study.accentColor} />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {study.capabilities.map((id) => (
                        <span key={id} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                          {capabilityName(id)}
                        </span>
                      ))}
                      <span className="ml-1 text-sm text-white/60 tabular-nums">{study.year}</span>
                    </div>
                    <p className="relative mb-2 inline-block text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "#ffffff" }}>
                      {study.title}
                    </p>
                    <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/70 sm:text-base">{study.description}</p>
                    <p className="font-mono text-xs uppercase tracking-[0.06em] text-white/50">{study.industry}</p>
                    <span className="absolute top-6 right-6 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 max-w-xl text-lg leading-relaxed text-[hsl(var(--color-foreground-muted))]">
          No case studies here yet. We&apos;re writing up recent work, and it will appear here when it&apos;s ready.
        </p>
      )}
    </>
  );
}
