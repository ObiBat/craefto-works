"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card } from "@/components/admin/ui";
import { IconChevronLeft, IconX } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  document_number: string;
  document_type: "proposal" | "sow" | "invoice" | "change_order";
  title: string;
  status: string;
  content_json: Record<string, unknown>;
  lead: { id: string; name: string; email: string; company: string | null } | null;
}

// Human-readable labels for content keys
const KEY_LABELS: Record<string, string> = {
  projectName: "Project Name",
  clientCompany: "Client Company",
  clientName: "Client Name",
  clientEmail: "Client Email",
  clientAddress: "Client Address",
  clientABN: "Client ABN",
  date: "Date",
  validUntil: "Valid Until",
  effectiveDate: "Effective Date",
  estimatedCompletion: "Estimated Completion",
  executiveSummary: "Executive Summary",
  understanding: "Our Understanding",
  problemStatement: "Problem Statement",
  successDefinition: "Success Definition",
  approach: "Our Approach",
  projectOverview: "Project Overview",
  projectDuration: "Project Duration",
  sowNumber: "SOW Number",
  selectedTier: "Selected Tier",
  totalInvestment: "Total Investment",
  revisionRounds: "Revision Rounds",
  feedbackDays: "Feedback Days",
  extraRevisionRate: "Extra Revision Rate",
  primaryContact: "Primary Contact",
  contentDeliveryDays: "Content Delivery Days",
  invoiceNumber: "Invoice Number",
  issueDate: "Issue Date",
  dueDate: "Due Date",
  paymentTerms: "Payment Terms",
  providerCompany: "Provider Company",
  providerAddress: "Provider Address",
  providerABN: "Provider ABN",
  subtotal: "Subtotal",
  taxRate: "Tax Rate (%)",
  taxAmount: "Tax Amount",
  total: "Total",
  currency: "Currency",
  milestoneDescription: "Milestone Description",
  notes: "Notes",
  paymentInstructions: "Payment Instructions",
  changeOrderNumber: "Change Order Number",
  description: "Description",
  requestedBy: "Requested By",
  requestDate: "Request Date",
  requestMethod: "Request Method",
  scopeImpact: "Scope Impact",
  timelineImpact: "Timeline Impact",
  budgetImpact: "Budget Impact",
  newTimeline: "New Timeline",
  newCompletionDate: "New Completion Date",
};

// Fields that should use textarea
const TEXTAREA_KEYS = new Set([
  "executiveSummary", "understanding", "approach", "problemStatement",
  "successDefinition", "projectOverview", "description", "scopeImpact",
  "notes", "paymentInstructions", "paymentTerms",
]);

// Fields that are currency
const CURRENCY_KEYS = new Set([
  "totalInvestment", "budgetImpact", "subtotal", "taxAmount", "total",
  "extraRevisionRate",
]);

// Fields that are dates
const DATE_KEYS = new Set([
  "date", "validUntil", "effectiveDate", "estimatedCompletion",
  "issueDate", "dueDate", "requestDate", "newCompletionDate",
]);

// Fields that are numbers
const NUMBER_KEYS = new Set([
  "revisionRounds", "feedbackDays", "contentDeliveryDays", "taxRate",
]);

// Section ordering for known fields
const SECTION_MAP: Record<string, string> = {
  projectName: "Basic Info",
  clientCompany: "Basic Info",
  clientName: "Basic Info",
  clientEmail: "Basic Info",
  clientAddress: "Basic Info",
  clientABN: "Basic Info",
  date: "Basic Info",
  validUntil: "Basic Info",
  effectiveDate: "Basic Info",
  estimatedCompletion: "Basic Info",
  projectDuration: "Basic Info",
  sowNumber: "Basic Info",
  invoiceNumber: "Basic Info",
  issueDate: "Basic Info",
  dueDate: "Basic Info",
  changeOrderNumber: "Basic Info",
  executiveSummary: "Content",
  understanding: "Content",
  problemStatement: "Content",
  successDefinition: "Content",
  approach: "Content",
  projectOverview: "Content",
  description: "Content",
  selectedTier: "Pricing",
  totalInvestment: "Pricing",
  subtotal: "Pricing",
  taxRate: "Pricing",
  taxAmount: "Pricing",
  total: "Pricing",
  currency: "Pricing",
  budgetImpact: "Pricing",
  paymentTerms: "Payment",
  notes: "Notes",
  paymentInstructions: "Payment",
  providerCompany: "Provider Info",
  providerAddress: "Provider Info",
  providerABN: "Provider Info",
  revisionRounds: "Terms",
  feedbackDays: "Terms",
  extraRevisionRate: "Terms",
  primaryContact: "Terms",
  contentDeliveryDays: "Terms",
  requestedBy: "Change Details",
  requestDate: "Change Details",
  requestMethod: "Change Details",
  scopeImpact: "Impact",
  timelineImpact: "Impact",
  newTimeline: "Impact",
  newCompletionDate: "Impact",
  milestoneDescription: "Reference",
};

function getLabel(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  // Convert camelCase to Title Case
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}

function getFieldType(key: string): "textarea" | "currency" | "date" | "number" | "text" {
  if (TEXTAREA_KEYS.has(key)) return "textarea";
  if (CURRENCY_KEYS.has(key)) return "currency";
  if (DATE_KEYS.has(key)) return "date";
  if (NUMBER_KEYS.has(key)) return "number";
  return "text";
}

// ============================================
// SHARED STYLES
// ============================================

const CARD_TITLE_CLASS =
  "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";
const SUBSECTION_TITLE_CLASS = "text-base font-semibold text-[hsl(var(--color-foreground))] mb-3";
const LABEL_CLASS = "block text-sm font-medium text-[hsl(var(--color-foreground-muted))]";
const SMALL_LABEL_CLASS = "text-xs text-[hsl(var(--color-foreground-muted))]";
const ITEM_TITLE_CLASS = "text-xs font-medium text-[hsl(var(--color-foreground-muted))]";
const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40";
// Denser variant for the nested list editors
const COMPACT_INPUT_CLASS =
  "w-full min-w-0 px-3 py-2 rounded-lg bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40";
const ITEM_PANEL_CLASS = "rounded-xl bg-[hsl(var(--color-background-muted))]/40 p-4 space-y-2";
const CHECKBOX_CLASS = "rounded border-[hsl(var(--color-border))] accent-[hsl(var(--color-accent))]";
const REMOVE_BUTTON_CLASS = "h-8 w-8 shrink-0 text-red-500 hover:bg-red-500/10";
const REMOVE_TEXT_BUTTON_CLASS = "h-7 w-7 shrink-0 text-base text-red-400 hover:text-red-600 hover:bg-red-500/10";
const ADD_BUTTON_CLASS = "h-8 px-3 -ml-3 text-sm text-[hsl(var(--color-accent))]";
const ADD_SMALL_BUTTON_CLASS = "h-7 px-2.5 -ml-2.5 text-xs text-[hsl(var(--color-accent))]";

// ============================================
// ARRAY EDITORS
// ============================================

function StringArrayEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <label className={LABEL_CLASS}>{label}</label>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const updated = [...items];
              updated[index] = e.target.value;
              onChange(updated);
            }}
            aria-label={`${label} ${index + 1}`}
            className={cn(COMPACT_INPUT_CLASS, "flex-1")}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className={REMOVE_BUTTON_CLASS}
            title="Remove"
            aria-label={`Remove ${label} ${index + 1}`}
          >
            <IconX size={16} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onChange([...items, ""])} className={ADD_BUTTON_CLASS}>
        + Add item
      </Button>
    </div>
  );
}

function TimelineEditor({
  phases,
  onChange,
}: {
  phases: Array<{ name: string; duration: string; color: string; description?: string }>;
  onChange: (phases: Array<{ name: string; duration: string; color: string; description?: string }>) => void;
}) {
  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Timeline Phases</label>
      {phases.map((phase, index) => (
        <div key={index} className={ITEM_PANEL_CLASS}>
          <div className="flex justify-between items-center">
            <span className={ITEM_TITLE_CLASS}>Phase {index + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(phases.filter((_, i) => i !== index))}
              className={REMOVE_BUTTON_CLASS}
              aria-label={`Remove phase ${index + 1}`}
            >
              <IconX size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={phase.name}
              onChange={(e) => {
                const updated = [...phases];
                updated[index] = { ...phase, name: e.target.value };
                onChange(updated);
              }}
              placeholder="Phase name"
              aria-label={`Phase ${index + 1} name`}
              className={COMPACT_INPUT_CLASS}
            />
            <input
              type="text"
              value={phase.duration}
              onChange={(e) => {
                const updated = [...phases];
                updated[index] = { ...phase, duration: e.target.value };
                onChange(updated);
              }}
              placeholder="Duration (e.g., 2 weeks)"
              aria-label={`Phase ${index + 1} duration`}
              className={COMPACT_INPUT_CLASS}
            />
          </div>
          <textarea
            value={phase.description || ""}
            onChange={(e) => {
              const updated = [...phases];
              updated[index] = { ...phase, description: e.target.value };
              onChange(updated);
            }}
            placeholder="Description"
            rows={2}
            aria-label={`Phase ${index + 1} description`}
            className={cn(COMPACT_INPUT_CLASS, "resize-none")}
          />
          <div className="flex items-center gap-2">
            <label className={SMALL_LABEL_CLASS}>Color:</label>
            <input
              type="color"
              value={phase.color}
              onChange={(e) => {
                const updated = [...phases];
                updated[index] = { ...phase, color: e.target.value };
                onChange(updated);
              }}
              aria-label={`Phase ${index + 1} color`}
              className="w-8 h-6 rounded border border-[hsl(var(--color-border))] cursor-pointer"
            />
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange([...phases, { name: "", duration: "", color: "#3B82F6", description: "" }])}
        className={ADD_BUTTON_CLASS}
      >
        + Add phase
      </Button>
    </div>
  );
}

function ScopeEditor({
  items,
  onChange,
}: {
  items: Array<{ deliverable: string; description: string; included: boolean }>;
  onChange: (items: Array<{ deliverable: string; description: string; included: boolean }>) => void;
}) {
  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Scope & Deliverables</label>
      {items.map((item, index) => (
        <div key={index} className={ITEM_PANEL_CLASS}>
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.included}
                onChange={(e) => {
                  const updated = [...items];
                  updated[index] = { ...item, included: e.target.checked };
                  onChange(updated);
                }}
                className={CHECKBOX_CLASS}
              />
              <span className={ITEM_TITLE_CLASS}>Included</span>
            </label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className={REMOVE_BUTTON_CLASS}
              aria-label={`Remove deliverable ${index + 1}`}
            >
              <IconX size={12} />
            </Button>
          </div>
          <input
            type="text"
            value={item.deliverable}
            onChange={(e) => {
              const updated = [...items];
              updated[index] = { ...item, deliverable: e.target.value };
              onChange(updated);
            }}
            placeholder="Deliverable name"
            aria-label={`Deliverable ${index + 1} name`}
            className={COMPACT_INPUT_CLASS}
          />
          <input
            type="text"
            value={item.description}
            onChange={(e) => {
              const updated = [...items];
              updated[index] = { ...item, description: e.target.value };
              onChange(updated);
            }}
            placeholder="Description"
            aria-label={`Deliverable ${index + 1} description`}
            className={COMPACT_INPUT_CLASS}
          />
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange([...items, { deliverable: "", description: "", included: true }])}
        className={ADD_BUTTON_CLASS}
      >
        + Add deliverable
      </Button>
    </div>
  );
}

function PricingTiersEditor({
  tiers,
  onChange,
}: {
  tiers: Array<{ name: string; price: number; duration: string; features: string[]; recommended: boolean }>;
  onChange: (tiers: Array<{ name: string; price: number; duration: string; features: string[]; recommended: boolean }>) => void;
}) {
  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Pricing Tiers</label>
      {tiers.map((tier, index) => (
        <div
          key={index}
          className={cn(
            "rounded-xl p-4 space-y-2",
            tier.recommended
              ? "bg-[hsl(var(--color-accent))]/5 ring-1 ring-[hsl(var(--color-accent))]/30"
              : "bg-[hsl(var(--color-background-muted))]/40"
          )}
        >
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tier.recommended}
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index] = { ...tier, recommended: e.target.checked };
                  onChange(updated);
                }}
                className={CHECKBOX_CLASS}
              />
              <span className={ITEM_TITLE_CLASS}>Recommended</span>
            </label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(tiers.filter((_, i) => i !== index))}
              className={REMOVE_BUTTON_CLASS}
              aria-label={`Remove tier ${index + 1}`}
            >
              <IconX size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={tier.name}
              onChange={(e) => {
                const updated = [...tiers];
                updated[index] = { ...tier, name: e.target.value };
                onChange(updated);
              }}
              placeholder="Tier name"
              aria-label={`Tier ${index + 1} name`}
              className={COMPACT_INPUT_CLASS}
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-foreground-muted))] text-sm">$</span>
              <input
                type="number"
                value={tier.price}
                onChange={(e) => {
                  const updated = [...tiers];
                  updated[index] = { ...tier, price: parseFloat(e.target.value) || 0 };
                  onChange(updated);
                }}
                aria-label={`Tier ${index + 1} price`}
                className={cn(COMPACT_INPUT_CLASS, "pl-7")}
              />
            </div>
            <input
              type="text"
              value={tier.duration}
              onChange={(e) => {
                const updated = [...tiers];
                updated[index] = { ...tier, duration: e.target.value };
                onChange(updated);
              }}
              placeholder="Duration"
              aria-label={`Tier ${index + 1} duration`}
              className={COMPACT_INPUT_CLASS}
            />
          </div>
          <div className="space-y-1">
            <span className={SMALL_LABEL_CLASS}>Features:</span>
            {tier.features.map((feature, fi) => (
              <div key={fi} className="flex items-center gap-1">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => {
                    const updated = [...tiers];
                    const features = [...tier.features];
                    features[fi] = e.target.value;
                    updated[index] = { ...tier, features };
                    onChange(updated);
                  }}
                  aria-label={`Tier ${index + 1} feature ${fi + 1}`}
                  className={cn(COMPACT_INPUT_CLASS, "flex-1 py-1.5 text-xs")}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const updated = [...tiers];
                    updated[index] = { ...tier, features: tier.features.filter((_, i) => i !== fi) };
                    onChange(updated);
                  }}
                  className={REMOVE_TEXT_BUTTON_CLASS}
                  aria-label={`Remove feature ${fi + 1}`}
                >
                  &times;
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const updated = [...tiers];
                updated[index] = { ...tier, features: [...tier.features, ""] };
                onChange(updated);
              }}
              className={ADD_SMALL_BUTTON_CLASS}
            >
              + Add feature
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange([...tiers, { name: "", price: 0, duration: "", features: [""], recommended: false }])}
        className={ADD_BUTTON_CLASS}
      >
        + Add tier
      </Button>
    </div>
  );
}

function PaymentScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: Array<{ description: string; percentage: number; amount: number; dueOn?: string }>;
  onChange: (schedule: Array<{ description: string; percentage: number; amount: number; dueOn?: string }>) => void;
}) {
  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Payment Schedule</label>
      {schedule.map((item, index) => (
        <div key={index} className={ITEM_PANEL_CLASS}>
          <div className="flex justify-between items-center">
            <span className={ITEM_TITLE_CLASS}>Milestone {index + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(schedule.filter((_, i) => i !== index))}
              className={REMOVE_BUTTON_CLASS}
              aria-label={`Remove milestone ${index + 1}`}
            >
              <IconX size={12} />
            </Button>
          </div>
          <input
            type="text"
            value={item.description}
            onChange={(e) => {
              const updated = [...schedule];
              updated[index] = { ...item, description: e.target.value };
              onChange(updated);
            }}
            placeholder="Description (e.g., Project Kickoff)"
            aria-label={`Milestone ${index + 1} description`}
            className={COMPACT_INPUT_CLASS}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className={SMALL_LABEL_CLASS}>Percentage</label>
              <div className="relative">
                <input
                  type="number"
                  value={item.percentage}
                  onChange={(e) => {
                    const updated = [...schedule];
                    updated[index] = { ...item, percentage: parseFloat(e.target.value) || 0 };
                    onChange(updated);
                  }}
                  aria-label={`Milestone ${index + 1} percentage`}
                  className={cn(COMPACT_INPUT_CLASS, "pr-7")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--color-foreground-muted))]">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className={SMALL_LABEL_CLASS}>Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--color-foreground-muted))]">$</span>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => {
                    const updated = [...schedule];
                    updated[index] = { ...item, amount: parseFloat(e.target.value) || 0 };
                    onChange(updated);
                  }}
                  aria-label={`Milestone ${index + 1} amount`}
                  className={cn(COMPACT_INPUT_CLASS, "pl-6")}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={SMALL_LABEL_CLASS}>Due On</label>
              <input
                type="text"
                value={item.dueOn || ""}
                onChange={(e) => {
                  const updated = [...schedule];
                  updated[index] = { ...item, dueOn: e.target.value };
                  onChange(updated);
                }}
                placeholder="e.g., signing"
                aria-label={`Milestone ${index + 1} due on`}
                className={COMPACT_INPUT_CLASS}
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange([...schedule, { description: "", percentage: 0, amount: 0, dueOn: "" }])}
        className={ADD_BUTTON_CLASS}
      >
        + Add milestone
      </Button>
    </div>
  );
}

function SOWPhasesEditor({
  phases,
  onChange,
}: {
  phases: Array<{ name: string; number: number; deliverables: string[]; duration?: string }>;
  onChange: (phases: Array<{ name: string; number: number; deliverables: string[]; duration?: string }>) => void;
}) {
  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Project Phases</label>
      {phases.map((phase, index) => (
        <div key={index} className={ITEM_PANEL_CLASS}>
          <div className="flex justify-between items-center">
            <span className={ITEM_TITLE_CLASS}>Phase {phase.number}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(phases.filter((_, i) => i !== index))}
              className={REMOVE_BUTTON_CLASS}
              aria-label={`Remove phase ${phase.number}`}
            >
              <IconX size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={phase.name}
              onChange={(e) => {
                const updated = [...phases];
                updated[index] = { ...phase, name: e.target.value };
                onChange(updated);
              }}
              placeholder="Phase name"
              aria-label={`Phase ${phase.number} name`}
              className={COMPACT_INPUT_CLASS}
            />
            <input
              type="text"
              value={phase.duration || ""}
              onChange={(e) => {
                const updated = [...phases];
                updated[index] = { ...phase, duration: e.target.value };
                onChange(updated);
              }}
              placeholder="Duration"
              aria-label={`Phase ${phase.number} duration`}
              className={COMPACT_INPUT_CLASS}
            />
          </div>
          <div className="space-y-1">
            <span className={SMALL_LABEL_CLASS}>Deliverables:</span>
            {phase.deliverables.map((d, di) => (
              <div key={di} className="flex items-center gap-1">
                <input
                  type="text"
                  value={d}
                  onChange={(e) => {
                    const updated = [...phases];
                    const deliverables = [...phase.deliverables];
                    deliverables[di] = e.target.value;
                    updated[index] = { ...phase, deliverables };
                    onChange(updated);
                  }}
                  aria-label={`Phase ${phase.number} deliverable ${di + 1}`}
                  className={cn(COMPACT_INPUT_CLASS, "flex-1 py-1.5 text-xs")}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const updated = [...phases];
                    updated[index] = { ...phase, deliverables: phase.deliverables.filter((_, i) => i !== di) };
                    onChange(updated);
                  }}
                  className={REMOVE_TEXT_BUTTON_CLASS}
                  aria-label={`Remove deliverable ${di + 1}`}
                >
                  &times;
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const updated = [...phases];
                updated[index] = { ...phase, deliverables: [...phase.deliverables, ""] };
                onChange(updated);
              }}
              className={ADD_SMALL_BUTTON_CLASS}
            >
              + Add deliverable
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange([...phases, { name: "", number: phases.length + 1, deliverables: [""], duration: "" }])}
        className={ADD_BUTTON_CLASS}
      >
        + Add phase
      </Button>
    </div>
  );
}

function LineItemsEditor({
  items,
  onChange,
}: {
  items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
  onChange: (items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>) => void;
}) {
  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Line Items</label>
      {items.map((item, index) => (
        <div key={index} className={ITEM_PANEL_CLASS}>
          <div className="flex justify-between items-center">
            <span className={ITEM_TITLE_CLASS}>Item {index + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className={REMOVE_BUTTON_CLASS}
              aria-label={`Remove item ${index + 1}`}
            >
              <IconX size={12} />
            </Button>
          </div>
          <input
            type="text"
            value={item.description}
            onChange={(e) => {
              const updated = [...items];
              updated[index] = { ...item, description: e.target.value };
              onChange(updated);
            }}
            placeholder="Description"
            aria-label={`Item ${index + 1} description`}
            className={COMPACT_INPUT_CLASS}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className={SMALL_LABEL_CLASS}>Qty</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const qty = parseFloat(e.target.value) || 0;
                  const updated = [...items];
                  updated[index] = { ...item, quantity: qty, amount: qty * item.unitPrice };
                  onChange(updated);
                }}
                aria-label={`Item ${index + 1} quantity`}
                className={COMPACT_INPUT_CLASS}
              />
            </div>
            <div className="space-y-1">
              <label className={SMALL_LABEL_CLASS}>Unit Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--color-foreground-muted))]">$</span>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    const updated = [...items];
                    updated[index] = { ...item, unitPrice: price, amount: item.quantity * price };
                    onChange(updated);
                  }}
                  aria-label={`Item ${index + 1} unit price`}
                  className={cn(COMPACT_INPUT_CLASS, "pl-6")}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={SMALL_LABEL_CLASS}>Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--color-foreground-muted))]">$</span>
                <input
                  type="number"
                  value={item.amount}
                  readOnly
                  aria-label={`Item ${index + 1} amount`}
                  className={cn(
                    COMPACT_INPUT_CLASS,
                    "pl-6 bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]"
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange([...items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }])}
        className={ADD_BUTTON_CLASS}
      >
        + Add line item
      </Button>
    </div>
  );
}

function CaseStudiesEditor({
  studies,
  onChange,
}: {
  studies: Array<{ name: string; industry?: string; result: string; url?: string }>;
  onChange: (studies: Array<{ name: string; industry?: string; result: string; url?: string }>) => void;
}) {
  return (
    <div className="space-y-3">
      <label className={LABEL_CLASS}>Case Studies</label>
      {studies.map((study, index) => (
        <div key={index} className={ITEM_PANEL_CLASS}>
          <div className="flex justify-between items-center">
            <span className={ITEM_TITLE_CLASS}>Case Study {index + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(studies.filter((_, i) => i !== index))}
              className={REMOVE_BUTTON_CLASS}
              aria-label={`Remove case study ${index + 1}`}
            >
              <IconX size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={study.name}
              onChange={(e) => {
                const updated = [...studies];
                updated[index] = { ...study, name: e.target.value };
                onChange(updated);
              }}
              placeholder="Client/Project name"
              aria-label={`Case study ${index + 1} name`}
              className={COMPACT_INPUT_CLASS}
            />
            <input
              type="text"
              value={study.industry || ""}
              onChange={(e) => {
                const updated = [...studies];
                updated[index] = { ...study, industry: e.target.value };
                onChange(updated);
              }}
              placeholder="Industry"
              aria-label={`Case study ${index + 1} industry`}
              className={COMPACT_INPUT_CLASS}
            />
          </div>
          <input
            type="text"
            value={study.result}
            onChange={(e) => {
              const updated = [...studies];
              updated[index] = { ...study, result: e.target.value };
              onChange(updated);
            }}
            placeholder="Key result"
            aria-label={`Case study ${index + 1} key result`}
            className={COMPACT_INPUT_CLASS}
          />
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange([...studies, { name: "", result: "", industry: "" }])}
        className={ADD_BUTTON_CLASS}
      >
        + Add case study
      </Button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = React.useState<Document | null>(null);
  const [content, setContent] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [previewKey, setPreviewKey] = React.useState(0);

  // Fetch document
  React.useEffect(() => {
    async function fetchDocument() {
      try {
        const res = await fetch(`/api/admin/documents/${documentId}`);
        if (res.ok) {
          const data = await res.json();
          setDocument(data.document);
          setContent(data.document.content_json || {});
        } else if (res.status === 404) {
          router.push("/admin/documents");
        }
      } catch (err) {
        console.error("Failed to fetch document:", err);
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    }
    fetchDocument();
  }, [documentId, router]);

  // Handle field change
  const handleFieldChange = (key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_json: content,
          html_content: null, // Clear cached HTML so it regenerates
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setHasChanges(false);

      // Force preview refresh with cache-busting
      setPreviewKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Save and continue to document
  const handleSaveAndView = async () => {
    await handleSave();
    if (!error) {
      router.push(`/admin/documents/${documentId}`);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading document..." />;
  }

  if (!document) {
    return null;
  }

  // Categorize fields from the actual content
  const scalarFields: Array<{ key: string; section: string }> = [];
  const arrayFields: Array<{ key: string; type: string }> = [];

  // Known complex array field types
  const COMPLEX_ARRAYS = new Set([
    "timeline", "scope", "pricingTiers", "paymentSchedule",
    "phases", "lineItems", "caseStudies", "milestones",
  ]);
  const STRING_ARRAYS = new Set([
    "keyOutcomes", "exclusions", "nextSteps", "differentiators",
    "clientResponsibilities", "additionalDeliverables",
  ]);

  for (const key of Object.keys(content)) {
    const value = content[key];

    if (COMPLEX_ARRAYS.has(key) || STRING_ARRAYS.has(key)) {
      arrayFields.push({ key, type: COMPLEX_ARRAYS.has(key) ? "complex" : "string" });
    } else if (Array.isArray(value)) {
      // Unknown arrays - treat as string arrays
      arrayFields.push({ key, type: "string" });
    } else if (typeof value === "object" && value !== null) {
      // Nested objects - skip providerBankDetails for now, show as fields
      if (key === "providerBankDetails") {
        const bankDetails = value as Record<string, string>;
        for (const subKey of Object.keys(bankDetails)) {
          scalarFields.push({ key: `providerBankDetails.${subKey}`, section: "Provider Info" });
        }
      }
      // Skip other complex objects
    } else {
      const section = SECTION_MAP[key] || "Other";
      scalarFields.push({ key, section });
    }
  }

  // Group scalar fields by section
  const sections: Record<string, string[]> = {};
  for (const { key, section } of scalarFields) {
    if (!sections[section]) sections[section] = [];
    sections[section].push(key);
  }

  // Define section order
  const sectionOrder = [
    "Basic Info", "Content", "Pricing", "Payment",
    "Provider Info", "Terms", "Change Details", "Impact",
    "Reference", "Notes", "Other",
  ];
  const orderedSections = sectionOrder.filter((s) => sections[s]);

  // Helper to get nested value
  const getValue = (key: string): unknown => {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      const obj = content[parent] as Record<string, unknown> | undefined;
      return obj?.[child];
    }
    return content[key];
  };

  // Helper to set nested value
  const setValue = (key: string, value: unknown) => {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      const existing = (content[parent] as Record<string, unknown>) || {};
      handleFieldChange(parent, { ...existing, [child]: value });
    } else {
      handleFieldChange(key, value);
    }
  };

  return (
    <PageContainer className="flex flex-col space-y-4 md:space-y-4 lg:h-[calc(100vh-120px)]">
      <PageHeader
        breadcrumb={
          <Link
            href={`/admin/documents/${documentId}`}
            aria-label="Back to document"
            className="inline-flex items-center justify-center p-2 -ml-2 rounded-lg text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))] transition-colors"
          >
            <IconChevronLeft size={20} />
          </Link>
        }
        title={`Edit ${document.document_number}`}
        subtitle={document.title}
        actions={
          <>
            {hasChanges && (
              <span className="inline-flex items-center text-sm text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full">
                Unsaved changes
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSaveAndView}
              disabled={saving}
            >
              Save & View
            </Button>
          </>
        }
      />

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600">
          {error}
        </div>
      )}

      {/* Editor and Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Editor Panel */}
        <Card padding="none" className="overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[hsl(var(--color-border))]/30 flex items-center justify-between gap-3">
            <h2 className={CARD_TITLE_CLASS}>Edit Content</h2>
            <span className="text-xs text-[hsl(var(--color-foreground-muted))]">
              {Object.keys(content).length} fields
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Scalar fields by section */}
            {orderedSections.map((section) => (
              <div key={section}>
                <h3 className={SUBSECTION_TITLE_CLASS}>
                  {section}
                </h3>
                <div className="space-y-3">
                  {sections[section].map((key) => {
                    const value = getValue(key);
                    const fieldType = getFieldType(key.includes(".") ? key.split(".")[1] : key);
                    const label = getLabel(key.includes(".") ? key.split(".")[1] : key);
                    const fieldId = `doc-field-${key.replace(/\s+/g, "-")}`;

                    return (
                      <div key={key}>
                        <label htmlFor={fieldId} className={cn(LABEL_CLASS, "mb-1.5")}>
                          {label}
                        </label>
                        {fieldType === "textarea" ? (
                          <textarea
                            id={fieldId}
                            value={(value as string) || ""}
                            onChange={(e) => setValue(key, e.target.value)}
                            rows={4}
                            className={cn(INPUT_CLASS, "resize-y")}
                          />
                        ) : fieldType === "currency" ? (
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--color-foreground-muted))]">$</span>
                            <input
                              id={fieldId}
                              type="number"
                              value={typeof value === "number" ? value : (typeof value === "string" ? value.replace(/[^0-9.]/g, "") : "")}
                              onChange={(e) => setValue(key, parseFloat(e.target.value) || 0)}
                              className={cn(INPUT_CLASS, "pl-8")}
                            />
                          </div>
                        ) : fieldType === "number" ? (
                          <input
                            id={fieldId}
                            type="number"
                            value={typeof value === "number" ? value : ""}
                            onChange={(e) => setValue(key, parseFloat(e.target.value) || 0)}
                            className={INPUT_CLASS}
                          />
                        ) : fieldType === "date" ? (
                          <input
                            id={fieldId}
                            type="date"
                            value={(value as string)?.split("T")[0] || ""}
                            onChange={(e) => setValue(key, e.target.value)}
                            className={INPUT_CLASS}
                          />
                        ) : (
                          <input
                            id={fieldId}
                            type="text"
                            value={(value as string) || ""}
                            onChange={(e) => setValue(key, e.target.value)}
                            className={INPUT_CLASS}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Array fields */}
            {arrayFields.length > 0 && (
              <div className="pt-6 border-t border-[hsl(var(--color-border))]/30">
                <h3 className={SUBSECTION_TITLE_CLASS}>
                  Lists & Collections
                </h3>
                <div className="space-y-5">
                  {arrayFields.map(({ key, type }) => {
                    const value = content[key];
                    const items = Array.isArray(value) ? value : [];

                    if (type === "string" || (type === "complex" && items.length > 0 && typeof items[0] === "string")) {
                      return (
                        <StringArrayEditor
                          key={key}
                          label={getLabel(key)}
                          items={items as string[]}
                          onChange={(newItems) => handleFieldChange(key, newItems)}
                        />
                      );
                    }

                    if (key === "timeline") {
                      return (
                        <TimelineEditor
                          key={key}
                          phases={items as Array<{ name: string; duration: string; color: string; description?: string }>}
                          onChange={(newPhases) => handleFieldChange(key, newPhases)}
                        />
                      );
                    }

                    if (key === "scope") {
                      return (
                        <ScopeEditor
                          key={key}
                          items={items as Array<{ deliverable: string; description: string; included: boolean }>}
                          onChange={(newItems) => handleFieldChange(key, newItems)}
                        />
                      );
                    }

                    if (key === "pricingTiers") {
                      return (
                        <PricingTiersEditor
                          key={key}
                          tiers={items as Array<{ name: string; price: number; duration: string; features: string[]; recommended: boolean }>}
                          onChange={(newTiers) => handleFieldChange(key, newTiers)}
                        />
                      );
                    }

                    if (key === "paymentSchedule") {
                      return (
                        <PaymentScheduleEditor
                          key={key}
                          schedule={items as Array<{ description: string; percentage: number; amount: number; dueOn?: string }>}
                          onChange={(newSchedule) => handleFieldChange(key, newSchedule)}
                        />
                      );
                    }

                    if (key === "phases") {
                      return (
                        <SOWPhasesEditor
                          key={key}
                          phases={items as Array<{ name: string; number: number; deliverables: string[]; duration?: string }>}
                          onChange={(newPhases) => handleFieldChange(key, newPhases)}
                        />
                      );
                    }

                    if (key === "lineItems") {
                      return (
                        <LineItemsEditor
                          key={key}
                          items={items as Array<{ description: string; quantity: number; unitPrice: number; amount: number }>}
                          onChange={(newItems) => handleFieldChange(key, newItems)}
                        />
                      );
                    }

                    if (key === "caseStudies") {
                      return (
                        <CaseStudiesEditor
                          key={key}
                          studies={items as Array<{ name: string; industry?: string; result: string; url?: string }>}
                          onChange={(newStudies) => handleFieldChange(key, newStudies)}
                        />
                      );
                    }

                    // Fallback: render as string array
                    return (
                      <StringArrayEditor
                        key={key}
                        label={getLabel(key)}
                        items={items.map((i) => (typeof i === "string" ? i : JSON.stringify(i)))}
                        onChange={(newItems) => handleFieldChange(key, newItems)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw JSON Editor for advanced users */}
            <div className="pt-6 border-t border-[hsl(var(--color-border))]/30">
              <details>
                <summary className="text-sm font-medium text-[hsl(var(--color-foreground-muted))] cursor-pointer hover:text-[hsl(var(--color-foreground))]">
                  Advanced: Edit Raw JSON
                </summary>
                <textarea
                  value={JSON.stringify(content, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setContent(parsed);
                      setHasChanges(true);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={15}
                  aria-label="Raw JSON"
                  className={cn(INPUT_CLASS, "mt-3 text-xs font-mono")}
                />
              </details>
            </div>
          </div>
        </Card>

        {/* Preview Panel */}
        <Card padding="none" className="overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[hsl(var(--color-border))]/30">
            <h2 className={CARD_TITLE_CLASS}>Preview</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="h-8 px-3 -mr-3 -my-2 text-sm text-[hsl(var(--color-accent))]"
            >
              Refresh
            </Button>
          </div>
          {/* The white backdrop is the document's own paper colour, not a theme surface */}
          <iframe
            key={previewKey}
            src={`/api/admin/documents/${documentId}/preview?t=${Date.now()}`}
            className="flex-1 bg-white min-h-[70vh] lg:min-h-0"
            title="Document Preview"
          />
        </Card>
      </div>
    </PageContainer>
  );
}
