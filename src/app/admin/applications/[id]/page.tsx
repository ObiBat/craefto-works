"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { IconChevronLeft, IconDownload, IconStarFilled } from "@/components/admin/icons";

interface ApplicationAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  answer: string | string[];
}

interface Application {
  id: string;
  role_slug: string;
  role_title: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  resume_url: string | null;
  resume_filename: string | null;
  cover_letter_url: string | null;
  cover_letter_filename: string | null;
  answers: ApplicationAnswer[];
  status: string;
  rating: number | null;
  admin_notes: string | null;
  source: string | null;
  created_at: string;
  reviewed_at: string | null;
  updated_at: string;
}

const STATUS_OPTIONS = [
  "new", "reviewing", "shortlisted", "interview", "offer", "rejected", "hired", "archived",
] as const;

function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    reviewing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    shortlisted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    interview: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    offer: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    hired: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return styles[status] || styles.new;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = React.useState<Application | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  const id = params.id as string;

  React.useEffect(() => {
    async function fetchApplication() {
      try {
        const res = await fetch(`/api/admin/applications/${id}`);
        if (res.ok) {
          const data = await res.json();
          setApplication(data.application);
          setNotes(data.application.admin_notes || "");
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchApplication();
  }, [id]);

  const updateField = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setApplication(data.application);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (status: string) => {
    updateField({ status });
  };

  const handleRating = (rating: number) => {
    updateField({ rating: application?.rating === rating ? null : rating });
  };

  const handleNotesSave = () => {
    updateField({ admin_notes: notes });
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/applications");
      }
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return <AdminLoader message="Loading application..." />;
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <p className="text-[hsl(var(--color-foreground-muted))]">Application not found</p>
        <Link href="/admin/applications" className="text-sm text-[hsl(var(--color-accent))] hover:underline">
          Back to applications
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors"
      >
        <IconChevronLeft size={16} />
        All applications
      </Link>

      {/* Header */}
      <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl tracking-tight font-semibold mb-1">{application.full_name}</h1>
            <p className="text-[hsl(var(--color-foreground-muted))]">{application.role_title}</p>
            <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mt-1">
              Applied {formatDate(application.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Rating */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleRating(i + 1)}
                  className="focus:outline-none"
                  aria-label={`Rate ${i + 1} stars`}
                >
                  <IconStarFilled
                    size={20}
                    className={`transition-colors ${
                      application.rating && i < application.rating
                        ? "text-amber-400"
                        : "text-[hsl(var(--color-border))] hover:text-amber-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Status dropdown */}
            <select
              value={application.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer focus:outline-none ${getStatusStyle(application.status)}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))]">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Email" value={application.email} href={`mailto:${application.email}`} />
          {application.phone && <InfoRow label="Phone" value={application.phone} />}
          {application.location && <InfoRow label="Location" value={application.location} />}
        </div>
      </div>

      {/* Links */}
      {(application.portfolio_url || application.linkedin_url || application.github_url) && (
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">
            Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {application.portfolio_url && (
              <InfoRow label="Portfolio" value={application.portfolio_url} href={application.portfolio_url} external />
            )}
            {application.linkedin_url && (
              <InfoRow label="LinkedIn" value={application.linkedin_url} href={application.linkedin_url} external />
            )}
            {application.github_url && (
              <InfoRow label="GitHub" value={application.github_url} href={application.github_url} external />
            )}
          </div>
        </div>
      )}

      {/* Questions + Answers */}
      <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">
          Qualifying Answers
        </h2>
        <div className="space-y-5">
          {application.answers.map((a) => (
            <div key={a.question_id}>
              <p className="text-sm text-[hsl(var(--color-foreground-subtle))] mb-1">{a.question_text}</p>
              <p className="text-[hsl(var(--color-foreground))] leading-relaxed whitespace-pre-wrap">
                {Array.isArray(a.answer) ? a.answer.join(", ") : a.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Files */}
      {(application.resume_url || application.cover_letter_url) && (
        <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">
            Attachments
          </h2>
          <div className="flex flex-wrap gap-3">
            {application.resume_url && (
              <a
                href={application.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-lg text-sm text-[hsl(var(--color-foreground))] hover:border-[hsl(var(--color-accent))] transition-colors"
              >
                <IconDownload size={16} />
                {application.resume_filename || "Resume"}
              </a>
            )}
            {application.cover_letter_url && (
              <a
                href={application.cover_letter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-lg text-sm text-[hsl(var(--color-foreground))] hover:border-[hsl(var(--color-accent))] transition-colors"
              >
                <IconDownload size={16} />
                {application.cover_letter_filename || "Cover Letter"}
              </a>
            )}
          </div>

          {/* Resume PDF preview */}
          {application.resume_url && application.resume_filename?.endsWith(".pdf") && (
            <div className="mt-4">
              <iframe
                src={application.resume_url}
                className="w-full h-[600px] rounded-lg border border-[hsl(var(--color-border))]"
                title="Resume preview"
              />
            </div>
          )}
        </div>
      )}

      {/* Admin notes */}
      <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">
          Admin Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesSave}
          rows={4}
          placeholder="Add private notes about this applicant..."
          className="w-full px-4 py-3 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-ring))] resize-y min-h-[100px]"
        />
        {saving && (
          <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mt-2">Saving...</p>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">
          Timeline
        </h2>
        <div className="space-y-3">
          <TimelineItem label="Applied" date={application.created_at} />
          {application.reviewed_at && (
            <TimelineItem label="Reviewed" date={application.reviewed_at} />
          )}
          <TimelineItem label="Last updated" date={application.updated_at} />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-4">
          Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {application.status !== "archived" && (
            <button
              onClick={() => handleStatusChange("archived")}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors"
            >
              Archive
            </button>
          )}
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-1">{label}</p>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-sm text-[hsl(var(--color-accent))] hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-[hsl(var(--color-foreground))]">{value}</p>
      )}
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-accent))]" />
      <span className="text-sm text-[hsl(var(--color-foreground-muted))]">{label}</span>
      <span className="text-sm text-[hsl(var(--color-foreground-subtle))]">{formatDate(date)}</span>
    </div>
  );
}
