import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface FeedbackEntry {
  id: string;
  article_id: string;
  agent_type: string;
  feedback_type: string;
  feedback_score: number;
  feedback_text: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * GET /api/analytics/feedback - Get feedback entries
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");
  const agentType = searchParams.get("agentType");
  const limit = parseInt(searchParams.get("limit") || "50");

  const supabase = createServerClient();

  let query = supabase
    .from("agent_feedback")
    .select(`
      *,
      journal_articles(title, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (articleId) {
    query = query.eq("article_id", articleId);
  }

  if (agentType) {
    query = query.eq("agent_type", agentType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate aggregate stats
  const stats = calculateAgentStats(data || []);

  return NextResponse.json({
    feedback: data || [],
    stats,
  });
}

/**
 * POST /api/analytics/feedback - Submit feedback for agent-generated content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      articleId,
      agentType,
      feedbackType,
      feedbackScore,
      feedbackText,
      metadata = {},
    } = body;

    if (!articleId || !agentType || !feedbackType || feedbackScore === undefined) {
      return NextResponse.json(
        { error: "articleId, agentType, feedbackType, and feedbackScore required" },
        { status: 400 }
      );
    }

    // Validate feedbackScore (1-5 scale)
    if (feedbackScore < 1 || feedbackScore > 5) {
      return NextResponse.json(
        { error: "feedbackScore must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Valid agent types
    const validAgentTypes = [
      "topic_scout",
      "research_analyst",
      "editorial_strategist",
      "editorial_writer",
      "editor_guardian",
    ];

    if (!validAgentTypes.includes(agentType)) {
      return NextResponse.json(
        { error: `Invalid agentType. Must be one of: ${validAgentTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Valid feedback types
    const validFeedbackTypes = [
      "quality",
      "accuracy",
      "relevance",
      "engagement",
      "style",
      "technical_accuracy",
      "overall",
    ];

    if (!validFeedbackTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: `Invalid feedbackType. Must be one of: ${validFeedbackTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("agent_feedback")
      .insert({
        article_id: articleId,
        agent_type: agentType,
        feedback_type: feedbackType,
        feedback_score: feedbackScore,
        feedback_text: feedbackText || null,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Calculate aggregate statistics for agent feedback
 */
function calculateAgentStats(feedback: FeedbackEntry[]) {
  const agentStats: Record<
    string,
    {
      totalFeedback: number;
      avgScore: number;
      byType: Record<string, { count: number; avgScore: number }>;
      recentTrend: "improving" | "declining" | "stable";
    }
  > = {};

  // Group by agent type
  feedback.forEach((entry) => {
    if (!agentStats[entry.agent_type]) {
      agentStats[entry.agent_type] = {
        totalFeedback: 0,
        avgScore: 0,
        byType: {},
        recentTrend: "stable",
      };
    }

    const agent = agentStats[entry.agent_type];
    agent.totalFeedback++;

    if (!agent.byType[entry.feedback_type]) {
      agent.byType[entry.feedback_type] = { count: 0, avgScore: 0 };
    }
    agent.byType[entry.feedback_type].count++;
  });

  // Calculate averages
  Object.keys(agentStats).forEach((agentType) => {
    const agentFeedback = feedback.filter((f) => f.agent_type === agentType);
    const totalScore = agentFeedback.reduce((sum, f) => sum + f.feedback_score, 0);
    agentStats[agentType].avgScore =
      agentFeedback.length > 0 ? totalScore / agentFeedback.length : 0;

    // Calculate by type averages
    Object.keys(agentStats[agentType].byType).forEach((feedbackType) => {
      const typeFeedback = agentFeedback.filter((f) => f.feedback_type === feedbackType);
      const typeTotal = typeFeedback.reduce((sum, f) => sum + f.feedback_score, 0);
      agentStats[agentType].byType[feedbackType].avgScore =
        typeFeedback.length > 0 ? typeTotal / typeFeedback.length : 0;
    });

    // Calculate trend (compare recent 10 vs previous 10)
    if (agentFeedback.length >= 10) {
      const recent = agentFeedback.slice(0, 10);
      const previous = agentFeedback.slice(10, 20);

      if (previous.length >= 5) {
        const recentAvg = recent.reduce((sum, f) => sum + f.feedback_score, 0) / recent.length;
        const prevAvg = previous.reduce((sum, f) => sum + f.feedback_score, 0) / previous.length;

        if (recentAvg > prevAvg + 0.3) {
          agentStats[agentType].recentTrend = "improving";
        } else if (recentAvg < prevAvg - 0.3) {
          agentStats[agentType].recentTrend = "declining";
        }
      }
    }
  });

  return agentStats;
}

/**
 * GET /api/analytics/feedback/summary - Get summary for agent improvement
 * This endpoint provides data that can be used to improve agent prompts
 */
export async function generateFeedbackSummary(agentType: string) {
  const supabase = createServerClient();

  const { data: feedback, error } = await supabase
    .from("agent_feedback")
    .select("*")
    .eq("agent_type", agentType)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !feedback) {
    return null;
  }

  // Find patterns in low-scoring feedback
  const lowScoring = feedback.filter((f) => f.feedback_score <= 2);
  const highScoring = feedback.filter((f) => f.feedback_score >= 4);

  // Extract common issues from feedback text
  const commonIssues = extractCommonPatterns(lowScoring.map((f) => f.feedback_text).filter(Boolean) as string[]);
  const commonStrengths = extractCommonPatterns(highScoring.map((f) => f.feedback_text).filter(Boolean) as string[]);

  // Identify which feedback types are weakest
  const typeScores: Record<string, number[]> = {};
  feedback.forEach((f) => {
    if (!typeScores[f.feedback_type]) {
      typeScores[f.feedback_type] = [];
    }
    typeScores[f.feedback_type].push(f.feedback_score);
  });

  const weakestTypes = Object.entries(typeScores)
    .map(([type, scores]) => ({
      type,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 3);

  return {
    agentType,
    totalFeedback: feedback.length,
    avgScore: feedback.reduce((sum, f) => sum + f.feedback_score, 0) / feedback.length,
    weakestTypes,
    commonIssues,
    commonStrengths,
    improvementSuggestions: generateImprovementSuggestions(weakestTypes),
  };
}

function extractCommonPatterns(texts: string[]): string[] {
  // Simple keyword extraction (in production, use NLP)
  const words: Record<string, number> = {};

  texts.forEach((text) => {
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, "");
    cleaned.split(/\s+/).forEach((word) => {
      if (word.length > 4) {
        words[word] = (words[word] || 0) + 1;
      }
    });
  });

  return Object.entries(words)
    .filter(([, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function generateImprovementSuggestions(
  weakestTypes: { type: string; avgScore: number }[]
): string[] {
  const suggestions: string[] = [];

  weakestTypes.forEach(({ type, avgScore }) => {
    if (avgScore < 3) {
      switch (type) {
        case "quality":
          suggestions.push("Focus on improving overall content quality and polish");
          break;
        case "accuracy":
          suggestions.push("Verify facts and data points more thoroughly");
          break;
        case "relevance":
          suggestions.push("Ensure content aligns better with target audience needs");
          break;
        case "engagement":
          suggestions.push("Add more engaging elements: examples, stories, visuals");
          break;
        case "style":
          suggestions.push("Refine writing style to match brand voice");
          break;
        case "technical_accuracy":
          suggestions.push("Double-check technical details and code examples");
          break;
      }
    }
  });

  return suggestions;
}
