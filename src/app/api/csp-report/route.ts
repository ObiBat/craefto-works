import { NextResponse } from "next/server";

type CspReport = Record<string, unknown>;

const field = (report: CspReport, ...keys: string[]) => {
  for (const key of keys) if (typeof report[key] === "string" && report[key]) return report[key] as string;
  return "?";
};

/**
 * Receives Content-Security-Policy violation reports (the report-only header
 * in next.config.ts), both the legacy report-uri format and the Reporting
 * API's, and logs one compact line per violation for the Vercel runtime logs.
 */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 20_000) return new NextResponse(null, { status: 413 });

  let reports: CspReport[] = [];
  try {
    const body: unknown = JSON.parse(text);
    if (Array.isArray(body)) {
      // Reporting API: [{ type: "csp-violation", body: {...} }, ...]
      reports = body
        .filter((r): r is { type?: string; body: CspReport } => typeof r === "object" && r !== null && "body" in r)
        .filter((r) => !r.type || r.type === "csp-violation")
        .map((r) => r.body);
    } else if (typeof body === "object" && body !== null) {
      // report-uri: { "csp-report": {...} }
      const legacy = (body as Record<string, unknown>)["csp-report"];
      if (typeof legacy === "object" && legacy !== null) reports = [legacy as CspReport];
    }
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  for (const report of reports.slice(0, 20)) {
    const directive = field(report, "effectiveDirective", "effective-directive", "violated-directive");
    const blocked = field(report, "blockedURL", "blocked-uri");
    const page = field(report, "documentURL", "document-uri");
    const sample = field(report, "sample", "script-sample");
    console.warn(`[csp] ${directive} blocked ${blocked} on ${page}${sample !== "?" ? ` (${sample.slice(0, 80)})` : ""}`);
  }
  return new NextResponse(null, { status: 204 });
}
