# Content Engine - Testing Workflow Guide

This guide walks you through testing all components of the AI-powered content engine.

## Prerequisites

### 1. Environment Setup

Add your Google Gemini API key to `.env.local`:

```bash
# Get your free API key at https://ai.google.dev
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

### 2. Database Setup

Ensure all migrations are run:

```bash
# If using Supabase CLI
supabase db push

# Or apply migrations manually in Supabase Dashboard
```

### 3. Seed Data

Create initial content pillars and an author:

```sql
-- Insert content pillars
INSERT INTO journal_pillars (name, slug, description, color) VALUES
('Engineering', 'engineering', 'Technical deep dives, code tutorials, and engineering best practices', '#3b82f6'),
('Design', 'design', 'UI/UX principles, design systems, and visual thinking', '#8b5cf6'),
('Product', 'product', 'Product strategy, growth tactics, and startup insights', '#22c55e'),
('AI & Automation', 'ai-automation', 'AI tools, automation workflows, and intelligent systems', '#f59e0b');

-- Insert an author
INSERT INTO journal_authors (name, slug, role, bio, expertise) VALUES
('Craefto Team', 'craefto-team', 'Editorial Team', 'The Craefto Works editorial team shares insights on design, engineering, and product development.', ARRAY['Design Systems', 'Web Development', 'AI Tools']);
```

---

## Testing Workflows

### Step 1: Test Trend Scanner

The Trend Scanner identifies content opportunities.

**Via Admin UI:**
1. Go to `/admin/pipeline`
2. Click "Scan Trends"
3. Enter topics (e.g., "AI tools", "design systems", "Next.js")
4. Click "Run Scan"

**Via API:**
> **Auth:** every `/api/admin/*` endpoint needs either a signed-in admin browser session or `Authorization: Bearer $ADMIN_API_TOKEN` (set `ADMIN_API_TOKEN` in Vercel and `.env.local`). Unauthenticated calls get a 401.

```bash
curl -X POST http://localhost:3000/api/admin/pipeline \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "scan",
    "topics": ["AI tools for developers", "design system best practices"]
  }'
```

**Expected Output:**
- New insights appear in the Insights tab
- Status: "pending" (awaiting approval)

---

### Step 2: Review & Approve Insights

**Via Admin UI:**
1. Go to `/admin/pipeline/insights`
2. Review generated insights
3. Click "Approve" to move to brief generation
4. Or "Reject" with reason to discard

**Via API:**
```bash
# Approve an insight
curl -X POST http://localhost:3000/api/admin/pipeline/insights \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "insightId": "uuid-here"
  }'
```

---

### Step 3: Generate Content Brief

After approval, the SEO Strategist creates a detailed brief.

**Via Admin UI:**
1. Approved insights automatically queue for brief generation
2. Go to `/admin/pipeline` and click "Process Next"
3. Or manually trigger from the insight detail

**Via API:**
```bash
curl -X POST http://localhost:3000/api/admin/pipeline \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "process_next"}'
```

**Expected Output:**
- Content brief with:
  - Working title options
  - Target keywords
  - Content outline
  - SEO recommendations
  - Suggested pillar

---

### Step 4: Generate Article Draft

The Editorial Writer creates the full article.

**Via Admin UI:**
1. Go to `/admin/pipeline/briefs`
2. Find approved brief
3. Click "Generate Draft"

**Via API:**
```bash
# Get briefs
curl http://localhost:3000/api/admin/pipeline/briefs -H "Authorization: Bearer $ADMIN_API_TOKEN"

# Generate draft from brief
curl -X POST http://localhost:3000/api/admin/pipeline/briefs \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_draft",
    "briefId": "uuid-here"
  }'
```

**Expected Output:**
- Full article in MDX format
- Meta title and description
- Reading time estimate
- Structured content with headings

---

### Step 5: Editorial Review

The Editor Guardian reviews the draft.

**Via Admin UI:**
1. Go to `/admin/pipeline/drafts`
2. Find generated draft
3. Click "Review"

**Via API:**
```bash
curl -X POST http://localhost:3000/api/admin/pipeline/drafts \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "review",
    "draftId": "uuid-here"
  }'
```

**Expected Output:**
- Quality score (0-100)
- Style analysis
- SEO compliance check
- Specific improvement suggestions
- Ready/Needs Work status

---

### Step 6: Revise Draft (if needed)

If the review suggests changes:

**Via Admin UI:**
1. Review feedback in draft detail
2. Click "Request Revision"
3. Add specific feedback
4. Submit for rewriting

**Via API:**
```bash
curl -X POST http://localhost:3000/api/admin/pipeline/drafts \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "revise",
    "draftId": "uuid-here",
    "feedback": "Add more code examples and improve the introduction hook"
  }'
```

---

### Step 7: Publish Article

When the draft is ready:

**Via Admin UI:**
1. Go to `/admin/pipeline/drafts`
2. Click "Approve" then "Publish"

**Via API:**
```bash
# Approve draft
curl -X POST http://localhost:3000/api/admin/pipeline/drafts \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve", "draftId": "uuid-here"}'

# Publish to journal
curl -X POST http://localhost:3000/api/admin/pipeline/drafts \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "publish", "draftId": "uuid-here"}'
```

**Result:**
- Article published at `/journal/[slug]`
- Appears in journal index
- Analytics tracking enabled

---

## Testing Analytics

### 1. View Article Analytics

After publishing, visit the article to generate view data:

```bash
# View the article
open http://localhost:3000/journal/your-article-slug

# Check analytics dashboard
open http://localhost:3000/admin/analytics/content
```

### 2. Test A/B Testing

**Create a test:**
1. Go to `/admin/analytics/ab-testing`
2. Click "New Test"
3. Select published article
4. Enter variant A (original title) and variant B (new title)
5. Create test

**Simulate traffic:**
```bash
# Record impressions
curl -X POST http://localhost:3000/api/analytics/ab-test \
  -H "Content-Type: application/json" \
  -d '{"action": "record", "testId": "uuid", "variant": "a", "eventType": "view"}'

curl -X POST http://localhost:3000/api/analytics/ab-test \
  -H "Content-Type: application/json" \
  -d '{"action": "record", "testId": "uuid", "variant": "b", "eventType": "view"}'
```

### 3. Submit Agent Feedback

**Via Admin UI:**
1. Go to `/admin/analytics/feedback`
2. Click "Submit Feedback"
3. Select article and agent
4. Rate performance (1-5)
5. Add comments

**Via API:**
```bash
curl -X POST http://localhost:3000/api/analytics/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "uuid",
    "agentType": "editorial_writer",
    "feedbackType": "quality",
    "feedbackScore": 4,
    "feedbackText": "Good structure but needs more examples"
  }'
```

---

## Full Pipeline Test (Automated)

Run the complete pipeline from scan to publish:

```bash
curl -X POST http://localhost:3000/api/admin/pipeline \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "run_full",
    "topics": ["building design systems with AI assistance"]
  }'
```

This will:
1. Scan for trends
2. Generate insights
3. Auto-create briefs (if auto-approve enabled)
4. Generate drafts
5. Run editorial review
6. Queue for human approval

---

## Troubleshooting

### "No LLM API key configured"

```bash
# Check your .env.local
echo $GOOGLE_GEMINI_API_KEY

# Or set it
export GOOGLE_GEMINI_API_KEY=your-key
```

### "Gemini API error: 429"

Rate limited. Wait a few minutes or check your quota at https://ai.google.dev

### "No response from Gemini"

Check if your prompt triggered safety filters. Review the prompt content.

### Draft not generating properly

1. Check agent run logs: `/admin/pipeline` > "View Runs"
2. Look for error_message in failed runs
3. Verify brief has sufficient detail

### Analytics not recording

1. Check browser console for errors
2. Verify Supabase tables exist
3. Check localStorage isn't blocked

---

## Quick Reference

| Action | Admin URL | API Endpoint |
|--------|-----------|--------------|
| Scan trends | `/admin/pipeline` | `POST /api/admin/pipeline` (action: scan) |
| View insights | `/admin/pipeline/insights` | `GET /api/admin/pipeline/insights` |
| View briefs | `/admin/pipeline/briefs` | `GET /api/admin/pipeline/briefs` |
| View drafts | `/admin/pipeline/drafts` | `GET /api/admin/pipeline/drafts` |
| Content analytics | `/admin/analytics/content` | `GET /api/analytics/article` |
| A/B testing | `/admin/analytics/ab-testing` | `GET/POST /api/analytics/ab-test` |
| Agent feedback | `/admin/analytics/feedback` | `GET/POST /api/analytics/feedback` |

---

## Next Steps

1. **Get Gemini API Key**: https://ai.google.dev (free credits available)
2. **Add to .env.local**: `GOOGLE_GEMINI_API_KEY=your-key`
3. **Start dev server**: `npm run dev`
4. **Open pipeline**: http://localhost:3000/admin/pipeline
5. **Run your first scan!**
