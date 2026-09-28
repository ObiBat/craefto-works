"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Container, Section } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition, AnimatedSection } from "@/components/ui";
import type { Role, ApplicationQuestion } from "@/lib/careers";
import { supabase } from "@/lib/supabase";
import { RevealText } from "@/components/editorial/reveal-text";

// User-facing steps. The submission spinner is rendered as an overlay rather
// than a fake step so the progress indicator and step counter stay accurate.
const STEPS = ["Personal", "Questions", "Files", "Review"] as const;
const STEP_SUBTITLES = [
  "Tell us who you are and how to reach you.",
  "A few quick questions about your experience.",
  "Upload your resume and any supporting documents.",
  "Double-check everything before submitting.",
];
const STORAGE_KEY_PREFIX = "craefto_apply_";
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const CURRENCIES = ["AUD", "USD", "EUR", "GBP"] as const;
const PERIODS = ["hour", "day", "week", "month", "year"] as const;

interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  portfolio_url: string;
  linkedin_url: string;
  github_url: string;
}

interface FileInfo {
  file: File | null;
  url: string;
  filename: string;
}

interface FormErrors {
  [key: string]: string;
}

function getStorageKey(slug: string) {
  return `${STORAGE_KEY_PREFIX}${slug}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Unified chip style — single-select and multi-select use the exact same visual
// so selections are always consistent black with no layout shift.
function chipClass(selected: boolean): string {
  const base =
    "px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 select-none";
  if (selected) {
    return `${base} bg-[hsl(var(--color-foreground))] border-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))] hover:opacity-90`;
  }
  return `${base} bg-[hsl(var(--color-background-muted))] border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground-muted))] hover:bg-[hsl(var(--color-border))] hover:text-[hsl(var(--color-foreground))]`;
}

// ── Main component ──

export function ApplicationFormClient({ role }: { role: Role }) {
  const [step, setStep] = React.useState(0);
  const [personal, setPersonal] = React.useState<PersonalInfo>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    portfolio_url: "",
    linkedin_url: "",
    github_url: "",
  });
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});
  const [resume, setResume] = React.useState<FileInfo>({ file: null, url: "", filename: "" });
  const [coverLetter, setCoverLetter] = React.useState<FileInfo>({ file: null, url: "", filename: "" });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const isFirstRender = React.useRef(true);

  // Scroll the form to the top whenever the step changes (fixes mobile UX
  // where tapping Continue/Submit left the viewport at the bottom of the
  // previous step). Skip on the very first render so we do not hijack the
  // user's scroll position when the page loads.
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    const el = formTopRef.current;
    if (!el) return;
    // Use rAF to wait for the new step to paint, then scroll
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const target = window.scrollY + rect.top - 80; // 80px offset for sticky header
      window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    });
  }, [step, submitted]);

  // Load draft from localStorage. We persist text fields and current step,
  // but file uploads cannot survive a refresh — so cap the restored step at
  // the Files step (index 2). Otherwise users would land on Review with an
  // empty resume slot and trip a confusing validation error on submit.
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(role.slug));
      if (saved) {
        const data = JSON.parse(saved);
        if (data.personal) setPersonal(data.personal);
        if (data.answers) setAnswers(data.answers);
        if (typeof data.step === "number") {
          setStep(Math.min(Math.max(data.step, 0), 2));
        }
      }
    } catch {
      // ignore
    }
  }, [role.slug]);

  // Save draft to localStorage
  React.useEffect(() => {
    if (submitted) return;
    try {
      localStorage.setItem(
        getStorageKey(role.slug),
        JSON.stringify({ personal, answers, step })
      );
    } catch {
      // ignore
    }
  }, [personal, answers, step, role.slug, submitted]);

  const validateStep = (s: number): boolean => {
    const newErrors: FormErrors = {};

    if (s === 0) {
      if (!personal.full_name.trim()) newErrors.full_name = "Name is required";
      if (!personal.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email))
        newErrors.email = "Invalid email address";
    }

    if (s === 1) {
      for (const q of role.questions) {
        if (!q.required) continue;
        const val = answers[q.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          newErrors[q.id] = "This field is required";
        } else if (typeof val === "string") {
          if (q.type === "compensation") {
            // Validate the compound compensation value
            const parts = val.split(" ");
            if (parts.length < 4 || !parts[0] || parts[0] === "0") {
              newErrors[q.id] = "Please enter a valid amount";
            }
          }
          if (q.minLength && val.length < q.minLength) {
            newErrors[q.id] = `Minimum ${q.minLength} characters`;
          }
          if (q.maxLength && val.length > q.maxLength) {
            newErrors[q.id] = `Maximum ${q.maxLength} characters`;
          }
        }
      }
    }

    if (s === 2) {
      if (!resume.file && !resume.url) newErrors.resume = "Resume is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  // Backward navigation only. Going back never invalidates earlier steps, so
  // it is safe to jump to any prior step. Forward navigation must always go
  // through goNext() so the current step is re-validated before advancing.
  const goToStep = (s: number) => {
    if (s < step) setStep(s);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileInfo>>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [fieldName]: "Only PDF, DOC, and DOCX files are accepted" }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, [fieldName]: "File must be under 10 MB" }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setter({ file, url: "", filename: file.name });
  };

  // Upload via a server-issued signed URL. The browser never holds an API key
  // capable of writing to storage — the server validates role, filename, size,
  // and mime type before issuing a short-lived token scoped to a single path.
  const uploadFile = async (
    fileInfo: FileInfo,
    kind: "resume" | "cover_letter"
  ): Promise<{ url: string; filename: string } | null> => {
    if (!fileInfo.file) {
      return fileInfo.url ? { url: fileInfo.url, filename: fileInfo.filename } : null;
    }
    const file = fileInfo.file;

    // 1. Ask the server for a signed upload URL.
    const urlRes = await fetch("/api/careers/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_slug: role.slug,
        filename: file.name,
        size: file.size,
        type: file.type,
        kind,
      }),
    });

    if (!urlRes.ok) {
      const err = await urlRes.json().catch(() => ({}));
      throw new Error(err.error || "Could not prepare upload.");
    }

    const { token, path, publicUrl } = (await urlRes.json()) as {
      signedUrl: string;
      token: string;
      path: string;
      publicUrl: string;
    };

    // 2. Upload the file to the signed URL. The token authorises this single
    // path; no anon key is required.
    const { error } = await supabase.storage
      .from("job-applications")
      .uploadToSignedUrl(path, token, file);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    return { url: publicUrl, filename: file.name };
  };

  const handleSubmit = async () => {
    // Re-validate every prior step in order. If any step is invalid (e.g.
    // because the user edited a field via the Review screen and cleared
    // something required) jump back to that step rather than trusting the
    // server to surface the error.
    for (const s of [0, 1, 2] as const) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Upload files via signed URLs
      setUploadProgress("Uploading resume...");
      const resumeResult = await uploadFile(resume, "resume");

      let coverLetterResult: { url: string; filename: string } | null = null;
      if (coverLetter.file) {
        setUploadProgress("Uploading cover letter...");
        coverLetterResult = await uploadFile(coverLetter, "cover_letter");
      }

      setUploadProgress("Submitting application...");

      const formattedAnswers = role.questions.map((q) => ({
        question_id: q.id,
        question_text: q.label,
        question_type: q.type,
        answer: answers[q.id] || "",
      }));

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_slug: role.slug,
          full_name: personal.full_name.trim(),
          email: personal.email.trim(),
          phone: personal.phone.trim() || undefined,
          location: personal.location.trim() || undefined,
          portfolio_url: personal.portfolio_url.trim() || undefined,
          linkedin_url: personal.linkedin_url.trim() || undefined,
          github_url: personal.github_url.trim() || undefined,
          resume_url: resumeResult?.url,
          resume_filename: resumeResult?.filename,
          cover_letter_url: coverLetterResult?.url,
          cover_letter_filename: coverLetterResult?.filename,
          answers: formattedAnswers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      // Clear draft
      try {
        localStorage.removeItem(getStorageKey(role.slug));
      } catch {
        // ignore
      }

      setSubmitted(true);
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
      // Stay on the Review step so the user sees the error in context.
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const postedFormatted = React.useMemo(() => {
    try {
      return new Date(role.postedDate).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return role.postedDate;
    }
  }, [role.postedDate]);

  return (
    <PageTransition>
      <main id="main-content" className="pt-20">
        {/* Compact top band */}
        <Section spacing="sm">
          <Container>
            {/* Breadcrumb */}
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-xs text-[hsl(var(--color-foreground-muted))]">
                <li>
                  <Link href="/" className="hover:text-[hsl(var(--color-foreground))] transition-colors">Home</Link>
                </li>
                <li><span className="mx-1">/</span></li>
                <li>
                  <Link href="/careers" className="hover:text-[hsl(var(--color-foreground))] transition-colors">Careers</Link>
                </li>
                <li><span className="mx-1">/</span></li>
                <li>
                  <Link href={`/careers/${role.slug}`} className="hover:text-[hsl(var(--color-foreground))] transition-colors">{role.title}</Link>
                </li>
                <li><span className="mx-1">/</span></li>
                <li className="text-[hsl(var(--color-foreground))] font-medium">Apply</li>
              </ol>
            </nav>

            {/* Compact header row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1
                className="font-serif tracking-tight text-[hsl(var(--color-foreground))]"
                style={{ fontSize: "clamp(1.6rem, 2.6vw, 2rem)", lineHeight: 1.15, letterSpacing: "-0.01em" }}
              >
                <RevealText text={`Apply for ${role.title}`} mode="load" />
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="accent">{role.department}</Badge>
                <Badge variant="secondary">{role.location}</Badge>
                <Badge variant="secondary">{role.type}</Badge>
              </div>
            </div>
          </Container>
        </Section>

        {/* Main content area */}
        <Section spacing="md">
          <Container>
            <div className="lg:grid lg:grid-cols-12 gap-10">
              {/* Left column: form */}
              <div ref={formTopRef} className="lg:col-span-8 scroll-mt-24">
                {/* Mobile role summary accordion */}
                <div className="lg:hidden mb-8">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="w-full flex items-center justify-between p-4 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl text-sm hover:border-[hsl(var(--color-foreground))] transition-colors duration-200"
                  >
                    <span className="text-[hsl(var(--color-foreground-muted))]">
                      Applying for <span className="font-semibold text-[hsl(var(--color-foreground))]">{role.title}</span>
                    </span>
                    <svg
                      className={`w-4 h-4 text-[hsl(var(--color-foreground-muted))] transition-transform duration-200 ${sidebarOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <RoleSummaryContent role={role} postedDate={postedFormatted} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Progress indicator */}
                {!submitted && (
                  <AnimatedSection>
                    <ProgressIndicator currentStep={step} onStepClick={goToStep} />
                  </AnimatedSection>
                )}

                {/* Persistent screen-reader announcement of the current step.
                    Always rendered so SR/AT reliably picks up text changes. */}
                <div role="status" aria-live="polite" className="sr-only">
                  {submitted
                    ? "Application submitted."
                    : isSubmitting
                    ? uploadProgress || "Submitting application."
                    : `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}. ${STEP_SUBTITLES[step]}`}
                </div>

                {/* Form steps */}
                <AnimatePresence mode="wait">
                  {step === 0 && !submitted && (
                    <StepWrapper key="personal">
                      <StepHeading title="Personal information" subtitle={STEP_SUBTITLES[0]} />
                      <StepPersonal
                        personal={personal}
                        setPersonal={setPersonal}
                        errors={errors}
                        setErrors={setErrors}
                      />
                      <StepNav step={step} totalSteps={STEPS.length} onNext={goNext} />
                    </StepWrapper>
                  )}

                  {step === 1 && !submitted && (
                    <StepWrapper key="questions">
                      <StepHeading title="A few questions" subtitle={STEP_SUBTITLES[1]} />
                      <StepQuestions
                        questions={role.questions}
                        answers={answers}
                        setAnswers={setAnswers}
                        errors={errors}
                        setErrors={setErrors}
                      />
                      <StepNav step={step} totalSteps={STEPS.length} onPrev={goPrev} onNext={goNext} />
                    </StepWrapper>
                  )}

                  {step === 2 && !submitted && (
                    <StepWrapper key="files">
                      <StepHeading title="Upload your documents" subtitle={STEP_SUBTITLES[2]} />
                      <StepFiles
                        resume={resume}
                        coverLetter={coverLetter}
                        onResumeChange={(e) => handleFileSelect(e, setResume, "resume")}
                        onCoverLetterChange={(e) => handleFileSelect(e, setCoverLetter, "cover_letter")}
                        onRemoveResume={() => setResume({ file: null, url: "", filename: "" })}
                        onRemoveCoverLetter={() => setCoverLetter({ file: null, url: "", filename: "" })}
                        errors={errors}
                      />
                      <StepNav step={step} totalSteps={STEPS.length} onPrev={goPrev} onNext={goNext} />
                    </StepWrapper>
                  )}

                  {step === 3 && !submitted && (
                    <StepWrapper key="review">
                      <StepHeading title="Review your application" subtitle={STEP_SUBTITLES[3]} />
                      <StepReview
                        personal={personal}
                        answers={answers}
                        questions={role.questions}
                        resume={resume}
                        coverLetter={coverLetter}
                        onEditStep={setStep}
                      />
                      {errors.submit && (
                        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                          {errors.submit}
                        </div>
                      )}
                      <StepNav step={step} totalSteps={STEPS.length} onPrev={goPrev} onSubmit={handleSubmit} />
                    </StepWrapper>
                  )}

                  {submitted && (
                    <StepWrapper key="success">
                      <SuccessScreen firstName={personal.full_name.split(" ")[0]} roleTitle={role.title} />
                    </StepWrapper>
                  )}
                </AnimatePresence>
              </div>

              {/* Right column: sticky sidebar (desktop only) */}
              <div className="hidden lg:block lg:col-span-4">
                <div className="lg:sticky lg:top-24">
                  <RoleSummaryCard role={role} postedDate={postedFormatted} />
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <AnimatePresence>
          {isSubmitting && <SubmittingOverlay progress={uploadProgress} />}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
}

// ── Progress Indicator ──

function ProgressIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="mb-10">
      {/* Row with circles + connectors — fixed height, all circles perfectly aligned */}
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {STEPS.map((label, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          const isUpcoming = i > currentStep;

          return (
            <React.Fragment key={label}>
              <button
                type="button"
                onClick={() => onStepClick(i)}
                disabled={isUpcoming}
                className={`relative flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                  isCompleted ? "hover:scale-110 cursor-pointer" : ""
                } ${isUpcoming ? "cursor-default" : ""}`}
                aria-label={`Step ${i + 1}: ${label}`}
                aria-current={isActive ? "step" : undefined}
              >
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors duration-200 ${
                    isActive
                      ? "bg-[hsl(var(--color-foreground))] border-[hsl(var(--color-foreground))] text-[hsl(var(--color-background))]"
                      : isCompleted
                      ? "bg-[hsl(var(--color-foreground))]/10 border-[hsl(var(--color-foreground))]/30 text-[hsl(var(--color-foreground))]"
                      : "bg-transparent border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground-muted))]"
                  }`}
                  layout
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isCompleted ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </motion.div>
              </button>
              {/* Connector line between circles */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1.5">
                  <div className="h-full rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[hsl(var(--color-foreground))]/30 rounded-full"
                      initial={false}
                      animate={{ width: i < currentStep ? "100%" : "0%" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current step label — centered below, outside the circle row so it never
          affects circle alignment */}
      <div className="mt-3 text-center">
        <span className="text-xs font-medium tracking-wide text-[hsl(var(--color-foreground))]">
          {STEPS[currentStep]}
          <span className="text-[hsl(var(--color-foreground-subtle))] font-normal ml-2">
            · Step {currentStep + 1} of {STEPS.length}
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Role Summary Card (desktop sidebar) ──

function RoleSummaryCard({ role, postedDate }: { role: Role; postedDate: string }) {
  return (
    <div className="bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-2xl p-6 shadow-sm">
      <RoleSummaryContent role={role} postedDate={postedDate} />
    </div>
  );
}

function RoleSummaryContent({ role, postedDate }: { role: Role; postedDate: string }) {
  return (
    <div className="p-4 lg:p-0">
      <p className="text-[10px] uppercase font-mono tracking-[0.06em] text-[hsl(var(--color-foreground-muted))] font-medium mb-2">
        Applying for
      </p>
      <h3 className="font-serif text-xl tracking-tight text-[hsl(var(--color-foreground))] mb-4">
        {role.title}
      </h3>

      <div className="space-y-2 mb-5">
        <MetaRow label="Department" value={role.department} />
        <MetaRow label="Location" value={role.location} />
        <MetaRow label="Type" value={role.type} />
      </div>

      <div className="border-t border-[hsl(var(--color-border))] pt-4 mb-5">
        <p className="text-xs font-semibold text-[hsl(var(--color-foreground))] mb-2">Key responsibilities</p>
        <ul className="space-y-1.5">
          {role.responsibilities.slice(0, 3).map((r) => (
            <li key={r} className="flex items-start gap-2 text-xs text-[hsl(var(--color-foreground-muted))]">
              <span className="mt-1 w-1 h-1 rounded-full bg-[hsl(var(--color-foreground-muted))] shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-[hsl(var(--color-border))] pt-4">
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">
          Posted {postedDate}
        </p>
        <Link
          href={`/careers/${role.slug}`}
          className="inline-block mt-3 text-xs text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors underline underline-offset-2"
        >
          Back to role details
        </Link>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[hsl(var(--color-foreground-subtle))]">{label}</span>
      <span className="text-[hsl(var(--color-foreground))] font-medium">{value}</span>
    </div>
  );
}

// ── Submitting Overlay ──

function SubmittingOverlay({ progress }: { progress: string | null }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--color-background))]/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[hsl(var(--color-border))]" />
          <div className="animate-spin absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-[hsl(var(--color-foreground))]" />
        </div>
        <p className="text-[hsl(var(--color-foreground-muted))] animate-pulse">
          {progress || "Submitting..."}
        </p>
      </div>
    </motion.div>
  );
}

// ── Success Screen ──

function SuccessScreen({ firstName, roleTitle }: { firstName: string; roleTitle: string }) {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[hsl(var(--color-foreground))]/20 mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
      >
        <motion.svg
          className="w-7 h-7 text-[hsl(var(--color-foreground))]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </motion.svg>
      </motion.div>
      <motion.h2
        className="font-serif text-2xl md:text-3xl tracking-tight mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Thanks {firstName}, we have your application.
      </motion.h2>
      <motion.p
        className="text-[hsl(var(--color-foreground-muted))] max-w-md mx-auto mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        You applied for <strong>{roleTitle}</strong> at Craefto.
      </motion.p>
      <motion.p
        className="text-[hsl(var(--color-foreground-subtle))] text-sm max-w-md mx-auto mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        We review every application carefully. Expect to hear from us within a week.
      </motion.p>
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button asChild>
          <Link href="/careers">View other roles</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Back to Craefto</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ── Step wrapper with animation ──

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

// ── Step heading ──

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-[hsl(var(--color-foreground))] mb-1.5">
        {title}
      </h2>
      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">{subtitle}</p>
    </div>
  );
}

// ── Step navigation ──

function StepNav({
  step,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
}: {
  step: number;
  totalSteps: number;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
}) {
  return (
    <div className="mt-10 pt-6 border-t border-[hsl(var(--color-border))]">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Back button (or spacer) */}
        <div className="flex-shrink-0">
          {onPrev ? (
            <Button variant="ghost" onClick={onPrev}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          ) : (
            <div />
          )}
        </div>

        {/* Right: Continue or Submit */}
        <div className="flex-shrink-0">
          {onNext && (
            <Button onClick={onNext}>
              Continue
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
          {onSubmit && (
            <Button variant="accent" onClick={onSubmit}>
              Submit application
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Step counter — centered below, hidden on mobile (redundant with progress bar) */}
      <p className="hidden sm:block text-center mt-4 text-xs text-[hsl(var(--color-foreground-subtle))]">
        Step {step + 1} of {totalSteps} · {STEPS[step]}
      </p>
    </div>
  );
}

// ── Step 1: Personal info ──

function StepPersonal({
  personal,
  setPersonal,
  errors,
  setErrors,
}: {
  personal: PersonalInfo;
  setPersonal: React.Dispatch<React.SetStateAction<PersonalInfo>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
}) {
  const update = (field: keyof PersonalInfo, value: string) => {
    setPersonal((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  return (
    <div className="space-y-5">
      <FormField label="Full name" htmlFor="apply-full-name" required error={errors.full_name}>
        <input
          id="apply-full-name"
          type="text"
          value={personal.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="Your full name"
          className={inputClass(errors.full_name)}
          autoFocus
          autoComplete="name"
        />
      </FormField>
      <FormField label="Email address" htmlFor="apply-email" required error={errors.email}>
        <input
          id="apply-email"
          type="email"
          value={personal.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@example.com"
          className={inputClass(errors.email)}
          autoComplete="email"
        />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Phone" htmlFor="apply-phone">
          <input
            id="apply-phone"
            type="tel"
            value={personal.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+61 ..."
            className={inputClass()}
            autoComplete="tel"
          />
        </FormField>
        <FormField label="City / Country" htmlFor="apply-location">
          <input
            id="apply-location"
            type="text"
            value={personal.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Sydney, Australia"
            className={inputClass()}
            autoComplete="address-level2"
          />
        </FormField>
      </div>
      <FormField label="Portfolio URL" htmlFor="apply-portfolio">
        <input
          id="apply-portfolio"
          type="url"
          value={personal.portfolio_url}
          onChange={(e) => update("portfolio_url", e.target.value)}
          placeholder="https://yourportfolio.com"
          className={inputClass()}
          autoComplete="url"
        />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="LinkedIn" htmlFor="apply-linkedin">
          <input
            id="apply-linkedin"
            type="url"
            value={personal.linkedin_url}
            onChange={(e) => update("linkedin_url", e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className={inputClass()}
            autoComplete="url"
          />
        </FormField>
        <FormField label="GitHub" htmlFor="apply-github">
          <input
            id="apply-github"
            type="url"
            value={personal.github_url}
            onChange={(e) => update("github_url", e.target.value)}
            placeholder="https://github.com/..."
            className={inputClass()}
            autoComplete="url"
          />
        </FormField>
      </div>
    </div>
  );
}

// ── Step 2: Questions ──

function StepQuestions({
  questions,
  answers,
  setAnswers,
  errors,
  setErrors,
}: {
  questions: ApplicationQuestion[];
  answers: Record<string, string | string[]>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
}) {
  const update = (id: string, value: string | string[]) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    if (errors[id]) setErrors((e) => { const n = { ...e }; delete n[id]; return n; });
  };

  return (
    <div className="space-y-7">
      {questions.map((q) => {
        const labelId = `q-${q.id}-label`;
        const inputId = `q-${q.id}`;
        const isFreeText =
          q.type === "short-text" ||
          q.type === "long-text" ||
          q.type === "compensation";

        return (
          <FormField
            key={q.id}
            label={q.label}
            required={q.required}
            helperText={q.helperText}
            error={errors[q.id]}
            labelId={labelId}
            htmlFor={isFreeText ? inputId : undefined}
          >
            {q.type === "single-select" && q.options && (
              <div
                role="radiogroup"
                aria-labelledby={labelId}
                className="flex flex-wrap gap-2.5"
              >
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update(q.id, opt)}
                      className={chipClass(selected)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "multi-select" && q.options && (
              <div
                role="group"
                aria-labelledby={labelId}
                className="flex flex-wrap gap-2.5"
              >
                {q.options.map((opt) => {
                  const selected =
                    Array.isArray(answers[q.id]) &&
                    (answers[q.id] as string[]).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => {
                        const current = (Array.isArray(answers[q.id])
                          ? answers[q.id]
                          : []) as string[];
                        update(
                          q.id,
                          selected ? current.filter((v) => v !== opt) : [...current, opt]
                        );
                      }}
                      className={chipClass(selected)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "compensation" && (
              <CompensationField
                amountId={inputId}
                value={(answers[q.id] as string) || ""}
                onChange={(val) => update(q.id, val)}
                error={errors[q.id]}
              />
            )}

            {q.type === "short-text" && (
              <input
                id={inputId}
                type="text"
                value={(answers[q.id] as string) || ""}
                onChange={(e) => update(q.id, e.target.value)}
                placeholder={q.placeholder}
                className={inputClass(errors[q.id])}
              />
            )}

            {q.type === "long-text" && (
              <div>
                <textarea
                  id={inputId}
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => update(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={4}
                  className={`${inputClass(errors[q.id])} resize-y min-h-[120px]`}
                />
                {q.maxLength && (
                  <div className="flex justify-end mt-1.5">
                    <span
                      className={`text-xs ${
                        ((answers[q.id] as string) || "").length > q.maxLength
                          ? "text-red-500"
                          : "text-[hsl(var(--color-foreground-subtle))]"
                      }`}
                    >
                      {((answers[q.id] as string) || "").length} / {q.maxLength}
                    </span>
                  </div>
                )}
              </div>
            )}
          </FormField>
        );
      })}
    </div>
  );
}

// ── Compensation Field ──

function CompensationField({
  amountId,
  value,
  onChange,
  error,
}: {
  amountId: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  // Parse existing value like "100 AUD / hour"
  const parts = value.split(" ");
  const amount = parts[0] || "";
  const currency = (parts[1] as typeof CURRENCIES[number]) || "AUD";
  const period = (parts[3] as typeof PERIODS[number]) || "hour";

  const buildValue = (a: string, c: string, p: string) => {
    if (!a) return "";
    return `${a} ${c} / ${p}`;
  };

  return (
    <div
      className={`flex items-stretch rounded-xl border overflow-hidden bg-[hsl(var(--color-background-muted))]/70 hover:bg-[hsl(var(--color-background-muted))] transition-all duration-300 ease-out ${
        error
          ? "border-red-500/60 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/15"
          : "border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-foreground))]/40 focus-within:border-[hsl(var(--color-foreground))] focus-within:ring-4 focus-within:ring-[hsl(var(--color-foreground))]/10 focus-within:shadow-[0_4px_24px_-8px_hsl(var(--color-foreground)/0.15)]"
      }`}
    >
      <input
        id={amountId}
        type="number"
        min="0"
        value={amount}
        onChange={(e) => onChange(buildValue(e.target.value, currency, period))}
        placeholder="0"
        aria-label="Amount"
        className="w-28 flex-shrink-0 px-4 py-4 bg-transparent text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="w-px bg-[hsl(var(--color-border))]" />
      <select
        value={currency}
        onChange={(e) => onChange(buildValue(amount, e.target.value, period))}
        aria-label="Currency"
        className="px-3 py-4 bg-transparent text-[hsl(var(--color-foreground))] text-sm focus:outline-none cursor-pointer appearance-none"
        style={{ backgroundImage: "none" }}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <div className="w-px bg-[hsl(var(--color-border))]" />
      <select
        value={period}
        onChange={(e) => onChange(buildValue(amount, currency, e.target.value))}
        aria-label="Period"
        className="flex-1 px-3 py-4 bg-transparent text-[hsl(var(--color-foreground))] text-sm focus:outline-none cursor-pointer appearance-none"
        style={{ backgroundImage: "none" }}
      >
        {PERIODS.map((p) => (
          <option key={p} value={p}>per {p}</option>
        ))}
      </select>
    </div>
  );
}

// ── Step 3: Files ──

function StepFiles({
  resume,
  coverLetter,
  onResumeChange,
  onCoverLetterChange,
  onRemoveResume,
  onRemoveCoverLetter,
  errors,
}: {
  resume: FileInfo;
  coverLetter: FileInfo;
  onResumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverLetterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveResume: () => void;
  onRemoveCoverLetter: () => void;
  errors: FormErrors;
}) {
  return (
    <div className="space-y-7">
      <FormField label="Resume" htmlFor="resume-upload" required error={errors.resume}>
        <FileUploadZone
          file={resume}
          onChange={onResumeChange}
          onRemove={onRemoveResume}
          id="resume-upload"
        />
      </FormField>

      <FormField label="Cover letter" htmlFor="cover-letter-upload" helperText="Optional but recommended">
        <FileUploadZone
          file={coverLetter}
          onChange={onCoverLetterChange}
          onRemove={onRemoveCoverLetter}
          id="cover-letter-upload"
        />
      </FormField>

      <p className="text-xs text-[hsl(var(--color-foreground-subtle))] italic">
        Accepted formats: PDF, DOC, DOCX. Max 10 MB per file.
      </p>
    </div>
  );
}

function FileUploadZone({
  file,
  onChange,
  onRemove,
  id,
}: {
  file: FileInfo;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  id: string;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (file.filename) {
    return (
      <div className="flex items-center gap-4 p-4 bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl">
        <svg className="w-6 h-6 text-[hsl(var(--color-foreground))] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[hsl(var(--color-foreground))] truncate font-medium">{file.filename}</p>
          {file.file && (
            <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">{formatFileSize(file.file.size)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors underline underline-offset-2"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-[hsl(var(--color-foreground-subtle))] hover:text-red-500 transition-colors underline underline-offset-2"
          >
            Remove
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={onChange}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <label
      htmlFor={id}
      className="flex flex-col items-center justify-center gap-3 min-h-[160px] border-2 border-dashed border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-muted))] hover:bg-[hsl(var(--color-border))] rounded-xl cursor-pointer hover:border-[hsl(var(--color-foreground))] transition-colors duration-200"
    >
      <svg className="w-10 h-10 text-[hsl(var(--color-foreground-subtle))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <div className="text-center">
        <span className="text-sm font-semibold text-[hsl(var(--color-foreground))]">Click to upload</span>
        <br />
        <span className="text-xs text-[hsl(var(--color-foreground-muted))]">or drag and drop</span>
      </div>
      <input
        id={id}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={onChange}
        className="hidden"
      />
    </label>
  );
}

// ── Step 4: Review ──

function StepReview({
  personal,
  answers,
  questions,
  resume,
  coverLetter,
  onEditStep,
}: {
  personal: PersonalInfo;
  answers: Record<string, string | string[]>;
  questions: ApplicationQuestion[];
  resume: FileInfo;
  coverLetter: FileInfo;
  onEditStep: (step: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Personal */}
      <ReviewSection title="Personal information" onEdit={() => onEditStep(0)}>
        <ReviewRow label="Name" value={personal.full_name} />
        <ReviewRow label="Email" value={personal.email} />
        {personal.phone && <ReviewRow label="Phone" value={personal.phone} />}
        {personal.location && <ReviewRow label="Location" value={personal.location} />}
        {personal.portfolio_url && <ReviewRow label="Portfolio" value={personal.portfolio_url} />}
        {personal.linkedin_url && <ReviewRow label="LinkedIn" value={personal.linkedin_url} />}
        {personal.github_url && <ReviewRow label="GitHub" value={personal.github_url} />}
      </ReviewSection>

      {/* Questions */}
      <ReviewSection title="Qualifying answers" onEdit={() => onEditStep(1)}>
        {questions.map((q) => {
          const val = answers[q.id];
          const display = Array.isArray(val) ? val.join(", ") : val || "--";
          return <ReviewRow key={q.id} label={q.label} value={display} />;
        })}
      </ReviewSection>

      {/* Files */}
      <ReviewSection title="Documents" onEdit={() => onEditStep(2)}>
        <ReviewRow label="Resume" value={resume.filename || "Not uploaded"} />
        <ReviewRow label="Cover letter" value={coverLetter.filename || "Not uploaded"} />
      </ReviewSection>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[hsl(var(--color-background-subtle))] border border-[hsl(var(--color-border))] rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-lg tracking-tight text-[hsl(var(--color-foreground))]">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] underline underline-offset-2 transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[hsl(var(--color-foreground-subtle))]">{label}</p>
      <p className="text-sm text-[hsl(var(--color-foreground))] whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

// ── Shared utilities ──

function FormField({
  label,
  htmlFor,
  labelId,
  required,
  helperText,
  error,
  children,
}: {
  label: string;
  /** id of the input the label refers to. Required for proper a11y on
   *  single-input fields. Omit only when wrapping a group of controls
   *  (chip selects, multi-input compounds), and pair with `labelId`. */
  htmlFor?: string;
  /** Stable id for the label element so groups of controls can reference
   *  it via `aria-labelledby`. */
  labelId?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        id={labelId}
        className="block text-sm font-semibold tracking-tight text-[hsl(var(--color-foreground))] mb-2"
      >
        {label}
        {required && <span className="text-[hsl(var(--color-foreground-muted))] ml-1">*</span>}
      </label>
      {helperText && (
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))] mb-2 italic">{helperText}</p>
      )}
      {children}
      {/* Always-rendered live region — text-only updates are reliably
          announced by screen readers, unlike conditionally inserted nodes. */}
      <p
        className={`text-xs text-red-500 mt-1.5 ${error ? "" : "sr-only"}`}
        role="alert"
        aria-live="polite"
      >
        {error || ""}
      </p>
    </div>
  );
}

function inputClass(error?: string) {
  return `w-full px-4 py-4 bg-[hsl(var(--color-background))] border ${
    error
      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/15"
      : "border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-foreground))]/40 focus:border-[hsl(var(--color-foreground))] focus:ring-[hsl(var(--color-foreground))]/10 focus:shadow-[0_4px_24px_-8px_hsl(var(--color-foreground)/0.15)]"
  } rounded-xl text-sm text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-foreground-subtle))] focus:outline-none focus:ring-4 transition-all duration-300 ease-out`;
}
