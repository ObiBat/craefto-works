import { NextRequest, NextResponse } from 'next/server';
import { subscribeToJournal, type SubscribeResult } from '@/lib/subscribers';

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 5; // requests per hour per IP
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

    // Validate email
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = body.email.trim().toLowerCase();

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    // Honeypot check (if a hidden field is filled, it's a bot)
    if (body.website_url) {
      // Silently reject but return success to not alert bots
      return NextResponse.json({ success: true });
    }

    const result = await subscribeToJournal(email, body.source || 'journal_page');
    if (result === 'failed') {
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }
    const replies: Record<Exclude<SubscribeResult, 'failed'>, { message: string; alreadySubscribed?: boolean }> = {
      already: { message: 'You\'re already subscribed!', alreadySubscribed: true },
      resubscribed: { message: 'Welcome back! You\'re now subscribed.' },
      confirmed: { message: 'You\'re now subscribed!', alreadySubscribed: true },
      subscribed: { message: 'You\'re now subscribed!' },
    };
    return NextResponse.json({ success: true, ...replies[result] });
  } catch (error) {
    console.error('Subscription error:', error);
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
    endpoint: '/api/subscribe',
    methods: ['POST'],
  });
}
