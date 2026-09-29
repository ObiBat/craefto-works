"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Card, SearchInput, InfoField } from "@/components/admin/ui";
import {
  IconCheck,
  IconCheckCircle,
  IconChevronRight,
  IconFileText,
  IconInfo,
  IconReceipt,
  IconShieldCheck,
  IconSpinner,
} from "@/components/admin/icons";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  message: string | null;
  score: number;
}

type DocumentType = "proposal" | "sow" | "invoice";

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "proposal",
    label: "Project Proposal",
    description: "Present project scope, approach, timeline, and pricing to potential clients",
    icon: <IconFileText size={24} />,
  },
  {
    value: "sow",
    label: "Statement of Work",
    description: "Formal contract with detailed deliverables, milestones, and terms",
    icon: <IconShieldCheck size={24} />,
  },
  {
    value: "invoice",
    label: "Invoice",
    description: "Generate an invoice for milestone payments or completed work",
    icon: <IconReceipt size={24} />,
  },
];

const STEPS = ["Select Lead", "Choose Type", "Preview & Edit", "Create"];

const CARD_TITLE_CLASS =
  "font-[family-name:var(--font-heading)] text-lg font-semibold text-[hsl(var(--color-foreground))] mb-1";

export default function NewDocumentPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Form state
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [documentType, setDocumentType] = React.useState<DocumentType | null>(null);
  const [, setGeneratedContent] = React.useState<Record<string, unknown> | null>(null);
  const [, setGeneratedHtml] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  // Fetch leads on mount
  React.useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/admin/leads");
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
        }
      } catch (err) {
        console.error("Failed to fetch leads:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  // Filter leads by search term
  const filteredLeads = React.useMemo(() => {
    if (!searchTerm) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        (lead.company && lead.company.toLowerCase().includes(term))
    );
  }, [leads, searchTerm]);

  // Generate document when moving to step 3
  const handleGenerateDocument = React.useCallback(async () => {
    if (!selectedLead || !documentType) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          document_type: documentType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate document");
      }

      const data = await res.json();
      setGeneratedContent(data.content);
      setGeneratedHtml(data.html || "");

      // Navigate to the document detail page
      router.push(`/admin/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    }
  }, [selectedLead, documentType, router]);

  // Step navigation
  const canProceed = React.useMemo(() => {
    switch (step) {
      case 0:
        return selectedLead !== null;
      case 1:
        return documentType !== null;
      case 2:
        return true;
      default:
        return false;
    }
  }, [step, selectedLead, documentType]);

  const handleNext = () => {
    if (step === 2) {
      handleGenerateDocument();
    } else if (canProceed) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  if (loading) {
    return <AdminLoader message="Loading..." />;
  }

  return (
    <PageContainer className="max-w-4xl mx-auto">
      <PageHeader
        title="Create New Document"
        subtitle="Generate a professional document from your lead data"
      />

      {/* Progress Steps */}
      <div className="flex items-start sm:items-center gap-2 sm:gap-4">
        {STEPS.map((stepName, index) => (
          <React.Fragment key={stepName}>
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 min-w-0">
              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < step
                    ? "bg-green-500 text-white"
                    : index === step
                    ? "bg-[hsl(var(--color-accent))] text-white"
                    : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))] border border-[hsl(var(--color-border))]"
                }`}
              >
                {index < step ? <IconCheck size={16} /> : index + 1}
              </div>
              <span
                className={`text-xs sm:text-sm font-medium text-center sm:text-left ${
                  index <= step ? "text-[hsl(var(--color-foreground))]" : "text-[hsl(var(--color-foreground-muted))]"
                }`}
              >
                {stepName}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 min-w-2 h-px mt-4 sm:mt-0 ${
                  index < step ? "bg-green-500" : "bg-[hsl(var(--color-border))]"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        {/* Step 1: Select Lead */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className={CARD_TITLE_CLASS}>Select a Lead</h2>
              <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                Choose the client this document is for
              </p>
            </div>

            {/* Search */}
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search leads..."
              className="max-w-none"
            />

            {/* Lead List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-all text-left ${
                      selectedLead?.id === lead.id
                        ? "border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent))]/5"
                        : "border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-foreground-muted))] bg-[hsl(var(--color-background))]"
                    }`}
                  >
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-medium">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[hsl(var(--color-foreground))] break-words">{lead.name}</p>
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))] truncate">
                        {lead.company || lead.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{lead.budget_range || "—"}</p>
                      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
                        Score: {lead.score}
                      </p>
                    </div>
                    {selectedLead?.id === lead.id && (
                      <IconCheckCircle size={20} className="shrink-0 text-[hsl(var(--color-accent))]" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-[hsl(var(--color-foreground-muted))]">
                  {searchTerm ? "No leads match your search" : "No leads found"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Choose Document Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className={CARD_TITLE_CLASS}>Choose Document Type</h2>
              <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                Select the type of document to generate for {selectedLead?.name}
              </p>
            </div>

            <div className="grid gap-4">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setDocumentType(type.value)}
                  className={`w-full flex items-start gap-3 sm:gap-4 p-4 rounded-xl border transition-all text-left ${
                    documentType === type.value
                      ? "border-[hsl(var(--color-accent))] bg-[hsl(var(--color-accent))]/5"
                      : "border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-foreground-muted))] bg-[hsl(var(--color-background))]"
                  }`}
                >
                  <div
                    className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${
                      documentType === type.value
                        ? "bg-[hsl(var(--color-accent))] text-white"
                        : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-muted))]"
                    }`}
                  >
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[hsl(var(--color-foreground))]">{type.label}</p>
                    <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-1">
                      {type.description}
                    </p>
                  </div>
                  {documentType === type.value && (
                    <IconCheckCircle size={20} className="shrink-0 mt-1 text-[hsl(var(--color-accent))]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Preview & Confirm */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className={CARD_TITLE_CLASS}>Review & Generate</h2>
              <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                Confirm the details and generate your document
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Summary */}
            <div className="space-y-4 p-4 rounded-xl bg-[hsl(var(--color-background-muted))]/40">
              <div className="flex items-center gap-4 pb-4 border-b border-[hsl(var(--color-border))]/50">
                <div className="w-12 h-12 shrink-0 rounded-full bg-[hsl(var(--color-accent))]/20 flex items-center justify-center text-[hsl(var(--color-accent))] font-medium text-lg">
                  {selectedLead?.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 break-words">
                  <p className="font-medium text-[hsl(var(--color-foreground))]">{selectedLead?.name}</p>
                  <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
                    {selectedLead?.company || selectedLead?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField
                  label="Document Type"
                  value={DOCUMENT_TYPES.find((t) => t.value === documentType)?.label}
                />
                <InfoField
                  label="Service Interest"
                  value={selectedLead?.service_interest || "Not specified"}
                />
                <InfoField
                  label="Budget Range"
                  value={selectedLead?.budget_range || "Not specified"}
                />
                <InfoField
                  label="Timeline"
                  value={selectedLead?.timeline || "Not specified"}
                />
              </div>

              {selectedLead?.message && (
                <div className="pt-4 border-t border-[hsl(var(--color-border))]/50 break-words">
                  <InfoField label="Project Description" value={selectedLead.message} />
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <IconInfo size={20} className="shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-600">What happens next?</p>
                  <p className="text-sm text-blue-600/80 mt-1">
                    Your document will be generated using the Client Hub template with auto-filled data.
                    You can review and edit the content before sending it for signatures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack} disabled={step === 0}>
          Back
        </Button>

        <Button variant="accent" size="sm" onClick={handleNext} disabled={!canProceed || generating}>
          {generating ? (
            <>
              <IconSpinner size={16} />
              Generating...
            </>
          ) : step === 2 ? (
            <>
              <IconFileText size={16} />
              Generate Document
            </>
          ) : (
            <>
              Continue
              <IconChevronRight size={16} />
            </>
          )}
        </Button>
      </div>
    </PageContainer>
  );
}
