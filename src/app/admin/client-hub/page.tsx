"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Section, Card, StatCard } from "@/components/admin/ui";
import {
  IconFileText,
  IconMail,
  IconClock,
  IconCheckCircle,
  IconChevronRight,
  IconExternal,
} from "@/components/admin/icons";

const STATS = [
  { value: "8", label: "Template Systems", icon: "document" },
  { value: "45+", label: "Email Templates", icon: "mail" },
  { value: "60%", label: "Time Saved", icon: "clock" },
  { value: "100", label: "Point Scoring", icon: "check" },
];

const JOURNEY_STEPS = [
  "Lead Response",
  "Discovery",
  "Qualification",
  "Proposal",
  "Contract",
  "Onboarding",
];

const TEMPLATES = [
  {
    title: "Lead Response Templates",
    subtitle: "12 templates",
    description: "Ready-to-use email templates for responding to hot leads, warm inquiries, and follow-ups.",
    tags: ["Hot Leads", "Warm Leads", "Follow-ups"],
    href: "/client-hub/01-response-templates.html",
    color: "sage",
  },
  {
    title: "Discovery Call Framework",
    subtitle: "60-minute structure",
    description: "Structured discovery call guide with 45+ questions, scripts, and a pre-call checklist.",
    tags: ["Questions", "Scripts", "Checklist"],
    href: "/client-hub/02-discovery-framework.html",
    color: "sage",
  },
  {
    title: "Intake Questionnaire",
    subtitle: "17 questions",
    description: "Comprehensive client intake form covering business context, project scope, and success criteria.",
    tags: ["Business Info", "Project Scope", "Goals"],
    href: "/client-hub/03-intake-questionnaire.html",
    color: "sage",
  },
  {
    title: "Proposal Template",
    subtitle: "7 sections",
    description: "Professional proposal with tiered pricing, timeline visualization, and payment schedules.",
    tags: ["Pricing Tiers", "Timeline", "Scope"],
    href: "/client-hub/04-proposal-template.html",
    color: "green",
  },
  {
    title: "SOW & Contract Templates",
    subtitle: "3 documents",
    description: "Statement of Work, Terms & Conditions, and Change Order templates with legal clauses.",
    tags: ["SOW", "Terms", "Change Orders"],
    href: "/client-hub/05-sow-contract.html",
    color: "green",
  },
  {
    title: "Onboarding Sequence",
    subtitle: "5 emails + checklist",
    description: "Welcome emails, kickoff meeting agenda, and client onboarding checklist.",
    tags: ["Welcome", "Kickoff", "Setup"],
    href: "/client-hub/06-onboarding-sequence.html",
    color: "green",
  },
  {
    title: "Qualification Scorecard",
    subtitle: "100-point system",
    description: "Interactive scoring tool to assess lead quality across budget, timeline, and fit criteria.",
    tags: ["Budget", "Timeline", "Fit"],
    href: "/client-hub/07-qualification-scorecard.html",
    color: "yellow",
  },
  {
    title: "Red Flags & Scripts",
    subtitle: "Warning guide",
    description: "Identify warning signs early and handle difficult situations with proven scripts.",
    tags: ["Red Flags", "Scripts", "Decline"],
    href: "/client-hub/08-red-flags-scripts.html",
    color: "red",
  },
];

function StatIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "document":
      return <IconFileText size={20} />;
    case "mail":
      return <IconMail size={20} />;
    case "clock":
      return <IconClock size={20} />;
    case "check":
      return <IconCheckCircle size={20} />;
    default:
      return null;
  }
}

function getColorClasses(color: string) {
  switch (color) {
    case "sage":
      return {
        bg: "bg-[hsl(var(--color-accent))]/10",
        text: "text-[hsl(var(--color-accent))]",
      };
    case "green":
      return {
        bg: "bg-green-500/10",
        text: "text-green-600",
      };
    case "yellow":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-600",
      };
    case "red":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600",
      };
    default:
      return {
        bg: "bg-[hsl(var(--color-accent))]/10",
        text: "text-[hsl(var(--color-accent))]",
      };
  }
}

export default function ClientHubPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Client Operations Hub"
        subtitle="Templates and tools for client acquisition, qualification, and onboarding"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={<StatIcon icon={stat.icon} />}
          />
        ))}
      </div>

      {/* Client Journey */}
      <Card>
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-5">
          Client Journey
        </h2>
        <div className="grid grid-cols-3 gap-y-5 sm:flex sm:items-center sm:justify-between sm:overflow-x-auto sm:pb-2">
          {JOURNEY_STEPS.map((step, index) => (
            <div key={step} className="flex items-center justify-center sm:justify-start">
              <div className="flex flex-col items-center text-center sm:min-w-[100px]">
                <div className="w-10 h-10 rounded-full border-2 border-[hsl(var(--color-accent))] bg-[hsl(var(--color-background))] flex items-center justify-center text-[hsl(var(--color-accent))] font-semibold text-sm">
                  {index + 1}
                </div>
                <span className="mt-2 text-sm font-medium text-[hsl(var(--color-foreground))]">{step}</span>
              </div>
              {index < JOURNEY_STEPS.length - 1 && (
                <div className="w-8 h-0.5 bg-[hsl(var(--color-border))] mx-2 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Templates Grid */}
      <Section title="Templates & Tools">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((template) => {
            const colors = getColorClasses(template.color);
            return (
              <a
                key={template.title}
                href={template.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl overflow-hidden hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
              >
                <div className="p-5 border-b border-[hsl(var(--color-border))]/30">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
                      <IconFileText size={20} className={colors.text} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors">
                        {template.title}
                      </h3>
                      <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">{template.subtitle}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex-1">
                  <p className="text-sm text-[hsl(var(--color-foreground-muted))] mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))] rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-[hsl(var(--color-border))]/30 flex items-center justify-between">
                  <span className="text-sm font-medium text-[hsl(var(--color-accent))] flex items-center gap-1">
                    View template
                    <IconChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <IconExternal size={16} className="text-[hsl(var(--color-foreground-subtle))]" />
                </div>
              </a>
            );
          })}
        </div>
      </Section>

      {/* Full Hub Link */}
      <div className="text-center">
        <Button asChild variant="ghost" size="sm" className="text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]">
          <a href="/client-hub/index.html" target="_blank" rel="noopener noreferrer">
            <span>Open full Client Hub</span>
            <IconExternal size={16} />
          </a>
        </Button>
      </div>
    </PageContainer>
  );
}
