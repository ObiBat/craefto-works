"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { EmptyState } from "@/components/admin/ui";
import { IconPlus, IconFileText } from "@/components/admin/icons";

interface Document {
  id: string;
  document_number: string;
  document_type: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  content_json: Record<string, unknown>;
  lead: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  draft: { label: "Draft", color: "bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border))]/30", step: 0 },
  sent: { label: "Sent", color: "bg-blue-500/15 text-blue-400 border border-blue-500/20", step: 1 },
  pending_signature: { label: "Sent", color: "bg-blue-500/15 text-blue-400 border border-blue-500/20", step: 1 },
  viewed: { label: "Viewed", color: "bg-purple-500/15 text-purple-400 border border-purple-500/20", step: 2 },
  signed: { label: "Accepted", color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", step: 3 },
  accepted: { label: "Accepted", color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", step: 3 },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border border-red-500/20", step: -1 },
  declined: { label: "Rejected", color: "bg-red-500/15 text-red-400 border border-red-500/20", step: -1 },
  expired: { label: "Expired", color: "bg-amber-500/15 text-amber-400 border border-amber-500/20", step: -1 },
};

const TYPE_LABELS: Record<string, string> = {
  proposal: "Proposal",
  sow: "Statement of Work",
  change_order: "Change Order",
  invoice: "Invoice",
};

const FLOW_STEPS = ["Draft", "Sent", "Viewed", "Accepted"];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusFlow({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {FLOW_STEPS.map((label, i) => {
        const isActive = step >= 0 && i <= step;
        const isCurrent = i === step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-[hsl(var(--color-accent))]"
                    : isActive
                    ? "bg-emerald-500"
                    : "bg-[hsl(var(--color-foreground-subtle))]/30"
                }`}
              />
              <span className={`text-[9px] ${
                isActive ? "text-[hsl(var(--color-foreground-muted))]" : "text-[hsl(var(--color-foreground-subtle))]/50"
              }`}>
                {label}
              </span>
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mt-[-10px] ${
                  step >= 0 && i < step ? "bg-emerald-500/50" : "bg-[hsl(var(--color-foreground-subtle))]/20"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ProposalsPage() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "proposal" | "sow" | "change_order">("all");

  React.useEffect(() => {
    async function fetchDocuments() {
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (filter !== "all") {
          params.set("type", filter);
        }
        const res = await fetch(`/api/admin/documents?${params}`);
        if (res.ok) {
          const data = await res.json();
          let docs = data.documents || [];
          if (filter === "all") {
            docs = docs.filter((d: Document) => d.document_type !== "invoice");
          }
          setDocuments(docs);
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, [filter]);

  if (loading) return <AdminLoader message="Loading proposals..." />;

  return (
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight mb-1">Proposals</h1>
          <p className="text-[hsl(var(--color-foreground-muted))]">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl border border-[hsl(var(--color-border))]/50 overflow-hidden">
            {(["all", "proposal", "sow", "change_order"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-[hsl(var(--color-accent))]/10 text-[hsl(var(--color-foreground))]"
                    : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
                }`}
              >
                {f === "all" ? "All" : f === "sow" ? "SOW" : f === "change_order" ? "Change Orders" : "Proposals"}
              </button>
            ))}
          </div>
          <Link
            href="/admin/documents/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--color-accent))] text-white hover:bg-[hsl(var(--color-accent-hover))] transition-colors text-sm font-medium"
          >
            <IconPlus size={16} />
            Create Proposal
          </Link>
        </div>
      </motion.div>

      {/* Cards */}
      {documents.length === 0 ? (
        <motion.div variants={fadeUp}>
          <div className="min-h-[400px] flex items-center justify-center">
            <EmptyState
              icon={<IconFileText size={48} />}
              title="No proposals yet"
              description="Create proposals, SOWs, and change orders for your clients"
              action={
                <Link
                  href="/admin/documents/new"
                  className="px-5 py-2.5 bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-hover))] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Create your first proposal
                </Link>
              }
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={staggerContainer}
        >
          {documents.map((doc) => {
            const statusConf = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
            const typeName = TYPE_LABELS[doc.document_type] || doc.document_type;
            const amount = (doc.content_json as { total?: number; amount?: number })?.total ||
              (doc.content_json as { total?: number; amount?: number })?.amount || 0;

            return (
              <motion.div key={doc.id} variants={fadeUp}>
                <Link
                  href={`/admin/documents/${doc.id}`}
                  className="block bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl hover:border-[hsl(var(--color-border-strong))]/60 hover:bg-[hsl(var(--color-background-subtle))]/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
                >
                  <div className="p-6">
                    {/* Status flow */}
                    <StatusFlow step={statusConf.step} />

                    {/* Type badge + status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-[hsl(var(--color-foreground-subtle))]">
                        {typeName}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-[hsl(var(--color-foreground))] mb-1 line-clamp-2">
                      {doc.title}
                    </h3>

                    {/* Recipient */}
                    <p className="text-sm text-[hsl(var(--color-foreground-muted))] mb-3">
                      {doc.lead?.company || doc.lead?.name || "No client"}
                    </p>

                    {/* Footer: amount + date */}
                    <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--color-border))]/30">
                      {amount > 0 ? (
                        <span className="text-sm font-mono tabular-nums font-medium text-[hsl(var(--color-foreground))]">
                          {formatCurrency(amount)}
                        </span>
                      ) : (
                        <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                          {doc.document_number}
                        </span>
                      )}
                      <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                        {formatRelativeDate(doc.updated_at || doc.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
