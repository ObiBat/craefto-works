import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/ab-test - Get active A/B tests or specific test
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");
  const testId = searchParams.get("testId");

  const supabase = createServerClient();

  if (testId) {
    const { data, error } = await supabase
      .from("article_ab_tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  if (articleId) {
    const { data, error } = await supabase
      .from("article_ab_tests")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  }

  // Get all active tests
  const { data, error } = await supabase
    .from("article_ab_tests")
    .select(`
      *,
      journal_articles(title, slug)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

/**
 * POST /api/analytics/ab-test - Create test, record event, or end test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, articleId, testName, variantA, variantB, testId, variant, eventType } = body;

    const supabase = createServerClient();

    switch (action) {
      case "create": {
        // Create new A/B test
        if (!articleId || !testName || !variantA || !variantB) {
          return NextResponse.json(
            { error: "articleId, testName, variantA, and variantB required" },
            { status: 400 }
          );
        }

        // Check if there's already an active test for this article/test type
        const { data: existing } = await supabase
          .from("article_ab_tests")
          .select("id")
          .eq("article_id", articleId)
          .eq("test_name", testName)
          .eq("status", "active")
          .single();

        if (existing) {
          return NextResponse.json(
            { error: "Active test already exists for this article" },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from("article_ab_tests")
          .insert({
            article_id: articleId,
            test_name: testName,
            variant_a: variantA,
            variant_b: variantB,
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, test: data });
      }

      case "record": {
        // Record a view or click for a variant
        if (!testId || !variant || !eventType) {
          return NextResponse.json(
            { error: "testId, variant, and eventType required" },
            { status: 400 }
          );
        }

        const field =
          eventType === "view"
            ? variant === "a"
              ? "variant_a_views"
              : "variant_b_views"
            : variant === "a"
              ? "variant_a_clicks"
              : "variant_b_clicks";

        // Get current value and increment
        const { data: test } = await supabase
          .from("article_ab_tests")
          .select(field)
          .eq("id", testId)
          .single();

        if (!test) {
          return NextResponse.json({ error: "Test not found" }, { status: 404 });
        }

        const currentValue = (test as Record<string, number>)[field] || 0;

        await supabase
          .from("article_ab_tests")
          .update({ [field]: currentValue + 1, updated_at: new Date().toISOString() })
          .eq("id", testId);

        return NextResponse.json({ success: true });
      }

      case "end": {
        // End test and declare winner
        if (!testId) {
          return NextResponse.json({ error: "testId required" }, { status: 400 });
        }

        const { data: test } = await supabase
          .from("article_ab_tests")
          .select("*")
          .eq("id", testId)
          .single();

        if (!test) {
          return NextResponse.json({ error: "Test not found" }, { status: 404 });
        }

        // Calculate CTR and determine winner
        const ctrA =
          test.variant_a_views > 0
            ? test.variant_a_clicks / test.variant_a_views
            : 0;
        const ctrB =
          test.variant_b_views > 0
            ? test.variant_b_clicks / test.variant_b_views
            : 0;

        const winner = ctrA > ctrB ? "a" : ctrB > ctrA ? "b" : null;

        // Simple confidence calculation (not statistically rigorous)
        const totalSamples = test.variant_a_views + test.variant_b_views;
        const confidence = totalSamples > 100 ? Math.min(Math.abs(ctrA - ctrB) * 10, 0.99) : null;

        await supabase
          .from("article_ab_tests")
          .update({
            status: "completed",
            winner,
            confidence,
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", testId);

        return NextResponse.json({
          success: true,
          winner,
          confidence,
          stats: {
            variantA: { views: test.variant_a_views, clicks: test.variant_a_clicks, ctr: ctrA },
            variantB: { views: test.variant_b_views, clicks: test.variant_b_clicks, ctr: ctrB },
          },
        });
      }

      case "cancel": {
        if (!testId) {
          return NextResponse.json({ error: "testId required" }, { status: 400 });
        }

        await supabase
          .from("article_ab_tests")
          .update({
            status: "cancelled",
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", testId);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Get variant for a visitor (consistent assignment)
 */
export function getVariantForVisitor(testId: string, visitorId: string): "a" | "b" {
  // Simple hash-based assignment for consistency
  const hash = `${testId}-${visitorId}`
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 2 === 0 ? "a" : "b";
}
