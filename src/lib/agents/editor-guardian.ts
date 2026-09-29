import { createServerClient } from "@/lib/supabase";
import { BaseAgent, callLLM, parseJSONResponse } from "./base-agent";
import type {
  EditorGuardianInput,
  EditorGuardianOutput,
  ContentReview,
  ReviewVerdict,
} from "./types";

const SYSTEM_PROMPT = `You are an Editor Guardian agent for Craefto. You review content drafts with a critical eye, ensuring quality before publication.

Your review criteria:

1. READABILITY (0-100)
   - Clear, scannable structure
   - Appropriate sentence length variety
   - Jargon explained or avoided
   - Logical flow between sections

2. SEO (0-100)
   - Keywords naturally integrated
   - Meta title/description compelling
   - Headers follow hierarchy
   - Internal linking opportunities used

3. ORIGINALITY (0-100)
   - Unique perspective or angle
   - Not rehashing common advice
   - Fresh examples or insights
   - Adds to the conversation

4. ACCURACY (0-100)
   - Technical claims are correct
   - No misleading statements
   - Sources would support claims
   - Up-to-date information

5. BRAND VOICE (0-100)
   - Matches Craefto's voice: authoritative yet approachable
   - Practical and actionable
   - Confident without arrogance
   - Occasional wit, never forced

Verdict guidelines:
- APPROVE: Score >= 80 in all categories, no critical issues
- REVISE: Score 60-79 in any category, or non-critical issues to address
- REJECT: Score < 60 in any category, or critical issues present

Be specific in feedback. Quote the problematic text and suggest concrete improvements.`;

const USER_PROMPT_TEMPLATE = `Review this content draft:

TITLE: {{title}}
SUBTITLE: {{subtitle}}

CONTENT:
{{content}}

EXCERPT: {{excerpt}}

META:
- Title: {{metaTitle}}
- Description: {{metaDescription}}
- Keywords: {{keywords}}
- Word Count: {{wordCount}}

{{briefContext}}

{{brandGuidelines}}

Provide a comprehensive review as JSON:
{
  "verdict": "approve|revise|reject",
  "readability_score": 0-100,
  "seo_score": 0-100,
  "originality_score": 0-100,
  "accuracy_score": 0-100,
  "brand_voice_score": 0-100,
  "overall_score": 0-100,
  "summary": "2-3 sentence overall assessment",
  "strengths": ["string - what works well, 3-5 items"],
  "improvements": ["string - what could be better, 3-5 items"],
  "critical_issues": ["string - must-fix issues, if any"],
  "suggestions": [
    {
      "type": "grammar|style|clarity|seo|structure|fact_check",
      "location": "string - section/paragraph reference",
      "original": "string - the problematic text",
      "suggested": "string - the improved version",
      "reason": "string - why this change matters"
    }
  ]
}`;

export class EditorGuardianAgent extends BaseAgent<EditorGuardianInput, EditorGuardianOutput> {
  constructor() {
    super("editor_guardian");
  }

  protected async execute(input: EditorGuardianInput): Promise<EditorGuardianOutput> {
    const supabase = createServerClient();
    const { draft, brief, brand_guidelines } = input;

    // Build brief context if available
    let briefContext = "";
    if (brief) {
      briefContext = `BRIEF CONTEXT:
Working Title: ${brief.working_title}
Target Audience: ${brief.target_audience || "Not specified"}
Thesis: ${brief.thesis_statement || "Not specified"}
Key Takeaways Expected:
${brief.key_takeaways.map((t) => `- ${t}`).join("\n")}`;
    }

    // Build brand guidelines section
    const brandGuidelinesText = brand_guidelines
      ? `BRAND GUIDELINES:\n${brand_guidelines}`
      : `BRAND GUIDELINES:
Craefto is a creative tech studio. Our voice is:
- Authoritative but approachable
- Practical and actionable
- Shows depth over surface-level content
- Clear and concise, no fluff
- Uses examples to illustrate points`;

    // Build prompt
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace("{{title}}", draft.title)
      .replace("{{subtitle}}", draft.subtitle || "None")
      .replace("{{content}}", draft.content)
      .replace("{{excerpt}}", draft.excerpt || "Not provided")
      .replace("{{metaTitle}}", draft.meta_title || draft.title)
      .replace("{{metaDescription}}", draft.meta_description || "Not provided")
      .replace("{{keywords}}", draft.keywords?.join(", ") || "None specified")
      .replace("{{wordCount}}", String(draft.word_count || "Unknown"))
      .replace("{{briefContext}}", briefContext)
      .replace("{{brandGuidelines}}", brandGuidelinesText);

    // Call LLM with moderate temperature for balanced review
    const { content, tokensUsed } = await callLLM(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.5,
      maxTokens: 3000,
    });

    await this.updateTokensUsed(tokensUsed);

    // Parse response
    const response = parseJSONResponse<EditorGuardianOutput>(content);

    // Save review to database
    const context = this.getContext();
    await supabase.from("content_reviews").insert({
      draft_id: input.draft_id,
      draft_version: draft.version,
      verdict: response.verdict,
      readability_score: response.readability_score,
      seo_score: response.seo_score,
      originality_score: response.originality_score,
      accuracy_score: response.accuracy_score,
      brand_voice_score: response.brand_voice_score,
      overall_score: response.overall_score,
      summary: response.summary,
      strengths: response.strengths,
      improvements: response.improvements,
      critical_issues: response.critical_issues,
      suggestions: response.suggestions,
      human_override: false,
      agent_run_id: context.runId,
    });

    // Update draft status based on verdict
    const draftStatusMap: Record<ReviewVerdict, string> = {
      approve: "approved",
      revise: "needs_revision",
      reject: "draft",
    };

    await supabase
      .from("content_drafts")
      .update({
        status: draftStatusMap[response.verdict],
        readability_score: response.readability_score,
        seo_score: response.seo_score,
        originality_score: response.originality_score,
        overall_score: response.overall_score,
      })
      .eq("id", input.draft_id);

    return response;
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId: string): Promise<ContentReview | null> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("content_reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all reviews for a draft
   */
  async getReviewsForDraft(draftId: string): Promise<ContentReview[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("content_reviews")
      .select("*")
      .eq("draft_id", draftId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get reviews: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get pending reviews awaiting human approval
   */
  async getPendingHumanReviews(): Promise<ContentReview[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("content_reviews")
      .select("*")
      .eq("human_override", false)
      .in("verdict", ["approve", "revise"])
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending reviews: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Human override of AI review
   */
  async humanOverride(
    reviewId: string,
    humanVerdict: ReviewVerdict,
    humanNotes: string,
    reviewedBy: string
  ): Promise<void> {
    const supabase = createServerClient();

    // Get the review to find the draft
    const { data: review } = await supabase
      .from("content_reviews")
      .select("draft_id")
      .eq("id", reviewId)
      .single();

    if (!review) {
      throw new Error("Review not found");
    }

    // Update the review
    const { error: reviewError } = await supabase
      .from("content_reviews")
      .update({
        human_override: true,
        human_verdict: humanVerdict,
        human_notes: humanNotes,
        human_reviewed_by: reviewedBy,
        human_reviewed_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (reviewError) {
      throw new Error(`Failed to update review: ${reviewError.message}`);
    }

    // Update draft status based on human verdict
    const draftStatusMap: Record<ReviewVerdict, string> = {
      approve: "approved",
      revise: "needs_revision",
      reject: "draft",
    };

    const { error: draftError } = await supabase
      .from("content_drafts")
      .update({ status: draftStatusMap[humanVerdict] })
      .eq("id", review.draft_id);

    if (draftError) {
      throw new Error(`Failed to update draft: ${draftError.message}`);
    }
  }

  /**
   * Quick quality check without full review
   */
  async quickCheck(
    content: string
  ): Promise<{
    score: number;
    issues: string[];
    recommendation: "proceed" | "review_needed";
  }> {
    const { content: result, tokensUsed } = await callLLM(
      "You are a content quality checker. Do a quick assessment.",
      `Quick quality check on this content:

${content.slice(0, 3000)}${content.length > 3000 ? "\n[truncated]" : ""}

Return JSON:
{
  "score": 0-100,
  "issues": ["string - any obvious issues"],
  "recommendation": "proceed|review_needed"
}`,
      { temperature: 0.3, maxTokens: 500 }
    );

    await this.updateTokensUsed(tokensUsed);
    return parseJSONResponse(result);
  }

  /**
   * Get review statistics
   */
  async getReviewStats(): Promise<{
    total: number;
    approved: number;
    revised: number;
    rejected: number;
    avgScore: number;
    humanOverrides: number;
  }> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("content_reviews")
      .select("verdict, overall_score, human_override");

    if (error) {
      throw new Error(`Failed to get review stats: ${error.message}`);
    }

    const reviews = data || [];
    const total = reviews.length;
    const approved = reviews.filter((r) => r.verdict === "approve").length;
    const revised = reviews.filter((r) => r.verdict === "revise").length;
    const rejected = reviews.filter((r) => r.verdict === "reject").length;
    const humanOverrides = reviews.filter((r) => r.human_override).length;

    const scores = reviews.map((r) => r.overall_score).filter((s): s is number => s !== null);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      total,
      approved,
      revised,
      rejected,
      avgScore: Math.round(avgScore * 10) / 10,
      humanOverrides,
    };
  }
}

// Export singleton instance
export const editorGuardian = new EditorGuardianAgent();
