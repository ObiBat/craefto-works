import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { resend, EMAIL_FROM, ADMIN_EMAIL } from '@/lib/resend';
import { LeadConfirmationEmail, getLeadConfirmationSubject } from '@/emails/lead-confirmation';
import { AdminNotificationEmail, getAdminNotificationSubject } from '@/emails/admin-notification';
import { enquiryPhrase } from '@/lib/enquiry';

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 5; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Lead scoring algorithm
function calculateLeadScore(data: {
  budget?: string | null;
  timeline?: string | null;
  service?: string | null;
  company?: string | null;
  message?: string | null;
}): number {
  let score = 0;

  // Budget scoring (0-40 points)
  const budgetScores: Record<string, number> = {
    '50k+': 40,
    '25-50k': 35,
    '10-25k': 25,
    '5-10k': 15,
    '3-5k': 10,
    'under-3k': 5,
    // A monthly plan is recurring: a year of the smallest is about A$29k.
    'monthly': 35,
    'discuss': 5,
  };
  score += budgetScores[data.budget || ''] || 0;

  // Timeline scoring (0-25 points)
  const timelineScores: Record<string, number> = {
    'asap': 25,
    '1-3months': 20,
    '3-6months': 10,
    'flexible': 5,
  };
  score += timelineScores[data.timeline || ''] || 0;

  // Service scoring (0-15 points)
  const serviceScores: Record<string, number> = {
    'saas': 15,
    'ai': 15,
    'web': 12,
    'brand': 10,
    'other': 5,
  };
  score += serviceScores[data.service || ''] || 0;

  // Company name bonus (0-10 points)
  if (data.company && data.company.trim().length > 0) {
    score += 10;
  }

  // Message engagement (0-10 points)
  const messageLength = data.message?.length || 0;
  if (messageLength > 200) score += 10;
  else if (messageLength > 100) score += 7;
  else if (messageLength > 50) score += 4;

  return Math.min(score, 100); // Cap at 100
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    // Honeypot check (if a hidden field is filled, it's a bot)
    if (body.website_url) {
      // Silently reject but return success to not alert bots
      return NextResponse.json({ success: true, id: 'honeypot' });
    }

    // Calculate lead score
    const leadScore = calculateLeadScore({
      budget: body.budget,
      timeline: body.timeline,
      service: body.service,
      company: body.company,
      message: body.message,
    });

    // Prepare lead data (field names match database schema)
    const leadData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      company: body.company?.trim() || null,
      phone: body.phone?.trim() || null,
      service_interest: body.service || null,
      budget_range: body.budget || null,
      timeline: body.timeline || null,
      message: body.message?.trim() || null,
      score: leadScore,
      source: 'website',
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      referrer: request.headers.get('referer') || null,
      landing_page: body.landing_page || null,
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || null,
    };

    // Insert lead into Supabase
    const supabase = createServerClient();
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert lead:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit. Please try again.' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      type: 'form_submission',
      title: 'Form submitted',
      description: `Lead submitted contact form from ${leadData.source}`,
      metadata: {
        form_data: leadData,
        ip: ip,
      },
    });

    // Send confirmation email to lead
    if (process.env.RESEND_API_KEY) {
      try {
        const confirmationResult = await resend.emails.send({
          from: EMAIL_FROM,
          to: lead.email,
          subject: getLeadConfirmationSubject(lead.name),
          html: LeadConfirmationEmail({
            name: lead.name,
            service: enquiryPhrase(lead.service_interest)
          }),
        });

        // Log email sent
        await supabase.from('email_logs').insert({
          lead_id: lead.id,
          to_email: lead.email,
          from_email: EMAIL_FROM,
          subject: getLeadConfirmationSubject(lead.name),
          template: 'lead-confirmation',
          status: 'sent',
          resend_id: confirmationResult.data?.id,
        });

        // Log activity
        await supabase.from('lead_activities').insert({
          lead_id: lead.id,
          type: 'email_sent',
          title: 'Confirmation email sent',
          description: `Sent confirmation email to ${lead.email}`,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      // Send notification email to admin
      try {
        const adminResult = await resend.emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: getAdminNotificationSubject(lead),
          html: AdminNotificationEmail({ lead, leadId: lead.id }),
        });

        // Log admin email
        await supabase.from('email_logs').insert({
          lead_id: lead.id,
          to_email: ADMIN_EMAIL,
          from_email: EMAIL_FROM,
          subject: getAdminNotificationSubject(lead),
          template: 'admin-notification',
          status: 'sent',
          resend_id: adminResult.data?.id,
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      id: lead.id,
      message: 'Thank you! We\'ll be in touch soon.',
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/leads',
    methods: ['POST'],
  });
}
