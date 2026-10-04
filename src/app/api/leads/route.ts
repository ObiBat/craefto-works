import { NextRequest, NextResponse } from "next/server";
import { createLead, firstProblem, leadInputSchema, tooManyFrom } from "@/lib/leads";

// The enquiry form (components/forms/contact-form.tsx). Validation, scoring,
// the emails and the owner's alert live in lib/leads.ts, shared with
// Discovery Call bookings.

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
    }

    // Honeypot: a hidden field only bots fill in. Answer as if it worked.
    if (body.website_url) {
      return NextResponse.json({ success: true, id: "honeypot" });
    }

    const parsed = leadInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstProblem(parsed.error) }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    if (await tooManyFrom(ip)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const lead = await createLead(parsed.data, {
      source: "website",
      ip,
      userAgent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer"),
    });

    return NextResponse.json({ success: true, id: lead.id, message: "Thank you! We'll be in touch soon." });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/api/leads", methods: ["POST"] });
}
