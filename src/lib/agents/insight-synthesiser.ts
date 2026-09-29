import { createServerClient } from "@/lib/supabase";
import { BaseAgent, callLLM, parseJSONResponse } from "./base-agent";
import type {
  InsightSynthesiserInput,
  InsightSynthesiserOutput,
  ContentBrief,
} from "./types";

const SYSTEM_PROMPT = `You are an Insight Synthesiser agent for Craefto, transforming raw content insights into comprehensive content briefs.

Your job is to:
1. Analyze the insight and identify the most compelling angle
2. Define the target audience and their pain points
3. Create a detailed outline that builds authority
4. Identify key takeaways readers should remember
5. Suggest the optimal content type and structure

Content types we create:
- article: Standard blog post (1000-1500 words)
- deep_dive: Comprehensive analysis (2500-4000 words)
- case_study: Real-world example with lessons (1500-2500 words)
- tutorial: Step-by-step guide (1500-3000 words)
- opinion: Thought leadership piece (800-1500 words)

Our voice:
- Authoritative but approachable
- Practical and actionable
- Depth over surface-level content
- Clear, concise, no fluff
- Show don't tell - use examples

Create briefs that will result in content that compounds value over time.`;

const USER_PROMPT_TEMPLATE = `Create a content brief for this insight:

Title: {{title}}
Summary: {{summary}}
Key Points: {{keyPoints}}
Target Keywords: {{keywords}}

Pillar Context: {{pillarContext}}

Existing articles to potentially link to: {{existingArticles}}

Return a comprehensive brief as JSON:
{
  "working_title": "string - compelling, specific title",
  "angle": "string - unique perspective we're taking",
  "thesis_statement": "string - core argument in one sentence",
  "target_audience": "string - who this is for and their context",
  "content_type": "article|deep_dive|case_study|tutorial|opinion",
  "outline": [
    {
      "heading": "string",
      "points": ["string"],
      "notes": "string - optional guidance for writer"
    }
  ],
  "key_takeaways": ["string - 3-5 memorable insights"],
  "target_word_count": number,
  "estimated_reading_time": number
}`;

export class InsightSynthesiserAgent extends BaseAgent<
  InsightSynthesiserInput,
  InsightSynthesiserOutput
> {
  constructor() {
    super("insight_synthesiser");
  }

  protected async execute(input: InsightSynthesiserInput): Promise<InsightSynthesiserOutput> {
    const supabase = createServerClient();
    const { insight } = input;

    // Get pillar context if available
    let pillarContext = "General content";
    if (insight.pillar_id) {
      const { data: pillar } = await supabase
        .from("journal_pillars")
        .select("name, description, strategic_intent, target_reader")
        .eq("id", insight.pillar_id)
        .single();

      if (pillar) {
        pillarContext = `Pillar: ${pillar.name}
Description: ${pillar.description}
Strategic Intent: ${pillar.strategic_intent}
Target Reader: ${pillar.target_reader}`;
      }
    }

    // Get existing articles for internal linking suggestions
    const { data: existingArticles } = await supabase
      .from("journal_articles")
      .select("title, slug")
      .eq("status", "published")
      .limit(20);

    const existingArticlesList = existingArticles?.length
      ? existingArticles.map((a) => `- ${a.title} (/journal/${a.slug})`).join("\n")
      : "No existing articles yet";

    // Build prompt
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace("{{title}}", insight.title)
      .replace("{{summary}}", insight.summary)
      .replace("{{keyPoints}}", insight.key_points.join(", "))
      .replace("{{keywords}}", insight.target_keywords.join(", "))
      .replace("{{pillarContext}}", pillarContext)
      .replace("{{existingArticles}}", existingArticlesList);

    // Call LLM
    const { content, tokensUsed } = await callLLM(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.7,
      maxTokens: 2500,
    });

    await this.updateTokensUsed(tokensUsed);

    // Parse response
    const response = parseJSONResponse<InsightSynthesiserOutput>(content);

    // Save brief to database
    const context = this.getContext();
    await supabase.from("content_briefs").insert({
      insight_id: input.insight_id,
      working_title: response.working_title,
      angle: response.angle,
      thesis_statement: response.thesis_statement,
      target_audience: response.target_audience,
      content_type: response.content_type,
      suggested_pillar_id: insight.pillar_id,
      outline: response.outline,
      key_takeaways: response.key_takeaways,
      target_word_count: response.target_word_count,
      estimated_reading_time: response.estimated_reading_time,
      status: "draft",
      agent_run_id: context.runId,
    });

    // Mark insight as used
    await supabase
      .from("content_insights")
      .update({ status: "used" })
      .eq("id", input.insight_id);

    return response;
  }

  /**
   * Get brief by ID
   */
  async getBrief(briefId: string): Promise<ContentBrief | null> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("id", briefId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all pending briefs for review
   */
  async getPendingBriefs(): Promise<ContentBrief[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending briefs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Approve a brief for writing
   */
  async approveBrief(briefId: string, reviewedBy: string, feedback?: string): Promise<void> {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("content_briefs")
      .update({
        status: "approved",
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        feedback: feedback || null,
      })
      .eq("id", briefId);

    if (error) {
      throw new Error(`Failed to approve brief: ${error.message}`);
    }
  }

  /**
   * Request revisions on a brief
   */
  async requestRevisions(briefId: string, reviewedBy: string, feedback: string): Promise<void> {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("content_briefs")
      .update({
        status: "rejected",
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        feedback,
      })
      .eq("id", briefId);

    if (error) {
      throw new Error(`Failed to request revisions: ${error.message}`);
    }
  }
}

// Export singleton instance
export const insightSynthesiser = new InsightSynthesiserAgent();
