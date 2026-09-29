// Document Generator - Template Population Logic

import { promises as fs } from 'fs';
import path from 'path';
import type {
  DocumentType,
  ProposalContent,
  SOWContent,
  InvoiceContent,
  ChangeOrderContent,
  LeadForDocument,
  LeadAnalysisForDocument,
} from './types';
import {
  DOCUMENT_TEMPLATES,
  generateDefaultProposalContent,
  generateDefaultSOWContent,
  generateDefaultInvoiceContent,
  formatCurrency,
  formatDate,
} from './templates';

// ============================================
// PLACEHOLDER REPLACEMENT
// ============================================

/**
 * Normalize a placeholder key to match content object keys
 * e.g., "Client Company" -> "clientCompany"
 */
function normalizeKey(key: string): string {
  return key
    .trim()
    .split(/\s+/)
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

/**
 * Get a value from nested object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Format a value for display in the document
 */
function formatValue(value: unknown, key: string): string {
  if (value === null || value === undefined) {
    return `[${key}]`; // Keep placeholder if no value
  }

  if (typeof value === 'number') {
    // Check if it looks like a currency field
    if (
      key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('price') ||
      key.toLowerCase().includes('total') ||
      key.toLowerCase().includes('subtotal') ||
      key.toLowerCase().includes('investment')
    ) {
      return formatCurrency(value);
    }
    return value.toString();
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
}

/**
 * Replace placeholders in HTML template with content values
 * Handles [Placeholder Name] syntax
 */
export function populatePlaceholders(
  html: string,
  content: Record<string, unknown>
): string {
  // Replace [Placeholder Name] patterns
  return html.replace(/\[([^\]]+)\]/g, (match, placeholder) => {
    const normalizedKey = normalizeKey(placeholder);

    // Try direct key match
    let value = content[normalizedKey];

    // Try lowercase key match
    if (value === undefined) {
      value = content[placeholder.toLowerCase().replace(/\s+/g, '_')];
    }

    // Try exact key match
    if (value === undefined) {
      value = content[placeholder];
    }

    // Try nested path
    if (value === undefined && placeholder.includes('.')) {
      value = getNestedValue(content, placeholder);
    }

    return formatValue(value, placeholder);
  });
}

/**
 * Generate HTML for timeline phases
 */
function generateTimelineHTML(phases: ProposalContent['timeline']): string {
  if (!phases || phases.length === 0) return '';

  return phases
    .map(
      (phase, index) => `
      <div class="timeline-phase" style="--phase-color: ${phase.color}">
        <div class="phase-number">${index + 1}</div>
        <div class="phase-content">
          <h4>${phase.name}</h4>
          <p class="phase-duration">${phase.duration}</p>
          ${phase.description ? `<p class="phase-description">${phase.description}</p>` : ''}
        </div>
      </div>
    `
    )
    .join('');
}

/**
 * Generate HTML for scope items table
 */
function generateScopeTableHTML(items: ProposalContent['scope']): string {
  if (!items || items.length === 0) return '';

  return items
    .map(
      (item) => `
      <tr>
        <td class="scope-deliverable">${item.deliverable}</td>
        <td class="scope-description">${item.description}</td>
        <td class="scope-included">${item.included ? '✓' : '—'}</td>
      </tr>
    `
    )
    .join('');
}

/**
 * Generate HTML for pricing tiers
 */
function generatePricingTiersHTML(tiers: ProposalContent['pricingTiers']): string {
  if (!tiers || tiers.length === 0) return '';

  return tiers
    .map(
      (tier) => `
      <div class="pricing-tier ${tier.recommended ? 'recommended' : ''}">
        ${tier.recommended ? '<div class="recommended-badge">Recommended</div>' : ''}
        <h4 class="tier-name">${tier.name}</h4>
        <div class="tier-price">${formatCurrency(tier.price)}</div>
        <div class="tier-duration">${tier.duration}</div>
        <ul class="tier-features">
          ${tier.features.map((f) => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `
    )
    .join('');
}

/**
 * Generate HTML for payment schedule table
 */
function generatePaymentScheduleHTML(schedule: ProposalContent['paymentSchedule']): string {
  if (!schedule || schedule.length === 0) return '';

  return schedule
    .map(
      (item) => `
      <tr>
        <td>${item.description}</td>
        <td>${item.percentage}%</td>
        <td>${formatCurrency(item.amount)}</td>
      </tr>
    `
    )
    .join('');
}

/**
 * Generate HTML for SOW phases
 */
function generateSOWPhasesHTML(phases: SOWContent['phases']): string {
  if (!phases || phases.length === 0) return '';

  return phases
    .map(
      (phase) => `
      <div class="sow-phase">
        <h4>Phase ${phase.number}: ${phase.name}</h4>
        <ul>
          ${phase.deliverables.map((d) => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    `
    )
    .join('');
}

/**
 * Generate HTML for invoice line items
 */
function generateLineItemsHTML(items: InvoiceContent['lineItems']): string {
  if (!items || items.length === 0) return '';

  return items
    .map(
      (item) => `
      <tr>
        <td class="item-description">${item.description}</td>
        <td>${item.quantity}</td>
        <td class="item-amount">${formatCurrency(item.unitPrice)}</td>
        <td class="item-amount">${formatCurrency(item.amount)}</td>
      </tr>
    `
    )
    .join('');
}

/**
 * Generate HTML for exclusions list
 */
function generateExclusionsHTML(exclusions: string[]): string {
  if (!exclusions || exclusions.length === 0) return '';

  return exclusions.map((e) => `<li>${e}</li>`).join('');
}

// ============================================
// TEMPLATE LOADING
// ============================================

/**
 * Load HTML template from file
 */
export async function loadTemplate(documentType: DocumentType): Promise<string> {
  const template = DOCUMENT_TEMPLATES[documentType];
  if (!template) {
    throw new Error(`Unknown document type: ${documentType}`);
  }

  const templatePath = path.join(process.cwd(), 'public', template.html_path);

  try {
    const html = await fs.readFile(templatePath, 'utf-8');
    return html;
  } catch {
    throw new Error(`Failed to load template: ${templatePath}`);
  }
}

// ============================================
// DOCUMENT GENERATION
// ============================================

/**
 * Generate a complete document from lead data
 */
export async function generateDocument(
  documentType: DocumentType,
  lead: LeadForDocument,
  analysis?: LeadAnalysisForDocument,
  customizations?: Partial<ProposalContent | SOWContent | InvoiceContent>
): Promise<{
  content: ProposalContent | SOWContent | InvoiceContent | ChangeOrderContent;
  html: string;
}> {
  // Generate default content based on document type
  let content: ProposalContent | SOWContent | InvoiceContent | ChangeOrderContent;

  switch (documentType) {
    case 'proposal':
      content = {
        ...generateDefaultProposalContent(lead, analysis),
        ...(customizations as Partial<ProposalContent>),
      };
      break;

    case 'sow':
      content = {
        ...generateDefaultSOWContent(lead, customizations as Partial<ProposalContent>, analysis),
        ...(customizations as Partial<SOWContent>),
      };
      break;

    case 'invoice':
      content = {
        ...generateDefaultInvoiceContent(lead, customizations as Partial<SOWContent>),
        ...(customizations as Partial<InvoiceContent>),
      };
      break;

    case 'change_order':
      content = customizations as ChangeOrderContent;
      break;

    default:
      throw new Error(`Unsupported document type: ${documentType}`);
  }

  // Load and populate template
  const templateHtml = await loadTemplate(documentType);

  // Flatten content for placeholder replacement
  const flatContent = flattenContent(content as unknown as Record<string, unknown>);

  // Replace placeholders
  let html = populatePlaceholders(templateHtml, flatContent);

  // Replace structured content sections
  if (documentType === 'proposal') {
    const proposalContent = content as ProposalContent;
    html = html.replace(
      /<!-- TIMELINE_PHASES -->/g,
      generateTimelineHTML(proposalContent.timeline)
    );
    html = html.replace(
      /<!-- SCOPE_TABLE_ROWS -->/g,
      generateScopeTableHTML(proposalContent.scope)
    );
    html = html.replace(
      /<!-- PRICING_TIERS -->/g,
      generatePricingTiersHTML(proposalContent.pricingTiers)
    );
    html = html.replace(
      /<!-- PAYMENT_SCHEDULE_ROWS -->/g,
      generatePaymentScheduleHTML(proposalContent.paymentSchedule)
    );
    html = html.replace(
      /<!-- EXCLUSIONS_LIST -->/g,
      generateExclusionsHTML(proposalContent.exclusions)
    );
  }

  if (documentType === 'sow') {
    const sowContent = content as SOWContent;
    html = html.replace(
      /<!-- SOW_PHASES -->/g,
      generateSOWPhasesHTML(sowContent.phases)
    );
    html = html.replace(
      /<!-- PAYMENT_SCHEDULE_ROWS -->/g,
      generatePaymentScheduleHTML(sowContent.paymentSchedule)
    );
    html = html.replace(
      /<!-- EXCLUSIONS_LIST -->/g,
      generateExclusionsHTML(sowContent.exclusions)
    );
  }

  if (documentType === 'invoice') {
    const invoiceContent = content as InvoiceContent;
    html = html.replace(
      /<!-- LINE_ITEMS_ROWS -->/g,
      generateLineItemsHTML(invoiceContent.lineItems)
    );
  }

  return { content, html };
}

/**
 * Flatten nested content object for placeholder replacement
 */
function flattenContent(
  content: Record<string, unknown>,
  prefix: string = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(content)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Recursively flatten nested objects
      Object.assign(result, flattenContent(value as Record<string, unknown>, fullKey));
    }

    // Also store at the simple key level
    result[key] = value;
    result[fullKey] = value;
  }

  return result;
}

// ============================================
// CONTENT PREVIEW
// ============================================

/**
 * Generate a preview-safe version of content (with placeholder markers visible)
 */
export function generatePreviewContent(
  content: ProposalContent | SOWContent | InvoiceContent | ChangeOrderContent
): Record<string, string> {
  const preview: Record<string, string> = {};
  const flat = flattenContent(content as unknown as Record<string, unknown>);

  for (const [key, value] of Object.entries(flat)) {
    if (value === null || value === undefined || value === '') {
      preview[key] = `[${key}]`;
    } else {
      preview[key] = formatValue(value, key);
    }
  }

  return preview;
}

/**
 * Validate that all required placeholders have values
 */
export function validateContent(
  documentType: DocumentType,
  content: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const template = DOCUMENT_TEMPLATES[documentType];
  if (!template) {
    return { valid: false, missing: ['Unknown document type'] };
  }

  const missing: string[] = [];

  for (const placeholder of template.placeholders) {
    if (placeholder.required) {
      const value = content[placeholder.key];
      if (value === null || value === undefined || value === '') {
        missing.push(placeholder.label);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// ============================================
// EXPORT UTILITIES
// ============================================

export {
  formatCurrency,
  formatDate,
  normalizeKey,
  flattenContent,
};
