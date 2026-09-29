"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/ui";
import { IconPlus, IconFileText } from "@/components/admin/icons";

interface FinancesData {
  monthlyRevenue: number;
  monthlyCost: number;
  netProfit: number;
  margin: number;
  chartData: Array<{ label: string; revenue: number; cost: number }>;
  topClients: Array<{ name: string; revenue: number }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    subtotal: number;
    total: number;
    currency: string;
    status: string;
    payment_status: string;
    due_date: string | null;
    paid_at: string | null;
    created_at: string;
  }>;
  contractorCosts: Array<{
    id: string;
    name: string;
    hourly_rate: number;
    currency: string;
    hours: number;
    total: number;
  }>;
  projectCosts: Array<{
    id: string;
    name: string;
    hours: number;
    cost: number;
    revenue: number;
  }>;
}

type Tab = "overview" | "invoices" | "costs";

const INVOICE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border))]/30" },
  sent: { label: "Sent", color: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
  pending: { label: "Pending", color: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
  paid: { label: "Paid", color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
  overdue: { label: "Overdue", color: "bg-red-500/15 text-red-400 border border-red-500/20" },
  cancelled: { label: "Cancelled", color: "bg-[hsl(var(--color-foreground-subtle))]/10 text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border))]/30" },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function formatCurrency(value: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" });
}

export default function FinancesPage() {
  const [data, setData] = React.useState<FinancesData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>("overview");

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/finances/overview");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch finances:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <AdminLoader message="Loading finances..." />;

  const maxChartValue = data
    ? Math.max(...data.chartData.flatMap((d) => [d.revenue, d.cost]), 1)
    : 1;

  return (
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <PageHeader title="Finances" subtitle="Revenue, costs, and invoicing" />
      </motion.div>

      {/* Tab Navigation — underline style */}
      <motion.div variants={fadeUp}>
        <div className="flex gap-6 border-b border-[hsl(var(--color-border))]/30">
          {(["overview", "invoices", "costs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
                tab === t
                  ? "text-[hsl(var(--color-foreground))]"
                  : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--color-accent))] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview Tab */}
      {tab === "overview" && data && (
        <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">
          {/* Stats Grid */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer}>
            <motion.div variants={fadeUp}>
              <StatCard label="Monthly Revenue" value={formatCurrency(data.monthlyRevenue)} />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard label="Monthly Costs" value={formatCurrency(data.monthlyCost)} />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                label="Net Profit"
                value={formatCurrency(data.netProfit)}
                accent={data.netProfit > 0 ? "success" : "warning"}
              />
            </motion.div>
            <motion.div variants={fadeUp}>
              <StatCard
                label="Margin"
                value={`${data.margin}%`}
                accent={data.margin >= 30 ? "success" : data.margin >= 15 ? undefined : "warning"}
              />
            </motion.div>
          </motion.div>

          {/* Chart + Top Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue vs Cost Chart */}
            <motion.div
              className="lg:col-span-2 bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
              variants={fadeUp}
            >
              <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Revenue vs Cost</h2>
                <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-0.5">Last 6 months</p>
              </div>
              <div className="p-6">
                <div className="flex items-end gap-3 h-48">
                  {data.chartData.map((month, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-1 items-end h-40">
                        {/* Revenue bar */}
                        <div className="flex-1 flex flex-col justify-end">
                          <div
                            className="bg-[hsl(var(--color-accent))]/60 rounded-t transition-all duration-500"
                            style={{
                              height: `${maxChartValue > 0 ? (month.revenue / maxChartValue) * 100 : 0}%`,
                              minHeight: month.revenue > 0 ? "4px" : "0px",
                            }}
                          />
                        </div>
                        {/* Cost bar */}
                        <div className="flex-1 flex flex-col justify-end">
                          <div
                            className="bg-red-500/40 rounded-t transition-all duration-500"
                            style={{
                              height: `${maxChartValue > 0 ? (month.cost / maxChartValue) * 100 : 0}%`,
                              minHeight: month.cost > 0 ? "4px" : "0px",
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-[hsl(var(--color-foreground-subtle))]">
                        {month.label}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[hsl(var(--color-border))]/30">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[hsl(var(--color-accent))]/60" />
                    <span className="text-xs text-[hsl(var(--color-foreground-muted))]">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-500/40" />
                    <span className="text-xs text-[hsl(var(--color-foreground-muted))]">Cost</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Clients */}
            <motion.div
              className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
              variants={fadeUp}
            >
              <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Top Clients</h2>
                <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-0.5">By project revenue</p>
              </div>
              <div className="divide-y divide-[hsl(var(--color-border))]/30">
                {data.topClients.length > 0 ? (
                  data.topClients.map((client, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono tabular-nums text-[hsl(var(--color-foreground-subtle))] w-5">{i + 1}.</span>
                        <span className="text-sm font-medium text-[hsl(var(--color-foreground))]">{client.name}</span>
                      </div>
                      <span className="text-sm font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                        {formatCurrency(client.revenue)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No revenue data yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Invoices Tab */}
      {tab === "invoices" && data && (
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <div className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl">
            <div className="p-6 border-b border-[hsl(var(--color-border))]/30 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">All Invoices</h2>
              <Link
                href="/admin/documents/new"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--color-accent))] text-white hover:bg-[hsl(var(--color-accent-hover))] transition-colors text-xs font-medium"
              >
                <IconPlus size={14} />
                Create Invoice
              </Link>
            </div>
            {data.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[hsl(var(--color-border))]/30">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Invoice #</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Amount</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Due Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--color-border))]/30">
                    {data.invoices.map((inv) => {
                      const paymentStatus = inv.payment_status || inv.status || "draft";
                      const statusConf = INVOICE_STATUS_CONFIG[paymentStatus] || INVOICE_STATUS_CONFIG.draft;
                      return (
                        <tr key={inv.id} className="hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                            {inv.invoice_number || "\u2014"}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-[hsl(var(--color-foreground))]">
                            {formatCurrency(Number(inv.total || inv.subtotal || 0), inv.currency || "AUD")}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                              {statusConf.label}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-[hsl(var(--color-foreground-muted))]">
                            {inv.due_date ? formatDate(inv.due_date) : "\u2014"}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-[hsl(var(--color-foreground-muted))]">
                            {formatDate(inv.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<IconFileText size={48} />}
                title="No invoices yet"
                description="Create your first invoice to get started"
                action={
                  <Link
                    href="/admin/documents/new"
                    className="px-5 py-2.5 bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-hover))] text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Create Invoice
                  </Link>
                }
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Costs Tab */}
      {tab === "costs" && data && (
        <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">
          {/* Contractor Costs */}
          <motion.div
            className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
            variants={fadeUp}
          >
            <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Contractor Costs</h2>
              <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-0.5">This month</p>
            </div>
            {data.contractorCosts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[hsl(var(--color-border))]/30">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Name</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Hours</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Rate</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--color-border))]/30">
                    {data.contractorCosts
                      .filter((c) => c.hours > 0)
                      .sort((a, b) => b.total - a.total)
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-medium text-[hsl(var(--color-foreground))]">{c.name}</td>
                          <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-right text-[hsl(var(--color-foreground))]">{c.hours}h</td>
                          <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-right text-[hsl(var(--color-foreground-muted))]">
                            {c.currency} {c.hourly_rate}/hr
                          </td>
                          <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-right font-medium text-[hsl(var(--color-foreground))]">
                            {formatCurrency(c.total)}
                          </td>
                        </tr>
                      ))}
                    {data.contractorCosts.filter((c) => c.hours > 0).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-[hsl(var(--color-foreground-subtle))]">
                          No logged hours this month
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No contractor data</p>
              </div>
            )}
          </motion.div>

          {/* Per-Project Costs */}
          <motion.div
            className="bg-[hsl(var(--color-background-subtle))]/50 backdrop-blur-sm border border-[hsl(var(--color-border))]/50 rounded-2xl"
            variants={fadeUp}
          >
            <div className="p-6 border-b border-[hsl(var(--color-border))]/30">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold">Project Costs</h2>
              <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-0.5">This month</p>
            </div>
            {data.projectCosts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[hsl(var(--color-border))]/30">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Project</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Hours</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Cost</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--color-border))]/30">
                    {data.projectCosts
                      .sort((a, b) => b.cost - a.cost)
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-medium text-[hsl(var(--color-foreground))]">{p.name}</td>
                          <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-right text-[hsl(var(--color-foreground))]">{p.hours}h</td>
                          <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-right text-[hsl(var(--color-foreground))]">
                            {formatCurrency(p.cost)}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-mono tabular-nums text-right text-[hsl(var(--color-foreground-muted))]">
                            {formatCurrency(p.revenue)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-[hsl(var(--color-foreground-subtle))]">No active projects</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

