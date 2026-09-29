import { createServerClient } from "@/lib/supabase";
import { BaseAgent, callLLM, parseJSONResponse } from "./base-agent";
import type { SEOStrategistInput, SEOStrategistOutput, ContentBrief } from "./types";

const SYSTEM_PROMPT = `You are an SEO Strategist agent for Craefto. Your job is to optimize content briefs for search visibility while maintaining editorial quality.

Your responsibilities:
1. Identify the primary keyword with best opportunity
2. Find semantically related secondary keywords
3. Craft compelling meta descriptions (under 160 chars)
4. Suggest title variations optimized for CTR
5. Identify internal linking opportunities
6. Spot content gaps to address

SEO principles we follow:
- User intent first, keywords second
- Long-tail keywords for authority building
- Topic clusters over isolated posts
- E-E-A-T signals (Experience, Expertise, Authority, Trust)
- Featured snippet optimization where appropriate

Never sacrifice readability for keyword density. Our content should read naturally while being discoverable.`;

const USER_PROMPT_TEMPLATE = `Optimize this content brief for SEO:

Working Title: {{title}}
Angle: {{angle}}
Target Audience: {{audience}}
Content Type: {{contentType}}

Outline:
{{outline}}

Key Takeaways:
{{takeaways}}

Existing articles for internal linking:
{{existingArticles}}

Target keyword suggestion (optional): {{targetKeyword}}

Return SEO optimization as JSON:
{
  "primary_keyword": "string - main search term to target",
  "secondary_keywords": ["string - 5-10 related terms"],
  "meta_description_draft": "string - compelling, under 160 chars",
  "title_suggestions": ["string - 3-5 SEO-optimized title variations"],
  "suggested_links": ["string - article slugs to link to"],
  "content_gaps": ["string - topics/questions not covered that could add value"]
}`;

export class SEOStrategistAgent extends BaseAgent<SEOStrategistInput, SEOStrategistOutput> {
  constructor() {
    super("seo_strategist");
  }

  protected async execute(input: SEOStrategistInput): Promise<SEOStrategistOutput> {
    const supabase = createServerClient();
    const { brief } = input;

    // Get existing articles for internal linking
    const { data: existingArticles } = await supabase
      .from("journal_articles")
      .select("title, slug, excerpt")
      .eq("status", "published")
      .limit(30);

    const existingArticlesList = existingArticles?.length
      ? existingArticles.map((a) => `- ${a.title} (/journal/${a.slug}): ${a.excerpt || "No excerpt"}`).join("\n")
      : "No existing articles yet";

    // Format outline for prompt
    const outlineText = brief.outline
      .map((item) => `## ${item.heading}\n${item.points.map((p) => `- ${p}`).join("\n")}`)
      .join("\n\n");

    // Build prompt
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace("{{title}}", brief.working_title)
      .replace("{{angle}}", brief.angle)
      .replace("{{audience}}", brief.target_audience || "General tech audience")
      .replace("{{contentType}}", brief.content_type || "article")
      .replace("{{outline}}", outlineText)
      .replace("{{takeaways}}", brief.key_takeaways.join("\n"))
      .replace("{{existingArticles}}", existingArticlesList)
      .replace("{{targetKeyword}}", input.target_keyword || "Not specified");

    // Call LLM
    const { content, tokensUsed } = await callLLM(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.6,
      maxTokens: 1500,
    });

    await this.updateTokensUsed(tokensUsed);

    // Parse response
    const response = parseJSONResponse<SEOStrategistOutput>(content);

    // Update brief with SEO data (getContext() throws if called outside run())
    this.getContext();
    await supabase
      .from("content_briefs")
      .update({
        primary_keyword: response.primary_keyword,
        secondary_keywords: response.secondary_keywords,
        meta_description_draft: response.meta_description_draft,
        suggested_links: response.suggested_links,
      })
      .eq("id", input.brief_id);

    return response;
  }

  /**
   * Analyze keyword opportunity
   */
  async analyzeKeyword(keyword: string): Promise<{
    competition: string;
    opportunity: string;
    relatedTerms: string[];
  }> {
    const { content, tokensUsed } = await callLLM(
      "You are an SEO analyst. Analyze keyword opportunities.",
      `Analyze the SEO opportunity for the keyword: "${keyword}"

Consider:
- Search intent (informational, navigational, transactional)
- Competition level
- Content opportunity

Return JSON:
{
  "competition": "low|medium|high",
  "opportunity": "string - brief assessment",
  "relatedTerms": ["string - 5 related keywords"]
}`,
      { temperature: 0.5, maxTokens: 500 }
    );

    await this.updateTokensUsed(tokensUsed);
    return parseJSONResponse(content);
  }

  /**
   * Generate title variations
   */
  async generateTitleVariations(
    brief: ContentBrief,
    count = 5
  ): Promise<{ titles: string[]; recommendation: string }> {
    const { content, tokensUsed } = await callLLM(
      "You are an SEO copywriter specializing in compelling headlines.",
      `Generate ${count} title variations for this article:

Topic: ${brief.working_title}
Angle: ${brief.angle}
Primary Keyword: ${brief.primary_keyword || "Not specified"}

Requirements:
- Include primary keyword naturally
- Under 60 characters preferred
- Compelling for both readers and search
- Mix of formats (how-to, list, question, statement)

Return JSON:
{
  "titles": ["string"],
  "recommendation": "string - which title is best and why"
}`,
      { temperature: 0.8, maxTokens: 800 }
    );

    await this.updateTokensUsed(tokensUsed);
    return parseJSONResponse(content);
  }
}

// Export singleton instance
export const seoStrategist = new SEOStrategistAgent();
