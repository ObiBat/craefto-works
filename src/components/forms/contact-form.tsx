"use client";

import * as React from "react";
import { formatPrice, priceFor, type ServiceKey } from "@/lib/pricing";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { RevealText } from "@/components/editorial/reveal-text";

// Service to project type mapping
const SERVICE_MAP: Record<string, string> = {
  brand: "brand",
  web: "web",
  product: "saas",
  ai: "ai",
  security: "other",
};

// Form project types → published price ranges (lib/pricing.ts).
const PROJECT_PRICING: Record<string, ServiceKey> = { brand: "brand", web: "web", saas: "product", ai: "ai" };
const FORM_MINIMUM = Math.min(...Object.values(PROJECT_PRICING).map((key) => priceFor(key)?.min ?? Infinity));
const aud = (amount: number) => `A${formatPrice(amount)}`;

// Suggested budgets based on project type
const BUDGET_SUGGESTIONS: Record<string, string> = {
  brand: "5-10k",
  web: "10-25k",
  saas: "25-50k",
  ai: "10-25k",
  other: "discuss",
};

// Timeline suggestions based on project type
const TIMELINE_SUGGESTIONS: Record<string, string> = {
  brand: "1-3months",
  web: "1-3months",
  saas: "3-6months",
  ai: "1-3months",
  other: "flexible",
};

// Complexity indicator logic
function getComplexityScore(
  projectType: string,
  budget: string,
  timeline: string,
  messageLength: number
): { score: number; label: string; color: string } {
  let score = 0;
  
  // Project type scoring
  if (projectType === "saas") score += 3;
  else if (projectType === "ai") score += 2;
  else if (projectType === "web") score += 1;
  else if (projectType === "brand") score += 1;
  
  // Budget scoring (higher budget = more complex usually)
  if (budget === "50k+") score += 3;
  else if (budget === "25-50k") score += 2;
  else if (budget === "10-25k") score += 1;
  
  // Timeline scoring (shorter = more urgent, could be simpler or rush)
  if (timeline === "asap") score += 1;
  else if (timeline === "3-6months") score += 2;
  
  // Message length (longer = more thought out = potentially more complex)
  if (messageLength > 200) score += 1;
  if (messageLength > 400) score += 1;
  
  if (score <= 2) return { score, label: "Simple", color: "text-green-600" };
  if (score <= 4) return { score, label: "Moderate", color: "text-yellow-600" };
  if (score <= 6) return { score, label: "Complex", color: "text-orange-600" };
  return { score, label: "Enterprise", color: "text-purple-600" };
}

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  company: z.string().optional(),
  projectType: z.string().min(1, "Please select a project type"),
  budget: z.string().min(1, "Please select a budget range"),
  timeline: z.string().min(1, "Please select a timeline"),
  message: z.string().min(20, "Please tell us more about your project (at least 20 characters)"),
});

const quickInquirySchema = z.object({
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Please enter at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;
type QuickInquiryData = z.infer<typeof quickInquirySchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [quickMode, setQuickMode] = React.useState(false);
  // Only a switch between the two forms animates; the first paint doesn't.
  const [hasSwitched, setHasSwitched] = React.useState(false);
  const switchMode = (quick: boolean) => {
    if (quick === quickMode) return;
    setHasSwitched(true);
    setQuickMode(quick);
  };
  const honeypotRef = React.useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  
  // Check for service pre-selection from URL
  const preselectedService = searchParams.get("service");
  const defaultProjectType = preselectedService ? SERVICE_MAP[preselectedService] || "" : "";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      projectType: defaultProjectType,
      budget: defaultProjectType ? BUDGET_SUGGESTIONS[defaultProjectType] : "",
      timeline: defaultProjectType ? TIMELINE_SUGGESTIONS[defaultProjectType] : "",
    },
  });

  const quickForm = useForm<QuickInquiryData>({
    resolver: zodResolver(quickInquirySchema),
  });

  // Watch form values for complexity indicator
  const watchedProjectType = useWatch({ control, name: "projectType" });
  const watchedBudget = useWatch({ control, name: "budget" });
  const watchedTimeline = useWatch({ control, name: "timeline" });
  const watchedMessage = useWatch({ control, name: "message" });

  const complexity = React.useMemo(() => {
    if (!watchedProjectType || !watchedBudget || !watchedTimeline) return null;
    return getComplexityScore(
      watchedProjectType,
      watchedBudget,
      watchedTimeline,
      watchedMessage?.length || 0
    );
  }, [watchedProjectType, watchedBudget, watchedTimeline, watchedMessage]);

  // Auto-suggest budget and timeline when project type changes
  React.useEffect(() => {
    if (watchedProjectType && !watchedBudget) {
      setValue("budget", BUDGET_SUGGESTIONS[watchedProjectType] || "");
    }
    if (watchedProjectType && !watchedTimeline) {
      setValue("timeline", TIMELINE_SUGGESTIONS[watchedProjectType] || "");
    }
  }, [watchedProjectType, watchedBudget, watchedTimeline, setValue]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company,
          service: data.projectType,
          budget: data.budget,
          timeline: data.timeline,
          message: data.message,
          // Honeypot for spam protection
          website_url: honeypotRef.current?.value || '',
          // UTM parameters for attribution
          utm_source: searchParams.get('utm_source'),
          utm_medium: searchParams.get('utm_medium'),
          utm_campaign: searchParams.get('utm_campaign'),
          utm_content: searchParams.get('utm_content'),
          landing_page: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      setIsSubmitted(true);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick inquiry submission
  const onQuickSubmit = async (data: QuickInquiryData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.email.split('@')[0], // Use email prefix as name
          email: data.email,
          message: data.message,
          service: 'other',
          budget: 'discuss',
          timeline: 'flexible',
          website_url: honeypotRef.current?.value || '',
          utm_source: searchParams.get('utm_source'),
          utm_medium: searchParams.get('utm_medium'),
          utm_campaign: searchParams.get('utm_campaign'),
          landing_page: typeof window !== 'undefined' ? window.location.pathname : null,
          is_quick_inquiry: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Something went wrong');
      setIsSubmitted(true);
      quickForm.reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="pop-in p-8 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-muted))] text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--color-success-subtle))] flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[hsl(var(--color-success))]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold"><RevealText text={"Message sent"} /></h3>
          <p className="text-[hsl(var(--color-foreground-muted))]">
            Thanks for reaching out. We&apos;ll be in touch within 24 hours.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setIsSubmitted(false);
              setQuickMode(false);
            }}
            className="mt-2"
          >
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--color-background-muted))] border border-[hsl(var(--color-border))]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !quickMode
                ? "bg-[hsl(var(--color-accent))] text-[hsl(var(--color-accent-foreground))]"
                : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
            }`}
          >
            Full inquiry
          </button>
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              quickMode
                ? "bg-[hsl(var(--color-accent))] text-[hsl(var(--color-accent-foreground))]"
                : "text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))]"
            }`}
          >
            Quick message
          </button>
        </div>
        {complexity && !quickMode && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">Project scope:</span>
            <span className={`text-sm font-medium ${complexity.color}`}>{complexity.label}</span>
          </div>
        )}
      </div>

      {/* The form is visible on first paint; after a switch, the new one
          slides in from the side it was chosen on (.form-swap-in). */}
      {quickMode ? (
        <form
          key="quick"
          onSubmit={quickForm.handleSubmit(onQuickSubmit)}
          className={hasSwitched ? "space-y-4 form-swap-in" : "space-y-4"}
          style={{ "--swap-from": "20px" } as React.CSSProperties}
        >
          <input
            ref={honeypotRef}
            type="text"
            name="website_url"
            autoComplete="off"
            tabIndex={-1}
            className="absolute -left-[9999px] opacity-0 pointer-events-none"
            aria-hidden="true"
          />

          {submitError && (
            <div className="p-4 rounded-lg border border-[hsl(var(--color-error)/0.3)] bg-[hsl(var(--color-error)/0.1)] text-[hsl(var(--color-error))]">
              <p className="text-sm">{submitError}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="quick-email" className="text-sm font-medium text-[hsl(var(--color-foreground))]">
              Email <span className="text-[hsl(var(--color-error))]">*</span>
            </label>
            <Input
              id="quick-email"
              type="email"
              placeholder="you@company.com"
              error={!!quickForm.formState.errors.email}
              {...quickForm.register("email")}
            />
            {quickForm.formState.errors.email && (
              <p className="text-sm text-[hsl(var(--color-error))]">{quickForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="quick-message" className="text-sm font-medium text-[hsl(var(--color-foreground))]">
              What&apos;s on your mind? <span className="text-[hsl(var(--color-error))]">*</span>
            </label>
            <Textarea
              id="quick-message"
              placeholder="Brief description of what you're looking for..."
              rows={4}
              error={!!quickForm.formState.errors.message}
              {...quickForm.register("message")}
            />
            {quickForm.formState.errors.message && (
              <p className="text-sm text-[hsl(var(--color-error))]">{quickForm.formState.errors.message.message}</p>
            )}
          </div>

          <Button type="submit" loading={isSubmitting}>
            Send quick message
          </Button>
        </form>
      ) : (
        <form
          key="full"
          onSubmit={handleSubmit(onSubmit)}
          className={hasSwitched ? "space-y-6 form-swap-in" : "space-y-6"}
          style={{ "--swap-from": "-20px" } as React.CSSProperties}
        >
          {/* Honeypot field - hidden from users, catches bots */}
          <input
            ref={honeypotRef}
            type="text"
            name="website_url"
            autoComplete="off"
            tabIndex={-1}
            className="absolute -left-[9999px] opacity-0 pointer-events-none"
            aria-hidden="true"
          />

          {/* Error message */}
          {submitError && (
            <div className="p-4 rounded-lg border border-[hsl(var(--color-error)/0.3)] bg-[hsl(var(--color-error)/0.1)] text-[hsl(var(--color-error))]">
              <p className="text-sm">{submitError}</p>
            </div>
          )}

    {/* Name & Email */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium text-[hsl(var(--color-foreground))]"
        >
          Name <span className="text-[hsl(var(--color-error))]">*</span>
        </label>
        <Input
          id="name"
          placeholder="Your name"
          error={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-[hsl(var(--color-error))]">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[hsl(var(--color-foreground))]"
        >
          Email <span className="text-[hsl(var(--color-error))]">*</span>
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          error={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-[hsl(var(--color-error))]">
            {errors.email.message}
          </p>
        )}
      </div>
    </div>

    {/* Company */}
    <div className="space-y-2">
      <label
        htmlFor="company"
        className="text-sm font-medium text-[hsl(var(--color-foreground))]"
      >
        Company
      </label>
      <Input
        id="company"
        placeholder="Your company (optional)"
        {...register("company")}
      />
    </div>

    {/* Project Type, Budget, Timeline */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="space-y-2">
        <label
          htmlFor="projectType"
          className="text-sm font-medium text-[hsl(var(--color-foreground))]"
        >
          Project type <span className="text-[hsl(var(--color-error))]">*</span>
        </label>
        <Select
          id="projectType"
          error={!!errors.projectType}
          {...register("projectType")}
        >
          <option value="">Select one</option>
          <option value="brand">Brand Identity</option>
          <option value="web">Web Design & Dev</option>
          <option value="saas">SaaS / Product</option>
          <option value="ai">AI / Automation</option>
          <option value="other">Not sure yet</option>
        </Select>
        {errors.projectType && (
          <p className="text-sm text-[hsl(var(--color-error))]">
            {errors.projectType.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="budget"
          className="text-sm font-medium text-[hsl(var(--color-foreground))]"
        >
          Budget range <span className="text-[hsl(var(--color-error))]">*</span>
        </label>
        <Select id="budget" error={!!errors.budget} {...register("budget")}>
          <option value="">Select one</option>
          <option value="3-5k">A$3k – A$5k</option>
          <option value="5-10k">A$5k – A$10k</option>
          <option value="10-25k">A$10k – A$25k</option>
          <option value="25-50k">A$25k – A$50k</option>
          <option value="50k+">A$50k+</option>
          <option value="discuss">Let&apos;s discuss</option>
        </Select>
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]" aria-live="polite">
          {(() => {
            const range = priceFor(PROJECT_PRICING[watchedProjectType] ?? "");
            return range
              ? `${range.label} projects usually run ${aud(range.min)} to ${aud(range.max)}.`
              : `Minimum project investment: ${aud(FORM_MINIMUM)}`;
          })()}
        </p>
        {errors.budget && (
          <p className="text-sm text-[hsl(var(--color-error))]">
            {errors.budget.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="timeline"
          className="text-sm font-medium text-[hsl(var(--color-foreground))]"
        >
          Timeline <span className="text-[hsl(var(--color-error))]">*</span>
        </label>
        <Select
          id="timeline"
          error={!!errors.timeline}
          {...register("timeline")}
        >
          <option value="">Select one</option>
          <option value="asap">ASAP</option>
          <option value="1-3months">1-3 months</option>
          <option value="3-6months">3-6 months</option>
          <option value="flexible">Flexible</option>
        </Select>
        {errors.timeline && (
          <p className="text-sm text-[hsl(var(--color-error))]">
            {errors.timeline.message}
          </p>
        )}
      </div>
    </div>

    {/* Message */}
    <div className="space-y-2">
      <label
        htmlFor="message"
        className="text-sm font-medium text-[hsl(var(--color-foreground))]"
      >
        What are you trying to build?{" "}
        <span className="text-[hsl(var(--color-error))]">*</span>
      </label>
      <Textarea
        id="message"
        placeholder="Tell us about your project, goals, and any relevant context..."
        rows={5}
        error={!!errors.message}
        {...register("message")}
      />
      {errors.message && (
        <p className="text-sm text-[hsl(var(--color-error))]">
          {errors.message.message}
        </p>
      )}
    </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full sm:w-auto"
              hoverText={
                <>
                  Let&apos;s go
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </>
              }
            >
              Send inquiry
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Button>
            
            {/* Complexity indicator (mobile) */}
            {complexity && (
              <div className="sm:hidden flex items-center gap-2">
                <span className="text-xs text-[hsl(var(--color-foreground-subtle))]">Project scope:</span>
                <span className={`text-sm font-medium ${complexity.color}`}>{complexity.label}</span>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
