import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface AnalyticsEvent {
  articleId: string;
  slug: string;
  eventType: string;
  visitorId?: string;
  sessionId?: string;
  referrer?: string;
  deviceType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * POST /api/analytics/article - Record article analytics event
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body - handle both JSON and sendBeacon (text)
    let body: AnalyticsEvent;
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = JSON.parse(text);
    }

    const {
      articleId,
      eventType,
      visitorId,
      sessionId,
      referrer,
      deviceType,
      metadata = {},
    } = body;

    if (!articleId || !eventType) {
      return NextResponse.json(
        { error: "articleId and eventType required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get user agent and country from headers
    const userAgent = request.headers.get("user-agent") || undefined;
    const country = request.headers.get("cf-ipcountry") || // Cloudflare
      request.headers.get("x-vercel-ip-country") || // Vercel
      undefined;

    // Record the event
    const { error } = await supabase.from("article_events").insert({
      article_id: articleId,
      event_type: eventType,
      visitor_id: visitorId || null,
      session_id: sessionId || null,
      referrer: referrer || null,
      user_agent: userAgent,
      country,
      device_type: deviceType || null,
      metadata,
    });

    if (error) {
      console.error("Analytics insert error:", error);
      // Don't expose internal errors
      return NextResponse.json({ success: false }, { status: 500 });
    }

    // For view events, also update daily aggregates
    if (eventType === "view") {
      await updateDailyViews(supabase, articleId, visitorId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function updateDailyViews(
  supabase: ReturnType<typeof createServerClient>,
  articleId: string,
  visitorId?: string
) {
  const today = new Date().toISOString().split("T")[0];

  // Check if we already have a record for today
  const { data: existing } = await supabase
    .from("article_views")
    .select("id, view_count, unique_visitors")
    .eq("article_id", articleId)
    .eq("view_date", today)
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from("article_views")
      .update({
        view_count: existing.view_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new record for today
    await supabase.from("article_views").insert({
      article_id: articleId,
      view_date: today,
      view_count: 1,
      unique_visitors: visitorId ? 1 : 0,
    });
  }
}

interface DailyRow {
  article_id: string;
  view_date: string;
  view_count: number;
  unique_visitors: number | null;
  avg_time_on_page: number | null;
  scroll_depth_avg: number | null;
}

const dayAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().split("T")[0];

/**
 * Reading figures per article over the window, from the daily rows the
 * journal records (article_views): views, visitors, time on page, scroll
 * depth, shares and the last week's views, which rank what's trending.
 */
async function performance(supabase: ReturnType<typeof createServerClient>, days: number, articleId?: string) {
  let views = supabase.from("article_views").select("article_id, view_date, view_count, unique_visitors, avg_time_on_page, scroll_depth_avg").gte("view_date", dayAgo(days));
  let shares = supabase.from("article_events").select("article_id").eq("event_type", "share").gte("created_at", `${dayAgo(days)}T00:00:00Z`);
  if (articleId) {
    views = views.eq("article_id", articleId);
    shares = shares.eq("article_id", articleId);
  }
  const [{ data: rows }, { data: shareRows }] = await Promise.all([views, shares]);
  const daily = (rows ?? []) as DailyRow[];
  const ids = [...new Set(daily.map((row) => row.article_id))];
  const { data: articles } = ids.length ? await supabase.from("journal_articles").select("id, title, slug").in("id", ids) : { data: [] };
  const articleOf = new Map((articles ?? []).map((article) => [article.id, { title: article.title, slug: article.slug }]));
  const weekAgo = dayAgo(7);
  const monthAgo = dayAgo(30);

  return ids
    .filter((id) => articleOf.has(id))
    .map((id) => {
      const own = daily.filter((row) => row.article_id === id);
      const total = own.reduce((sum, row) => sum + row.view_count, 0);
      const weighted = (pick: (row: DailyRow) => number | null) => {
        const counted = own.filter((row) => pick(row) != null && row.view_count > 0);
        const weight = counted.reduce((sum, row) => sum + row.view_count, 0);
        return weight ? counted.reduce((sum, row) => sum + Number(pick(row)) * row.view_count, 0) / weight : null;
      };
      const dates = own.map((row) => row.view_date).sort();
      const lastWeek = own.filter((row) => row.view_date >= weekAgo).reduce((sum, row) => sum + row.view_count, 0);
      const averageTime = weighted((row) => row.avg_time_on_page);
      const averageScroll = weighted((row) => row.scroll_depth_avg);
      return {
        id,
        article_id: id,
        total_views: total,
        unique_visitors: own.reduce((sum, row) => sum + (row.unique_visitors ?? 0), 0),
        avg_time_on_page: averageTime == null ? null : Math.round(averageTime),
        avg_scroll_depth: averageScroll == null ? null : Math.round(averageScroll),
        share_count: (shareRows ?? []).filter((row) => row.article_id === id).length,
        views_last_7_days: lastWeek,
        views_last_30_days: own.filter((row) => row.view_date >= monthAgo).reduce((sum, row) => sum + row.view_count, 0),
        trend_score: lastWeek,
        first_view_at: dates[0] ?? null,
        last_view_at: dates.at(-1) ?? null,
        journal_articles: articleOf.get(id)!,
      };
    });
}

/**
 * GET /api/analytics/article - Get article analytics (for admin)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30") || 30));

  const supabase = createServerClient();

  if (articleId) {
    const [figures, dailyViews, recentEvents] = await Promise.all([
      performance(supabase, days, articleId),
      supabase.from("article_views").select("*").eq("article_id", articleId).gte("view_date", dayAgo(days)).order("view_date", { ascending: false }),
      supabase.from("article_events").select("event_type, created_at, metadata").eq("article_id", articleId).order("created_at", { ascending: false }).limit(100),
    ]);
    return NextResponse.json({
      performance: figures[0] ?? null,
      dailyViews: dailyViews.data || [],
      recentEvents: recentEvents.data || [],
    });
  }

  const figures = await performance(supabase, days);
  return NextResponse.json({
    topArticles: [...figures].sort((a, b) => b.total_views - a.total_views).slice(0, 20),
    trending: figures.filter((article) => article.views_last_7_days > 0).sort((a, b) => b.trend_score - a.trend_score).slice(0, 10),
  });
}
