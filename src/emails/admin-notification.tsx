// System font stack matching the codebase (Space Grotesk style fallback)
const FONT_STACK = "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

interface AdminNotificationEmailProps {
  lead: {
    name: string;
    email: string;
    company?: string;
    service?: string;
    budget?: string;
    timeline?: string;
    message?: string;
    source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
  leadId: string;
}

export function AdminNotificationEmail({ lead, leadId }: AdminNotificationEmailProps) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead: ${lead.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1f; font-family: ${FONT_STACK};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1a1a1f;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 560px; margin-bottom: 20px;">
          <tr>
            <td style="text-align: center; padding-bottom: 10px;">
              
              <span style="margin-left: 8px; font-family: ${FONT_STACK}; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; color: #6B6B6B; vertical-align: middle;">
                Craefto
              </span>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #252529; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="width: 12px; height: 12px; background-color: #FFFFFF; border-radius: 50%; display: inline-block; vertical-align: middle;"></div>
                    <span style="margin-left: 10px; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px; vertical-align: middle;">
                      New Lead
                    </span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 0; font-family: ${FONT_STACK}; font-size: 28px; font-weight: 700; color: #FFFFFF;">
                ${lead.name}
              </h1>
              ${lead.company ? `<p style="margin: 8px 0 0; font-family: ${FONT_STACK}; font-size: 16px; color: rgba(255,255,255,0.8);">${lead.company}</p>` : ''}
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 30px 40px; border-bottom: 1px solid #333338;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #333338;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6B6B;">Email</span>
                    <div style="margin-top: 4px;">
                      <a href="mailto:${lead.email}" style="font-size: 16px; color: #FFFFFF; text-decoration: none;">${lead.email}</a>
                    </div>
                  </td>
                </tr>
                ${lead.service ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #333338;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6B6B;">Service Interest</span>
                    <div style="margin-top: 4px; font-size: 16px; color: #FFFFFF;">${lead.service}</div>
                  </td>
                </tr>
                ` : ''}
                ${lead.budget ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #333338;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6B6B;">Budget Range</span>
                    <div style="margin-top: 4px; font-size: 16px; color: #10B981; font-weight: 600;">${lead.budget}</div>
                  </td>
                </tr>
                ` : ''}
                ${lead.timeline ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #333338;">
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6B6B;">Timeline</span>
                    <div style="margin-top: 4px; font-size: 16px; color: #FFFFFF;">${lead.timeline}</div>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Message -->
          ${lead.message ? `
          <tr>
            <td style="padding: 30px 40px; border-bottom: 1px solid #333338;">
              <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6B6B;">Message</span>
              <div style="margin-top: 12px; padding: 20px; background-color: #1a1a1f; border-radius: 8px; border-left: 3px solid #10B981;">
                <p style="margin: 0; font-size: 15px; color: #CCCCCC; line-height: 1.6; white-space: pre-wrap;">${lead.message}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Source Attribution -->
          ${(lead.utm_source || lead.utm_medium || lead.utm_campaign) ? `
          <tr>
            <td style="padding: 20px 40px; border-bottom: 1px solid #333338;">
              <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6B6B;">Attribution</span>
              <div style="margin-top: 8px; display: flex; gap: 12px; flex-wrap: wrap;">
                ${lead.utm_source ? `<span style="padding: 4px 10px; background-color: #1a1a1f; border-radius: 4px; font-size: 12px; color: #9A9A9A;">${lead.utm_source}</span>` : ''}
                ${lead.utm_medium ? `<span style="padding: 4px 10px; background-color: #1a1a1f; border-radius: 4px; font-size: 12px; color: #9A9A9A;">${lead.utm_medium}</span>` : ''}
                ${lead.utm_campaign ? `<span style="padding: 4px 10px; background-color: #1a1a1f; border-radius: 4px; font-size: 12px; color: #9A9A9A;">${lead.utm_campaign}</span>` : ''}
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 30px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="mailto:${lead.email}" style="display: inline-block; padding: 14px 28px; background-color: #10B981; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Reply to ${lead.name.split(' ')[0]}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #1a1a1f;">
              <p style="margin: 0; font-size: 12px; color: #6B6B6B;">
                Lead ID: ${leadId}<br>
                Received: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getAdminNotificationSubject(lead: { name: string; company?: string; budget?: string }): string {
  const parts = ['🟢 New Lead:', lead.name];
  if (lead.company) parts.push(`(${lead.company})`);
  if (lead.budget) parts.push(`— ${lead.budget}`);
  return parts.join(' ');
}
