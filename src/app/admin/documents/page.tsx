"use client";

import * as React from "react";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card, StatCard, SearchInput } from "@/components/admin/ui";
import {
  IconPlus,
  IconEye,
  IconDownload,
  IconFileText,
  IconShieldCheck,
  IconReceipt,
  IconRefresh,
} from "@/components/admin/icons";

interface DocumentSignature {
  id: string;
  signer_role: string;
  signer_name: string;
  signer_email: string;
  status: string;
  signed_at: string | null;
}

interface Document {
  id: string;
  document_number: string;
  document_type: "proposal" | "sow" | "invoice" | "change_order";
  title: string;
  status: string;
  lead: { id: string; name: string; email: string; company: string | null } | null;
  signatures: DocumentSignature[];
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
}

interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-600 border-gray-500/30",
  pending_review: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  pending_signature: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  signed: "bg-green-500/20 text-green-600 border-green-500/30",
  expired: "bg-red-500/20 text-red-600 border-red-500/30",
  archived: "bg-gray-500/20 text-gray-500 border-gray-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  pending_signature: "Awaiting Signature",
  signed: "Signed",
  expired: "Expired",
  archived: "Archived",
};

const TYPE_LABELS: Record<string, string> = {
  proposal: "Proposal",
  sow: "Contract",
  invoice: "Invoice",
  change_order: "Change Order",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  proposal: <IconFileText size={16} />,
  sow: <IconShieldCheck size={16} />,
  invoice: <IconReceipt size={16} />,
  change_order: <IconRefresh size={16} />,
};

const SELECT_CLASS =
  "h-10 px-3 rounded-xl bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40";

const TH_CLASS = "px-6 py-3 text-xs font-semibold text-[hsl(var(--color-foreground-muted))]";

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSignatureProgress(signatures: DocumentSignature[]) {
  if (!signatures || signatures.length === 0) return null;
  const signed = signatures.filter((s) => s.status === "signed").length;
  return { signed, total: signatures.length };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/documents?${params.toString()}`);
      if (res.ok) {
        const data: DocumentListResponse = await res.json();
        setDocuments(data.documents);
        setTotalPages(data.total_pages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, search, page]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Stats
  const stats = React.useMemo(() => {
    return {
      total: total,
      pending: documents.filter((d) => d.status === "pending_signature").length,
      signed: documents.filter((d) => d.status === "signed").length,
      drafts: documents.filter((d) => d.status === "draft").length,
    };
  }, [documents, total]);

  if (loading && documents.length === 0) {
    return <AdminLoader message="Loading documents..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        subtitle={`${total} total documents`}
        actions={
          <Button asChild variant="accent" size="sm">
            <Link href="/admin/documents/new">
              <IconPlus size={16} />
              New Document
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Drafts" value={stats.drafts} />
        <StatCard label="Pending Signature" value={stats.pending} />
        <StatCard label="Signed" value={stats.signed} accent="success" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search documents..."
        />

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by type"
          className={SELECT_CLASS}
        >
          <option value="all">All Types</option>
          <option value="proposal">Proposals</option>
          <option value="sow">Contracts</option>
          <option value="invoice">Invoices</option>
          <option value="change_order">Change Orders</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className={SELECT_CLASS}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="pending_signature">Awaiting Signature</option>
          <option value="signed">Signed</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Documents Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[hsl(var(--color-border))]/30">
                <th className={`text-left ${TH_CLASS}`}>Document</th>
                <th className={`text-left ${TH_CLASS}`}>Client</th>
                <th className={`text-left ${TH_CLASS}`}>Type</th>
                <th className={`text-left ${TH_CLASS}`}>Status</th>
                <th className={`text-left ${TH_CLASS}`}>Signatures</th>
                <th className={`text-left ${TH_CLASS}`}>Created</th>
                <th className={`text-right ${TH_CLASS}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--color-border))]/30">
              {documents.length > 0 ? (
                documents.map((doc) => {
                  const sigProgress = getSignatureProgress(doc.signatures);
                  return (
                    <tr key={doc.id} className="hover:bg-[hsl(var(--color-background-muted))]/30 transition-colors">
                      <td className="px-6 py-3.5 text-sm">
                        <Link href={`/admin/documents/${doc.id}`} className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-lg bg-[hsl(var(--color-accent))]/10 flex items-center justify-center text-[hsl(var(--color-accent))]">
                            {TYPE_ICONS[doc.document_type]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium whitespace-nowrap text-[hsl(var(--color-foreground))] hover:text-[hsl(var(--color-accent))] transition-colors">
                              {doc.document_number}
                            </p>
                            <p className="text-[hsl(var(--color-foreground-subtle))] truncate max-w-[200px]">{doc.title}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        {doc.lead ? (
                          <Link
                            href={`/admin/leads/${doc.lead.id}`}
                            className="text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-accent))] transition-colors"
                          >
                            {doc.lead.company || doc.lead.name}
                          </Link>
                        ) : (
                          <span className="text-[hsl(var(--color-foreground-subtle))]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        <span className="text-[hsl(var(--color-foreground-muted))]">{TYPE_LABELS[doc.document_type]}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${STATUS_COLORS[doc.status] || STATUS_COLORS.draft}`}
                        >
                          {STATUS_LABELS[doc.status] || doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        {sigProgress ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-[hsl(var(--color-background-muted))] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${(sigProgress.signed / sigProgress.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-[hsl(var(--color-foreground-muted))]">
                              {sigProgress.signed}/{sigProgress.total}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[hsl(var(--color-foreground-subtle))]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-[hsl(var(--color-foreground-subtle))] whitespace-nowrap">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
                          >
                            <Link href={`/admin/documents/${doc.id}`} title="View" aria-label="View">
                              <IconEye size={16} />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
                          >
                            <a
                              href={`/api/admin/documents/${doc.id}/pdf?download=true`}
                              title="Download PDF"
                              aria-label="Download PDF"
                            >
                              <IconDownload size={16} />
                            </a>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[hsl(var(--color-foreground-subtle))]">
                    {search || typeFilter !== "all" || statusFilter !== "all" ? "No documents match your filters" : "No documents yet. Create your first document!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
