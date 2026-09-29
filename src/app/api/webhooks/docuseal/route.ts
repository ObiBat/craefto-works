import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/documents';
import { Resend } from 'resend';
import { EMAIL_FROM } from '@/lib/resend';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;
let resend: Resend;

function initClients() {
  if (!supabase) supabase = createServerClient();
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
}

interface DocuSealWebhookPayload {
  event_type: string;
  timestamp: string;
  data: {
    id: number;
    submission_id?: number;
    email?: string;
    name?: string;
    role?: string;
    status?: string;
    completed_at?: string;
    opened_at?: string;
    ip?: string;
    ua?: string;
    documents?: Array<{
      name: string;
      url: string;
    }>;
    submitters?: Array<{
      id: number;
      email: string;
      name: string;
      status: string;
      completed_at?: string;
    }>;
  };
}

// POST /api/webhooks/docuseal - Handle DocuSeal signing events
export async function POST(request: NextRequest) {
  try {
    initClients();
    const rawBody = await request.text();

    // Verify the webhook signature when a secret is configured. A missing
    // signature is rejected too, or anyone could post forged signing events.
    const signature = request.headers.get('x-docuseal-signature');
    if (process.env.DOCUSEAL_WEBHOOK_SECRET) {
      const isValid = !!signature && verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload: DocuSealWebhookPayload = JSON.parse(rawBody);
    const { event_type, data } = payload;

    console.log('DocuSeal webhook received:', event_type, data.id);

    switch (event_type) {
      case 'submitter.opened':
        await handleSubmitterOpened(data);
        break;

      case 'submitter.completed':
        await handleSubmitterCompleted(data);
        break;

      case 'submission.completed':
        await handleSubmissionCompleted(data);
        break;

      case 'submission.expired':
        await handleSubmissionExpired(data);
        break;

      default:
        console.log('Unhandled webhook event:', event_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing DocuSeal webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Handle when a signer opens the document
async function handleSubmitterOpened(data: DocuSealWebhookPayload['data']) {
  const submitterId = String(data.id);

  // Update signature record
  const { data: signature, error } = await supabase
    .from('document_signatures')
    .update({
      status: 'viewed',
      viewed_at: data.opened_at || new Date().toISOString(),
    })
    .eq('docuseal_submitter_id', submitterId)
    .select('document_id, signer_name, signer_email')
    .single();

  if (error || !signature) {
    console.error('Failed to update signature for submitter:', submitterId, error);
    return;
  }

  // Log activity
  await supabase.from('document_activities').insert({
    document_id: signature.document_id,
    activity_type: 'viewed',
    actor: signature.signer_email,
    description: `${signature.signer_name} viewed the document`,
  });
}

// Handle when a signer completes signing
async function handleSubmitterCompleted(data: DocuSealWebhookPayload['data']) {
  const submitterId = String(data.id);

  // Update signature record
  const { data: signature, error } = await supabase
    .from('document_signatures')
    .update({
      status: 'signed',
      signed_at: data.completed_at || new Date().toISOString(),
      ip_address: data.ip || null,
      user_agent: data.ua || null,
    })
    .eq('docuseal_submitter_id', submitterId)
    .select('document_id, signer_name, signer_email, signer_role')
    .single();

  if (error || !signature) {
    console.error('Failed to update signature for submitter:', submitterId, error);
    return;
  }

  // Log activity
  await supabase.from('document_activities').insert({
    document_id: signature.document_id,
    activity_type: 'signed',
    actor: signature.signer_email,
    description: `${signature.signer_name} (${signature.signer_role}) signed the document`,
    ip_address: data.ip || null,
    metadata: {
      signed_at: data.completed_at,
      ip: data.ip,
    },
  });

  // Notify admin of signature
  await notifyAdminOfSignature(signature);
}

// Handle when all signers have completed
async function handleSubmissionCompleted(data: DocuSealWebhookPayload['data']) {
  const submissionId = String(data.id);

  // Find document by submission ID
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*, lead:leads(name, email, company)')
    .eq('docuseal_submission_id', submissionId)
    .single();

  if (docError || !document) {
    console.error('Document not found for submission:', submissionId, docError);
    return;
  }

  // Download signed PDF from DocuSeal
  let signedPdfPath: string | null = null;
  if (data.documents && data.documents.length > 0) {
    try {
      const signedPdfUrl = data.documents[0].url;
      const response = await fetch(signedPdfUrl);

      if (response.ok) {
        const pdfBuffer = Buffer.from(await response.arrayBuffer());
        signedPdfPath = `documents/${document.id}/${document.document_number}-signed.pdf`;

        await supabase.storage
          .from('documents')
          .upload(signedPdfPath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });
      }
    } catch (pdfError) {
      console.error('Failed to download signed PDF:', pdfError);
    }
  }

  // Update document status
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_pdf_storage_path: signedPdfPath,
    })
    .eq('id', document.id);

  if (updateError) {
    console.error('Failed to update document status:', updateError);
  }

  // Update all signature records
  await supabase
    .from('document_signatures')
    .update({ status: 'signed' })
    .eq('document_id', document.id)
    .eq('status', 'sent');

  // Log activity
  await supabase.from('document_activities').insert({
    document_id: document.id,
    activity_type: 'completed',
    actor: 'system',
    description: 'All parties have signed the document',
    metadata: {
      submission_id: submissionId,
      signed_pdf_path: signedPdfPath,
    },
  });

  // Send completion emails to all parties
  await sendCompletionEmails(document, signedPdfPath);
}

// Handle when submission expires
async function handleSubmissionExpired(data: DocuSealWebhookPayload['data']) {
  const submissionId = String(data.id);

  // Find and update document
  const { data: document, error } = await supabase
    .from('documents')
    .update({ status: 'expired' })
    .eq('docuseal_submission_id', submissionId)
    .select('id, document_number, title')
    .single();

  if (error || !document) {
    console.error('Document not found for expired submission:', submissionId);
    return;
  }

  // Log activity
  await supabase.from('document_activities').insert({
    document_id: document.id,
    activity_type: 'expired',
    actor: 'system',
    description: 'Document signature request has expired',
  });
}

// Notify admin when a signature is received
async function notifyAdminOfSignature(signature: {
  document_id: string;
  signer_name: string;
  signer_email: string;
  signer_role: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  // Get document details
  const { data: document } = await supabase
    .from('documents')
    .select('document_number, title, document_type')
    .eq('id', signature.document_id)
    .single();

  if (!document) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: adminEmail,
      subject: `Signature Received: ${document.document_number}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Signature Received</h2>
          <p>${signature.signer_name} (${signature.signer_role}) has signed the following document:</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Document:</strong> ${document.title}</p>
            <p style="margin: 8px 0 0 0;"><strong>Number:</strong> ${document.document_number}</p>
            <p style="margin: 8px 0 0 0;"><strong>Signer:</strong> ${signature.signer_name} (${signature.signer_email})</p>
          </div>
          <p style="color: #666;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/documents/${signature.document_id}" style="color: #0066cc;">View Document</a>
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send admin notification:', emailError);
  }
}

// Send completion emails to all parties
async function sendCompletionEmails(
  document: {
    id: string;
    document_number: string;
    title: string;
    document_type: string;
    lead?: { name: string; email: string; company: string } | null;
  },
  signedPdfPath: string | null
) {
  const adminEmail = process.env.ADMIN_EMAIL;

  // Get signed PDF URL if available
  let pdfUrl: string | null = null;
  if (signedPdfPath) {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(signedPdfPath, 60 * 60 * 24 * 7); // 7 days
    pdfUrl = data?.signedUrl || null;
  }

  const emailContent = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Document Fully Signed</h2>
      <p>All parties have signed the following document:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Document:</strong> ${document.title}</p>
        <p style="margin: 8px 0 0 0;"><strong>Number:</strong> ${document.document_number}</p>
      </div>
      ${pdfUrl ? `<p><a href="${pdfUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Download Signed PDF</a></p>` : ''}
      <p style="color: #666; font-size: 14px;">This signed document is stored securely for your records.</p>
    </div>
  `;

  // Send to admin
  if (adminEmail) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: adminEmail,
        subject: `✓ Fully Signed: ${document.document_number}`,
        html: emailContent,
      });
    } catch (error) {
      console.error('Failed to send admin completion email:', error);
    }
  }

  // Send to client
  if (document.lead?.email) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: document.lead.email,
        subject: `Your Signed Document: ${document.document_number}`,
        html: emailContent.replace(
          'All parties have signed',
          `Hi ${document.lead.name || 'there'},\n\nAll parties have signed`
        ),
      });
    } catch (error) {
      console.error('Failed to send client completion email:', error);
    }
  }
}
