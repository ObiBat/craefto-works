"use client";

import * as React from "react";
import { formatPrice, monthlyPlans, priceRanges } from "@/lib/pricing";
import { ENQUIRY_GROUPS, ENQUIRY_PRESELECT, ENQUIRY_UNSURE, PLAN_PROJECT_TYPE, enquiryPlan, enquiryPriceRange } from "@/lib/enquiry";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { RevealText } from "@/components/editorial/reveal-text";
import { capabilities, type CapabilityId } from "@/content/capabilities";
import { cn } from "@/lib/utils";

// The first question: which capability the enquiry is about, shown as five
// equal choices plus "a mix". Each maps to the enquiry values in
// lib/enquiry.ts that leads and admin read; Product asks one more thing.
type Choice = CapabilityId | "other";
const CHOICES = capabilities.map((capability) => ({
  id: capability.id as Choice,
  number: capability.number,
  name: capability.name,
  scope: capability.scope,
  types: ENQUIRY_GROUPS.find((group) => group.capability === capability.name)?.types ?? [],
}));
const MIX = {
  id: "other" as Choice,
  number: "01\u201305",
  name: "A mix, or not sure yet",
  scope: "Tell us what you have in mind and we\u2019ll suggest where to start.",
  types: [ENQUIRY_UNSURE],
};
const choiceOf = (value: string | undefined): Choice | null =>
  [...CHOICES, MIX].find((choice) => choice.types.some((type) => type.value === value))?.id ?? null;

// What to tell us, by choice.
const PROMPTS: Record<Choice | "none", string> = {
  brand: "Where is the business today, and what does the brand need to do? A new identity, a refresh or a design system?",
  product: "What should it do, and who is it for? Links to anything that exists today help.",
  systems: "Which work takes up your team\u2019s time? The tools you use and the steps involved help.",
  media: "What is the shoot or the film for, where will it run, and are there dates that matter?",
  growth: "Who do you want to reach, and what should they do? Any campaigns or numbers so far?",
  other: "Tell us what you have in mind, your goals and any dates that matter. A few sentences is enough.",
  none: "Tell us what you have in mind, your goals and any dates that matter. A few sentences is enough.",
};

// The smallest published project and the span of the monthly plans
// (lib/pricing.ts), for the budget hint.
const FORM_MINIMUM = Math.min(...priceRanges.map((range) => range.min));
const PLAN_MIN = Math.min(...monthlyPlans.map((plan) => plan.price));
const PLAN_MAX = Math.max(...monthlyPlans.map((plan) => plan.price));
const aud = (amount: number) => `A${formatPrice(amount)}`;

// Suggested budgets based on project type: the bracket around the middle of
// its published range.
const BUDGET_SUGGESTIONS: Record<string, string> = {
  brand: "3-5k",
  web: "5-10k",
  saas: "10-25k",
  ai: "5-10k",
  media: "3-5k",
  growth: "under-3k",
  other: "discuss",
};

// Timeline suggestions based on project type
const TIMELINE_SUGGESTIONS: Record<string, string> = {
  brand: "1-3months",
  web: "1-3months",
  saas: "1-3months",
  ai: "1-3months",
  media: "1-3months",
  growth: "1-3months",
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
  else if (projectType === "brand" || projectType === "media" || projectType === "growth") score += 1;
  
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
  projectType: z.string().min(1, "Please choose what you need"),
  budget: z.string().min(1, "Please select a budget range"),
  timeline: z.string().min(1, "Please select a timeline"),
  message: z.string().min(20, "Please tell us a little more (at least 20 characters)"),
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
  // A monthly plan's button links here with ?plan=…
  const preselectedPlan = enquiryPlan(searchParams.get("plan"));
  const defaultProjectType = preselectedPlan
    ? PLAN_PROJECT_TYPE[preselectedPlan.id]
    : preselectedService
      ? ENQUIRY_PRESELECT[preselectedService] || ""
      : "";

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
      budget: preselectedPlan ? "monthly" : defaultProjectType ? BUDGET_SUGGESTIONS[defaultProjectType] : "",
      timeline: preselectedPlan ? "" : defaultProjectType ? TIMELINE_SUGGESTIONS[defaultProjectType] : "",
      message: preselectedPlan ? `I\u2019m interested in the ${preselectedPlan.name} plan.` : "",
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
  const choice = choiceOf(watchedProjectType);
  const chosen = [...CHOICES, MIX].find((entry) => entry.id === choice);
  const choose = (next: Choice) => {
    if (next === choice) return;
    const entry = [...CHOICES, MIX].find((option) => option.id === next)!;
    setValue("projectType", entry.types[0].value, { shouldValidate: true, shouldDirty: true });
  };

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
            Thanks for getting in touch. We&apos;ll reply within one to two days.
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
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[hsl(var(--color-background-subtle))]">
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
            Full enquiry
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
              placeholder="A line or two is enough: a brand, a shoot, a website, an app, an automation or a campaign."
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

    {/* What do you need? Five capabilities, equally, and "a mix". */}
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-[hsl(var(--color-foreground))]">
        What do you need? <span className="text-[hsl(var(--color-error))]">*</span>
      </legend>
      <p className="text-sm text-[hsl(var(--color-foreground-muted))]">
        Choose the closest. If it&apos;s a mix, pick the main one and tell us the rest below.
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        {[...CHOICES, MIX].map((option) => {
          const selected = choice === option.id;
          return (
            <label key={option.id} className="group relative block cursor-pointer">
              <input
                type="radio"
                name="capability"
                value={option.id}
                checked={selected}
                onChange={() => choose(option.id)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-full flex-col gap-1.5 rounded-2xl p-3.5 sm:p-4 transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-[hsl(var(--color-accent))] peer-focus-visible:ring-offset-2",
                  selected
                    ? "bg-[hsl(var(--color-accent-subtle))]"
                    : "bg-[hsl(var(--color-background-subtle))] group-hover:bg-[hsl(var(--color-accent-subtle)/0.6)]",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs tabular-nums text-[hsl(var(--color-accent))]">{option.number}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full transition-colors duration-300",
                      selected ? "bg-[hsl(var(--color-accent))] text-white" : "bg-[hsl(var(--color-background))] text-transparent",
                    )}
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </span>
                <span className={cn("font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight", selected && "text-[hsl(var(--color-accent))]")}>
                  {option.name}
                </span>
                <span className="hidden text-sm leading-snug text-[hsl(var(--color-foreground-muted))] sm:block">{option.scope}</span>
              </span>
            </label>
          );
        })}
      </div>
      {chosen && chosen.types.length > 1 && (
        <div role="radiogroup" aria-label={`Which kind of ${chosen.name.toLowerCase()} work?`} className="flex flex-wrap gap-2 pt-1">
          {chosen.types.map((type) => (
            <label key={type.value} className="cursor-pointer">
              <input
                type="radio"
                name="projectTypeDetail"
                value={type.value}
                checked={watchedProjectType === type.value}
                onChange={() => setValue("projectType", type.value, { shouldValidate: true, shouldDirty: true })}
                className="peer sr-only"
              />
              <span className="inline-flex rounded-full bg-[hsl(var(--color-background-subtle))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-foreground-muted))] transition-colors duration-300 peer-checked:bg-[hsl(var(--color-accent))] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[hsl(var(--color-accent))] peer-focus-visible:ring-offset-2">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      )}
      <input type="hidden" {...register("projectType")} />
      {errors.projectType && (
        <p className="text-sm text-[hsl(var(--color-error))]">{errors.projectType.message}</p>
      )}
    </fieldset>

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

    {/* Budget and timeline */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label
          htmlFor="budget"
          className="text-sm font-medium text-[hsl(var(--color-foreground))]"
        >
          Budget range <span className="text-[hsl(var(--color-error))]">*</span>
        </label>
        <Select id="budget" error={!!errors.budget} {...register("budget")}>
          <option value="">Select one</option>
          <option value="under-3k">Under A$3k</option>
          <option value="3-5k">A$3k – A$5k</option>
          <option value="5-10k">A$5k – A$10k</option>
          <option value="10-25k">A$10k – A$25k</option>
          <option value="25-50k">A$25k – A$50k</option>
          <option value="50k+">A$50k+</option>
          <option value="monthly">Monthly plan</option>
          <option value="discuss">Let&apos;s discuss</option>
        </Select>
        <p className="text-xs text-[hsl(var(--color-foreground-subtle))]" aria-live="polite">
          {(() => {
            if (watchedBudget === "monthly") return `Monthly plans run ${aud(PLAN_MIN)} to ${aud(PLAN_MAX)} a month.`;
            const range = enquiryPriceRange(watchedProjectType);
            if (range) return `${range.label} projects usually run ${aud(range.min)} to ${aud(range.max)}.`;
            return `Minimum project investment: ${aud(FORM_MINIMUM)}`;
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
        Tell us about it{" "}
        <span className="text-[hsl(var(--color-error))]">*</span>
      </label>
      <Textarea
        id="message"
        placeholder={PROMPTS[choice ?? "none"]}
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
              Send enquiry
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
