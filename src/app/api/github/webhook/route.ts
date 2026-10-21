import { after, NextResponse, type NextRequest } from "next/server";
import { siteOrigin } from "@/lib/portal/origin";
import { draftFromPullRequest, finishDraft, projectFor, recordPush, signedByGithub, type GithubPullRequestEvent, type GithubPush } from "@/lib/portal/work";
import { repoName } from "@/lib/portal/work-rules";

export const dynamic = "force-dynamic";

/**
 * GitHub, for client repositories connected in admin (lib/portal/work.ts):
 * pushes record their commits' times, and a pull request merged into the
 * main branch becomes a draft for Craefto to check. Signed with
 * GITHUB_WEBHOOK_SECRET; a repository no client has is ignored. The AI's
 * draft and the alert to Obi's phone follow once GitHub has its answer.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const body = await request.text();
  if (!secret || !signedByGithub(body, request.headers.get("x-hub-signature-256"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Not JSON" }, { status: 400 });
  }
  const event = request.headers.get("x-github-event");
  if (event === "ping") return NextResponse.json({ ok: true });

  const repo = repoName(String((payload.repository as { full_name?: string } | undefined)?.full_name ?? ""));
  const project = repo ? await projectFor(repo) : null;
  if (!project) return NextResponse.json({ ok: true, ignored: "This repository isn't connected to a client." });

  try {
    if (event === "push") return NextResponse.json({ ok: true, commits: await recordPush(project, payload as unknown as GithubPush) });
    if (event === "pull_request") {
      const made = await draftFromPullRequest(project, payload as unknown as GithubPullRequestEvent);
      if (made) {
        const origin = await siteOrigin();
        after(() => finishDraft(made, origin));
      }
      return NextResponse.json({ ok: true, draft: made?.draft.id ?? null });
    }
  } catch (error) {
    console.error(`The GitHub ${event} event for ${repo} failed:`, error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ignored: event });
}
