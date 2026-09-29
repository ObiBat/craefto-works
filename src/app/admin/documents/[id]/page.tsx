"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card, DetailSection, InfoField } from "@/components/admin/ui";
import {
  IconArchive,
  IconChevronLeft,
  IconClock,
  IconDownload,
  IconEdit,
  IconEye,
  IconSend,
  IconSpinner,
  IconX,
} from "@/components/admin/icons";

interface DocumentSignature {
  id: string;
  signer_role: string;
  signer_name: string;
  signer_email: string;
  status: string;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
}

interface DocumentActivity {
  id: string;
  activity_type: string;
  actor: string;
  description: string;
  created_at: string;
}

interface Document {
  id: string;
  document_number: string;
  document_type: "proposal" | "sow" | "invoice" | "change_order";
  title: string;
  status: string;
  content_json: Record<string, unknown>;
  html_content: string | null;
  lead: { id: string; name: string; email: string; company: string | null } | null;
  signatures: DocumentSignature[];
  activities: DocumentActivity[];
  created_at: string;
  sent_at: string | null;
  expires_at: string | null;
  signed_at: string | null;
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
  proposal: "Project Proposal",
  sow: "Statement of Work",
  invoice: "Invoice",
  change_order: "Change Order",
};

const SIGNATURE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-500/20 text-gray-600",
  sent: "bg-blue-500/20 text-blue-600",
  viewed: "bg-yellow-500/20 text-yellow-600",
  signed: "bg-green-500/20 text-green-600",
};

const CARD_TITLE_CLASS = "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))]";

const ACTION_ITEM_CLASS = "w-full justify-start h-auto px-4 py-3 rounded-xl";

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))]/40 focus:border-[hsl(var(--color-accent))]/40";

const LABEL_CLASS = "block text-sm font-medium text-[hsl(var(--color-foreground-muted))] mb-1.5";

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivityDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = React.useState<Document | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [showSendModal, setShowSendModal] = React.useState(false);
  const [signerEmail, setSignerEmail] = React.useState("");
  const [signerName, setSignerName] = React.useState("");
  const [sendError, setSendError] = React.useState<string | null>(null);

  // Fetch document
  React.useEffect(() => {
    async function fetchDocument() {
      try {
        const res = await fetch(`/api/admin/documents/${documentId}`);
        if (res.ok) {
          const data = await res.json();
          setDocument(data.document);
          // Pre-fill signer info from lead
          if (data.document.lead) {
            setSignerEmail(data.document.lead.email);
            setSignerName(data.document.lead.name);
          }
        } else if (res.status === 404) {
          router.push("/admin/documents");
        }
      } catch (error) {
        console.error("Failed to fetch document:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDocument();
  }, [documentId, router]);

  // Send for signature
  const handleSendForSignature = async () => {
    if (!signerEmail || !signerName) {
      setSendError("Please provide signer name and email");
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const res = await fetch(`/api/admin/documents/${documentId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signers: [
            { email: signerEmail, name: signerName, role: "client" },
          ],
          message: `Please review and sign: ${document?.title}`,
          expires_in_days: 14,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send document");
      }

      // Refresh document
      const refreshRes = await fetch(`/api/admin/documents/${documentId}`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setDocument(data.document);
      }

      setShowSendModal(false);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  // Archive document
  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this document?")) return;

    try {
      const res = await fetch(`/api/admin/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/documents");
      }
    } catch (error) {
      console.error("Failed to archive document:", error);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading document..." />;
  }

  if (!document) {
    return null;
  }

  const canSend = ["draft", "pending_review"].includes(document.status);

  return (
    <PageContainer>
      <PageHeader
        title={document.document_number}
        subtitle={document.title}
        breadcrumb={
          <div className="flex items-center gap-3">
            <Link
              href="/admin/documents"
              aria-label="Back to documents"
              className="inline-flex items-center justify-center p-1 rounded-lg text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))] transition-colors"
            >
              <IconChevronLeft size={20} />
            </Link>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[document.status] || STATUS_COLORS.draft}`}
            >
              {STATUS_LABELS[document.status] || document.status}
            </span>
          </div>
        }
        actions={
          <>
            {canSend && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/admin/documents/${documentId}/edit`}>
                  <IconEdit size={16} />
                  Edit
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="sm">
              <a
                href={`/api/admin/documents/${documentId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconEye size={16} />
                Preview PDF
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={`/api/admin/documents/${documentId}/pdf?download=true`}>
                <IconDownload size={16} />
                Download
              </a>
            </Button>
            {canSend && (
              <Button variant="accent" size="sm" onClick={() => setShowSendModal(true)}>
                <IconSend size={16} />
                Send for Signature
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Document Preview */}
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-4 border-b border-[hsl(var(--color-border))]/30">
              <h2 className={CARD_TITLE_CLASS}>Document Preview</h2>
              <a
                href={`/api/admin/documents/${document.id}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-[hsl(var(--color-accent))] hover:underline"
              >
                Open in new tab
              </a>
            </div>
            <iframe
              src={`/api/admin/documents/${document.id}/preview`}
              className="w-full h-[600px] bg-white"
              title="Document Preview"
            />
          </Card>

          {/* Document Details */}
          <DetailSection title="Document Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Type" value={TYPE_LABELS[document.document_type]} />
              <InfoField label="Created" value={formatDate(document.created_at)} />
              {document.sent_at && <InfoField label="Sent" value={formatDate(document.sent_at)} />}
              {document.expires_at && <InfoField label="Expires" value={formatDate(document.expires_at)} />}
              {document.signed_at && (
                <InfoField
                  label="Signed"
                  value={<span className="text-green-600">{formatDate(document.signed_at)}</span>}
                />
              )}
            </div>
          </DetailSection>

          {/* Signatures */}
          {document.signatures && document.signatures.length > 0 && (
            <DetailSection title="Signatures">
              <div className="space-y-3">
                {document.signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[hsl(var(--color-background-muted))]/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-medium">
                        {sig.signer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[hsl(var(--color-foreground))] break-words">{sig.signer_name}</p>
                        <p className="text-sm text-[hsl(var(--color-foreground-muted))] break-all">{sig.signer_email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${SIGNATURE_STATUS_COLORS[sig.status]}`}>
                        {sig.status === "signed" ? "Signed" : sig.status === "viewed" ? "Viewed" : sig.status === "sent" ? "Sent" : "Pending"}
                      </span>
                      {sig.signed_at && (
                        <p className="text-xs text-[hsl(var(--color-foreground-muted))] mt-1">{formatDate(sig.signed_at)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Activity Log */}
          {document.activities && document.activities.length > 0 && (
            <DetailSection title="Activity">
              <div className="space-y-4">
                {document.activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--color-background-muted))] flex items-center justify-center flex-shrink-0">
                      <IconClock size={16} className="text-[hsl(var(--color-foreground-muted))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[hsl(var(--color-foreground))] break-words">{activity.description}</p>
                      <p className="text-xs text-[hsl(var(--color-foreground-muted))] mt-1">
                        {activity.actor} &middot; {formatActivityDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Client Info */}
          {document.lead && (
            <DetailSection title="Client">
              <Link
                href={`/admin/leads/${document.lead.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-medium text-lg">
                  {document.lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-accent))] transition-colors break-words">
                    {document.lead.name}
                  </p>
                  <p className="text-sm text-[hsl(var(--color-foreground-muted))] break-all">
                    {document.lead.company || document.lead.email}
                  </p>
                </div>
              </Link>
            </DetailSection>
          )}

          {/* Quick Actions */}
          <DetailSection title="Actions">
            <div className="space-y-1">
              {canSend && (
                <Button asChild variant="ghost" className={ACTION_ITEM_CLASS}>
                  <Link href={`/admin/documents/${documentId}/edit`}>
                    <IconEdit size={20} className="text-[hsl(var(--color-foreground-muted))]" />
                    <span>Edit Document</span>
                  </Link>
                </Button>
              )}
              {canSend && (
                <Button variant="ghost" className={ACTION_ITEM_CLASS} onClick={() => setShowSendModal(true)}>
                  <IconSend size={20} className="text-[hsl(var(--color-accent))]" />
                  <span>Send for Signature</span>
                </Button>
              )}
              <Button asChild variant="ghost" className={ACTION_ITEM_CLASS}>
                <a
                  href={`/api/admin/documents/${documentId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconEye size={20} className="text-[hsl(var(--color-foreground-muted))]" />
                  <span>Preview PDF</span>
                </a>
              </Button>
              <Button
                variant="ghost"
                className={`${ACTION_ITEM_CLASS} text-red-600 hover:bg-red-500/10`}
                onClick={handleArchive}
              >
                <IconArchive size={20} />
                <span>Archive Document</span>
              </Button>
            </div>
          </DetailSection>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))]/50 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className={CARD_TITLE_CLASS}>Send for Signature</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Close"
                onClick={() => setShowSendModal(false)}
              >
                <IconX size={20} />
              </Button>
            </div>

            {sendError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm">
                {sendError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="signer-name" className={LABEL_CLASS}>Signer Name</label>
                <input
                  id="signer-name"
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Client name"
                />
              </div>
              <div>
                <label htmlFor="signer-email" className={LABEL_CLASS}>Signer Email</label>
                <input
                  id="signer-email"
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="client@example.com"
                />
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-600">
                  An email will be sent to the signer with a secure link to view and sign the document.
                  The signature request will expire in 14 days.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowSendModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1"
                  onClick={handleSendForSignature}
                  disabled={sending || !signerEmail || !signerName}
                >
                  {sending ? (
                    <>
                      <IconSpinner size={16} />
                      Sending...
                    </>
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
