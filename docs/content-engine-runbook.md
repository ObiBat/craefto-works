# Craefto Works Content Engine - Runbook

## Overview

The Craefto Works Content Engine is an AI-powered content management system built in 5 stages:

1. **Foundation** - Database schema, Next.js pages, admin panel
2. **SEO & Discovery** - Sitemaps, RSS feeds, JSON-LD schemas
3. **Content Pipeline** - 5 AI agents for content generation
4. **Automated Drafting** - Integrated into Stage 3
5. **Optimization** - ISR, analytics, A/B testing, feedback loops

---

## Architecture

### Database Schema (Supabase PostgreSQL)

```
journal_pillars          - Content categories/themes
journal_authors          - Author profiles
journal_articles         - Article content and metadata
journal_published_articles - View for published content
article_performance      - Analytics aggregations
article_views            - Raw view tracking
article_events           - User engagement events
article_ab_tests         - A/B test configurations
agent_feedback           - AI agent performance tracking
```

### Key Files

| Component | Location |
|-----------|----------|
| Journal Pages | `src/app/journal/` |
| Admin Panel | `src/app/admin/` |
| API Routes | `src/app/api/` |
| Components | `src/components/journal/` |
| Database Migrations | `supabase/migrations/` |

---

## AI Agents

### 1. Topic Scout
- **Purpose**: Research trending topics and content gaps
- **Endpoint**: `/api/admin/pipeline/agent`
- **Action**: `topic_scout`

### 2. Research Analyst
- **Purpose**: Deep research on selected topics
- **Endpoint**: `/api/admin/pipeline/agent`
- **Action**: `research_analyst`

### 3. Editorial Strategist
- **Purpose**: Create content outlines with SEO optimization
- **Endpoint**: `/api/admin/pipeline/agent`
- **Action**: `editorial_strategist`

### 4. Editorial Writer
- **Purpose**: Generate full article drafts
- **Endpoint**: `/api/admin/pipeline/agent`
- **Action**: `editorial_writer`

### 5. Editor Guardian
- **Purpose**: Quality review and editing suggestions
- **Endpoint**: `/api/admin/pipeline/agent`
- **Action**: `editor_guardian`

### Running the Pipeline

> **Auth:** every `/api/admin/*` endpoint needs either a signed-in admin browser session or `Authorization: Bearer $ADMIN_API_TOKEN` (set `ADMIN_API_TOKEN` in Vercel and `.env.local`). Unauthenticated calls get a 401.

```bash
# Via API
curl -X POST /api/admin/pipeline/agent \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "topic_scout", "input": {"pillar": "engineering"}}'
```

Via Admin UI: `/admin/pipeline`

---

## Analytics System

### Article Tracking

The `ArticleAnalytics` component tracks:
- Page views (unique and total)
- Scroll depth (25%, 50%, 75%, 100%)
- Time on page
- Exit events

```tsx
// Automatic tracking in article pages
<ArticleAnalytics articleId={article.id} slug={article.slug} />

// Manual event tracking
const { trackEvent } = useArticleTracking(articleId, slug);
trackEvent("share", "twitter");
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/article` | GET | Fetch article analytics |
| `/api/analytics/article` | POST | Record analytics event |
| `/api/analytics/ab-test` | GET/POST | Manage A/B tests |
| `/api/analytics/feedback` | GET/POST | Agent feedback |

---

## A/B Testing

### Creating a Test

1. Navigate to `/admin/analytics/ab-testing`
2. Click "New Test"
3. Select article, test type, and variants
4. Test runs automatically with 50/50 traffic split

### Ending a Test

1. Click on active test
2. Review statistics
3. Click "End Test & Declare Winner"
4. Winner is determined by CTR

### API Usage

```javascript
// Create test
POST /api/analytics/ab-test
{
  "action": "create",
  "articleId": "uuid",
  "testName": "title",
  "variantA": "Original Title",
  "variantB": "New Title"
}

// Record event
POST /api/analytics/ab-test
{
  "action": "record",
  "testId": "uuid",
  "variant": "a",
  "eventType": "click"
}

// End test
POST /api/analytics/ab-test
{
  "action": "end",
  "testId": "uuid"
}
```

---

## Agent Feedback Loop

### Purpose

Track AI agent performance over time to identify:
- Which agents need prompt improvements
- Common quality issues
- Performance trends

### Feedback Types

- `quality` - Overall content quality
- `accuracy` - Factual correctness
- `relevance` - Topic alignment
- `engagement` - Reader appeal
- `style` - Brand voice consistency
- `technical_accuracy` - Code/technical details
- `overall` - General assessment

### Submitting Feedback

Via Admin UI: `/admin/analytics/feedback`

Via API:
```javascript
POST /api/analytics/feedback
{
  "articleId": "uuid",
  "agentType": "editorial_writer",
  "feedbackType": "quality",
  "feedbackScore": 4,
  "feedbackText": "Good structure, needs more examples"
}
```

---

## ISR & Caching

### Revalidation Times

| Page | Revalidate |
|------|------------|
| Journal Index | 60 seconds |
| Article Pages | 300 seconds |
| Pillar Pages | 300 seconds |
| Author Pages | 300 seconds |

### Manual Revalidation

```bash
# Revalidate specific path
curl -X POST /api/revalidate?path=/journal/my-article&secret=YOUR_SECRET
```

---

## Admin Panel Routes

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard overview |
| `/admin/leads` | Lead management |
| `/admin/journal` | Article management |
| `/admin/pipeline` | Content pipeline |
| `/admin/analytics` | Analytics dashboard |
| `/admin/analytics/content` | Content performance |
| `/admin/analytics/ab-testing` | A/B test management |
| `/admin/analytics/feedback` | Agent feedback |

---

## Troubleshooting

### Analytics Not Recording

1. Check browser console for errors
2. Verify `ArticleAnalytics` component is mounted
3. Check Supabase connection
4. Verify `article_views` and `article_events` tables exist

### A/B Test Not Showing Variants

1. Check visitor has not been assigned previously
2. Clear localStorage (`ab_visitor_id`)
3. Verify test status is "active"

### Agent Pipeline Errors

1. Check API key configuration
2. Review pipeline logs at `/admin/pipeline`
3. Verify pillar exists in database

### ISR Not Updating

1. Check `revalidate` export in page
2. Verify no runtime errors in page
3. Check build logs for static generation errors

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# For AI Agents
ANTHROPIC_API_KEY=

# Optional
REVALIDATE_SECRET=
```

---

## Database Migrations

Run migrations in order:

```bash
supabase migration up
```

Migration files:
1. `001_journal_schema.sql` - Core tables
2. `002_journal_rls.sql` - Row-level security
3. `003_journal_views.sql` - Published articles view
4. `004_journal_indexes.sql` - Performance indexes
5. `005_content_pipeline.sql` - Pipeline tables
6. `006_article_analytics.sql` - Analytics tables

---

## Performance Tips

1. **Use ISR** - Don't disable static generation
2. **Batch Analytics** - Events are sent on exit via sendBeacon
3. **Limit API Calls** - Use caching headers
4. **Index Queries** - Check slow query logs
5. **CDN Images** - Use Next.js Image component

---

## Support

For issues or questions:
- Check error logs in Vercel/deployment platform
- Review Supabase logs for database errors
- Check browser console for client-side issues
