// Software the workflow graph shows connecting to each stage: real tools that
// Australian subcontractors and their crews already use, which a system can
// connect to where they offer an API. Each logo is the brand's own artwork,
// from its website (or Google's, and Wikimedia Commons' copies of the
// Microsoft, Meta and WhatsApp marks), in public/images/integrations.
// The logos are their owners' trademarks; the page says so.

export interface App {
  name: string;
  src: string;
  /** A square, full-colour tile (rounded like an app icon) rather than a glyph. */
  tile?: boolean;
}

export const APPS = {
  procore: { name: "Procore", src: "/images/integrations/procore.png", tile: true },
  drive: { name: "Google Drive", src: "/images/integrations/google-drive.png" },
  excel: { name: "Microsoft Excel", src: "/images/integrations/excel.svg" },
  sheets: { name: "Google Sheets", src: "/images/integrations/google-sheets.png" },
  assignar: { name: "Assignar", src: "/images/integrations/assignar.png" },
  deputy: { name: "Deputy", src: "/images/integrations/deputy.png" },
  calendar: { name: "Google Calendar", src: "/images/integrations/google-calendar.png" },
  telegram: { name: "Telegram", src: "/images/integrations/telegram.svg", tile: true },
  gmail: { name: "Gmail", src: "/images/integrations/gmail.png" },
  whatsapp: { name: "WhatsApp", src: "/images/integrations/whatsapp.svg" },
  twilio: { name: "Twilio (SMS)", src: "/images/integrations/twilio.png", tile: true },
  maps: { name: "Google Maps", src: "/images/integrations/google-maps.svg" },
  powerbi: { name: "Power BI", src: "/images/integrations/power-bi.svg" },
  facebook: { name: "Facebook", src: "/images/integrations/facebook.svg" },
  xero: { name: "Xero", src: "/images/integrations/xero.svg", tile: true },
  myob: { name: "MYOB", src: "/images/integrations/myob.png", tile: true },
  quickbooks: { name: "QuickBooks", src: "/images/integrations/quickbooks.png" },
  employmenthero: { name: "Employment Hero", src: "/images/integrations/employment-hero.png" },
  reckon: { name: "Reckon", src: "/images/integrations/reckon.svg" },
} satisfies Record<string, App>;

export type AppId = keyof typeof APPS;
