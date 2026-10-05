"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { IconChevronRight, IconTarget } from "@/components/admin/icons";
import {
  EmptyState,
  FilterBar,
  FilterChip,
  PageContainer,
  PageHeader,
  SearchInput,
} from "@/components/admin/ui";
import { LEAD_SOURCES, enquiryLabel } from "@/lib/enquiry";
import { StageDot, StageSelect, saveStage, when, type Stage } from "./shared";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  source: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  score: number;
  created_at: string;
  stage: Stage | null;
}

type Filter = "open" | "all" | string;

/** Won and Lost are settled; everything before them is still open. */
const isSettled = (lead: Lead) =>
  lead.stage?.slug === "won" || lead.stage?.slug === "lost";

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[] | null>(null);
  const [stages, setStages] = React.useState<Stage[]>([]);
  const [failed, setFailed] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("open");
  const [source, setSource] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    Promise.all([
      fetch("/api/admin/leads", { cache: "no-store" }),
      fetch("/api/admin/stages", { cache: "no-store" }),
    ])
      .then(async ([leadsRes, stagesRes]) => {
        if (!leadsRes.ok || !stagesRes.ok) throw new Error("Leads didn't load");
        const [leadsData, stagesData] = await Promise.all([
          leadsRes.json(),
          stagesRes.json(),
        ]);
        setLeads(leadsData.leads ?? []);
        setStages(stagesData.stages ?? []);
      })
      .catch(() => setFailed(true));
  }, []);

  const shown = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return (leads ?? []).filter((lead) => {
      if (filter === "open" && isSettled(lead)) return false;
      if (filter !== "open" && filter !== "all" && lead.stage?.id !== filter)
        return false;
      if (source !== "all" && lead.source !== source) return false;
      return (
        !query ||
        [lead.name, lead.email, lead.company]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [leads, filter, source, search]);

  async function moveLead(leadId: string, stageId: string) {
    const stage = stages.find((entry) => entry.id === stageId) ?? null;
    const before = leads;
    setLeads(
      (current) =>
        current?.map((lead) =>
          lead.id === leadId ? { ...lead, stage } : lead,
        ) ?? null,
    );
    if (!(await saveStage(leadId, stageId))) setLeads(before);
  }

  if (failed)
    return (
      <EmptyState
        title="Leads didn't load"
        description="Refresh the page to try again."
      />
    );
  if (!leads) return <AdminLoader message="Loading leads..." />;

  const open = leads.filter((lead) => !isSettled(lead)).length;
  const sources = [
    ...new Set(
      leads
        .map((lead) => lead.source)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const countIn = (stageId: string) =>
    leads.filter((lead) => lead.stage?.id === stageId).length;

  return (
    <PageContainer>
      <PageHeader
        title="Leads"
        subtitle={`Enquiries from the website form, Ask Craefto, Cal.com bookings and outreach replies. ${open} open of ${leads.length}.`}
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, email or company"
            label="Search leads"
            className="md:w-72"
          />
          {sources.length > 1 && (
            <select
              aria-label="Where they came from"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-muted))] px-3 py-2.5 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40"
            >
              <option value="all">From anywhere</option>
              {sources.map((value) => (
                <option key={value} value={value}>
                  {LEAD_SOURCES[value] ?? value}
                </option>
              ))}
            </select>
          )}
        </div>
        <FilterBar>
          <FilterChip
            active={filter === "open"}
            onClick={() => setFilter("open")}
          >
            Open{" "}
            <span className="ml-1 font-mono text-xs opacity-70">{open}</span>
          </FilterChip>
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All{" "}
            <span className="ml-1 font-mono text-xs opacity-70">
              {leads.length}
            </span>
          </FilterChip>
          {/* A chip for each stage that has leads in it. */}
          {stages
            .filter((stage) => countIn(stage.id) > 0 || filter === stage.id)
            .map((stage) => (
              <FilterChip
                key={stage.id}
                active={filter === stage.id}
                onClick={() => setFilter(stage.id)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <StageDot color={stage.color} />
                  {stage.name}
                  <span className="font-mono text-xs opacity-70">
                    {countIn(stage.id)}
                  </span>
                </span>
              </FilterChip>
            ))}
        </FilterBar>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconTarget size={40} />}
          title={leads.length ? "No leads match" : "No leads yet"}
          description={
            leads.length
              ? "Try another stage or clear the search."
              : "Enquiries from the website form, Ask Craefto, Cal.com bookings and outreach replies land here, and on Today."
          }
        />
      ) : (
        <ul className="divide-y divide-[hsl(var(--color-border))]/50 overflow-hidden rounded-2xl border border-[hsl(var(--color-border))]/50 bg-[hsl(var(--color-background-subtle))]/50">
          {shown.map((lead) => (
            <li
              key={lead.id}
              className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-[hsl(var(--color-background-muted))]/30 md:flex-row md:items-center md:gap-6 md:px-5"
            >
              <Link
                href={`/admin/leads/${lead.id}`}
                className="group flex min-w-0 flex-1 items-center gap-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[hsl(var(--color-accent-subtle))] font-medium text-[hsl(var(--color-accent))]">
                  {lead.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))]">
                    {lead.name}
                    {lead.company && (
                      <span className="font-normal text-[hsl(var(--color-foreground-muted))]">
                        {" "}
                        · {lead.company}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-sm text-[hsl(var(--color-foreground-subtle))]">
                    {[
                      LEAD_SOURCES[lead.source ?? ""] ?? "Enquiry",
                      enquiryLabel(lead.service_interest),
                      enquiryLabel(lead.budget_range),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </Link>
              <div className="flex items-center justify-between gap-4 pl-14 md:pl-0">
                <span className="text-sm tabular-nums text-[hsl(var(--color-foreground-subtle))]">
                  {when(lead.created_at)}
                </span>
                <StageSelect
                  stages={stages}
                  value={lead.stage?.id ?? null}
                  onChange={(stageId) => moveLead(lead.id, stageId)}
                  label={`Stage for ${lead.name}`}
                />
                <Link
                  href={`/admin/leads/${lead.id}`}
                  aria-label={`Open ${lead.name}`}
                  className="hidden text-[hsl(var(--color-foreground-subtle))] hover:text-[hsl(var(--color-foreground))] md:block"
                >
                  <IconChevronRight size={16} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
