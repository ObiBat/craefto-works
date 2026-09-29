import { createServerClient } from "@/lib/supabase";
import { trendScanner } from "./trend-scanner";
import { insightSynthesiser } from "./insight-synthesiser";
import { seoStrategist } from "./seo-strategist";
import { editorialWriter } from "./editorial-writer";
import { editorGuardian } from "./editor-guardian";
import type {
  ContentQueueItem,
  PipelineStage,
  ContentInsight,
  ContentBrief,
  ContentDraft,
} from "./types";

/**
 * Content Pipeline Orchestrator
 * Coordinates the flow of content through the agent pipeline
 */
export class ContentPipeline {
  private supabase = createServerClient();

  /**
   * Add an item to the content queue
   */
  async queueItem(
    itemType: "insight" | "brief" | "draft" | "review",
    itemId: string,
    stage: PipelineStage,
    priority: number = 0
  ): Promise<ContentQueueItem> {
    const { data, error } = await this.supabase
      .from("content_queue")
      .insert({
        item_type: itemType,
        item_id: itemId,
        current_stage: stage,
        next_stage: this.getNextStage(stage),
        status: "queued",
        priority,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to queue item: ${error.message}`);
    }

    return data;
  }

  /**
   * Get the next stage in the pipeline
   */
  private getNextStage(current: PipelineStage): PipelineStage | null {
    const stageOrder: PipelineStage[] = [
      "trend_scan",
      "synthesize",
      "seo_optimize",
      "write",
      "review",
      "human_approval",
      "publish",
      "complete",
    ];

    const currentIndex = stageOrder.indexOf(current);
    if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
      return null;
    }
    return stageOrder[currentIndex + 1];
  }

  /**
   * Process the next item in the queue
   */
  async processNext(): Promise<{ processed: boolean; item?: ContentQueueItem }> {
    // Get the highest priority queued item
    const { data: item, error } = await this.supabase
      .from("content_queue")
      .select("*")
      .eq("status", "queued")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (error || !item) {
      return { processed: false };
    }

    // Mark as processing
    await this.supabase
      .from("content_queue")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    try {
      await this.processStage(item);

      // Update to next stage or complete
      const nextStage = this.getNextStage(item.current_stage);

      if (nextStage === "human_approval") {
        // Pause for human approval
        await this.supabase
          .from("content_queue")
          .update({
            status: "awaiting_approval",
            current_stage: nextStage,
            next_stage: this.getNextStage(nextStage),
          })
          .eq("id", item.id);
      } else if (nextStage) {
        // Move to next stage
        await this.supabase
          .from("content_queue")
          .update({
            status: "queued",
            current_stage: nextStage,
            next_stage: this.getNextStage(nextStage),
          })
          .eq("id", item.id);
      } else {
        // Pipeline complete
        await this.supabase
          .from("content_queue")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }

      return { processed: true, item };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const retryCount = item.retry_count + 1;

      if (retryCount >= item.max_retries) {
        // Max retries reached, mark as failed
        await this.supabase
          .from("content_queue")
          .update({
            status: "failed",
            last_error: errorMessage,
            retry_count: retryCount,
          })
          .eq("id", item.id);
      } else {
        // Queue for retry
        await this.supabase
          .from("content_queue")
          .update({
            status: "queued",
            last_error: errorMessage,
            retry_count: retryCount,
          })
          .eq("id", item.id);
      }

      throw error;
    }
  }

  /**
   * Process a specific pipeline stage
   */
  private async processStage(item: ContentQueueItem): Promise<void> {
    switch (item.current_stage) {
      case "trend_scan":
        await trendScanner.run({});
        break;

      case "synthesize":
        if (item.item_type === "insight") {
          const { data: insight } = await this.supabase
            .from("content_insights")
            .select("*")
            .eq("id", item.item_id)
            .single();

          if (insight) {
            await insightSynthesiser.run({
              insight_id: insight.id,
              insight: insight as ContentInsight,
            });
          }
        }
        break;

      case "seo_optimize":
        if (item.item_type === "brief") {
          const { data: brief } = await this.supabase
            .from("content_briefs")
            .select("*")
            .eq("id", item.item_id)
            .single();

          if (brief) {
            await seoStrategist.run({
              brief_id: brief.id,
              brief: brief as ContentBrief,
            });
          }
        }
        break;

      case "write":
        if (item.item_type === "brief") {
          const { data: brief } = await this.supabase
            .from("content_briefs")
            .select("*")
            .eq("id", item.item_id)
            .single();

          if (brief) {
            await editorialWriter.run({
              brief_id: brief.id,
              brief: brief as ContentBrief,
            });
          }
        }
        break;

      case "review":
        if (item.item_type === "draft") {
          const { data: draft } = await this.supabase
            .from("content_drafts")
            .select("*")
            .eq("id", item.item_id)
            .single();

          if (draft) {
            // Get the brief for context
            let brief: ContentBrief | undefined;
            if (draft.brief_id) {
              const { data: briefData } = await this.supabase
                .from("content_briefs")
                .select("*")
                .eq("id", draft.brief_id)
                .single();
              brief = briefData as ContentBrief;
            }

            await editorGuardian.run({
              draft_id: draft.id,
              draft: draft as ContentDraft,
              brief,
            });
          }
        }
        break;

      case "human_approval":
        // This stage requires human action, no automatic processing
        break;

      case "publish":
        await this.publishContent(item.item_id);
        break;

      default:
        throw new Error(`Unknown pipeline stage: ${item.current_stage}`);
    }
  }

  /**
   * Publish approved content to journal_articles
   */
  private async publishContent(draftId: string): Promise<void> {
    const { data: draft } = await this.supabase
      .from("content_drafts")
      .select("*, content_briefs(*)")
      .eq("id", draftId)
      .single();

    if (!draft || draft.status !== "approved") {
      throw new Error("Draft not found or not approved");
    }

    const brief = draft.content_briefs;

    // Generate slug from title
    const slug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check for existing slug
    const { data: existing } = await this.supabase
      .from("journal_articles")
      .select("slug")
      .eq("slug", slug)
      .single();

    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    // Create the article
    await this.supabase.from("journal_articles").insert({
      title: draft.title,
      slug: finalSlug,
      excerpt: draft.excerpt,
      content: draft.content,
      pillar_id: brief?.suggested_pillar_id || null,
      status: "published",
      published_at: new Date().toISOString(),
      meta_title: draft.meta_title,
      meta_description: draft.meta_description,
      reading_time: draft.reading_time,
    });

    // Update draft status
    await this.supabase
      .from("content_drafts")
      .update({ status: "published" })
      .eq("id", draftId);

    // Update brief status
    if (brief?.id) {
      await this.supabase
        .from("content_briefs")
        .update({ status: "completed" })
        .eq("id", brief.id);
    }
  }

  /**
   * Approve a queue item for human approval stage
   */
  async approveItem(queueItemId: string): Promise<void> {
    const { data: item } = await this.supabase
      .from("content_queue")
      .select("*")
      .eq("id", queueItemId)
      .single();

    if (!item || item.status !== "awaiting_approval") {
      throw new Error("Item not found or not awaiting approval");
    }

    // Move to next stage
    const nextStage = this.getNextStage(item.current_stage);

    await this.supabase
      .from("content_queue")
      .update({
        status: "queued",
        current_stage: nextStage || "complete",
        next_stage: nextStage ? this.getNextStage(nextStage) : null,
      })
      .eq("id", queueItemId);
  }

  /**
   * Reject a queue item
   */
  async rejectItem(queueItemId: string, reason: string): Promise<void> {
    await this.supabase
      .from("content_queue")
      .update({
        status: "cancelled",
        last_error: reason,
      })
      .eq("id", queueItemId);
  }

  /**
   * Get pipeline status overview
   */
  async getStatus(): Promise<{
    queued: number;
    processing: number;
    awaitingApproval: number;
    completed: number;
    failed: number;
    byStage: Record<PipelineStage, number>;
  }> {
    const { data, error } = await this.supabase
      .from("content_queue")
      .select("status, current_stage");

    if (error) {
      throw new Error(`Failed to get pipeline status: ${error.message}`);
    }

    const items = data || [];

    const byStatus = {
      queued: items.filter((i) => i.status === "queued").length,
      processing: items.filter((i) => i.status === "processing").length,
      awaitingApproval: items.filter((i) => i.status === "awaiting_approval").length,
      completed: items.filter((i) => i.status === "completed").length,
      failed: items.filter((i) => i.status === "failed").length,
    };

    const stages: PipelineStage[] = [
      "trend_scan",
      "synthesize",
      "seo_optimize",
      "write",
      "review",
      "human_approval",
      "publish",
      "complete",
    ];

    const byStage = stages.reduce(
      (acc, stage) => {
        acc[stage] = items.filter((i) => i.current_stage === stage).length;
        return acc;
      },
      {} as Record<PipelineStage, number>
    );

    return { ...byStatus, byStage };
  }

  /**
   * Get items awaiting human approval
   */
  async getAwaitingApproval(): Promise<ContentQueueItem[]> {
    const { data, error } = await this.supabase
      .from("content_queue")
      .select("*")
      .eq("status", "awaiting_approval")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to get items awaiting approval: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Run full pipeline for a set of topics (convenience method)
   */
  async runFullPipeline(topics: string[]): Promise<{ runId: string }> {
    // Start with trend scanning
    const { runId } = await trendScanner.run({ topics });
    return { runId };
  }
}

// Export singleton instance
export const contentPipeline = new ContentPipeline();
