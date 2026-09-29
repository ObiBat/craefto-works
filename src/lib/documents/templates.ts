// Document Template Definitions & Defaults

import type {
  DocumentType,
  DocumentTemplate,
  LeadForDocument,
  LeadAnalysisForDocument,
  ProposalContent,
  SOWContent,
  InvoiceContent,
  TimelinePhase,
  ScopeItem,
  PricingTier,
  PaymentMilestone,
  SOWPhase,
} from './types';

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

export const DOCUMENT_TEMPLATES: Record<DocumentType, DocumentTemplate> = {
  proposal: {
    id: 'proposal-v1',
    name: 'Project Proposal',
    type: 'proposal',
    html_path: '/client-hub/04-proposal-template.html',
    version: 1,
    placeholders: [
      { key: 'projectName', label: 'Project Name', type: 'text', required: true },
      { key: 'clientCompany', label: 'Client Company', type: 'text', required: true },
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'clientEmail', label: 'Client Email', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'validUntil', label: 'Valid Until', type: 'date', required: true },
      { key: 'executiveSummary', label: 'Executive Summary', type: 'richtext', required: true },
      { key: 'understanding', label: 'Our Understanding', type: 'richtext', required: true },
      { key: 'approach', label: 'Our Approach', type: 'richtext', required: false },
      { key: 'selectedTier', label: 'Selected Tier', type: 'select', required: true, options: ['Foundation', 'Growth', 'Scale'] },
    ],
  },
  sow: {
    id: 'sow-v1',
    name: 'Statement of Work',
    type: 'sow',
    html_path: '/client-hub/05-sow-contract.html',
    version: 1,
    placeholders: [
      { key: 'projectName', label: 'Project Name', type: 'text', required: true },
      { key: 'sowNumber', label: 'SOW Number', type: 'text', required: true },
      { key: 'clientCompany', label: 'Client Company', type: 'text', required: true },
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'projectDuration', label: 'Project Duration', type: 'text', required: true },
      { key: 'estimatedCompletion', label: 'Estimated Completion', type: 'date', required: true },
      { key: 'projectOverview', label: 'Project Overview', type: 'richtext', required: true },
      { key: 'totalInvestment', label: 'Total Investment', type: 'currency', required: true },
    ],
  },
  invoice: {
    id: 'invoice-v1',
    name: 'Invoice',
    type: 'invoice',
    html_path: '/client-hub/09-invoice-template.html',
    version: 1,
    placeholders: [
      { key: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { key: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { key: 'clientCompany', label: 'Client Company', type: 'text', required: true },
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'total', label: 'Total', type: 'currency', required: true },
    ],
  },
  change_order: {
    id: 'change-order-v1',
    name: 'Change Order',
    type: 'change_order',
    html_path: '/client-hub/05-sow-contract.html', // Uses the Change tab
    version: 1,
    placeholders: [
      { key: 'changeOrderNumber', label: 'Change Order Number', type: 'text', required: true },
      { key: 'sowNumber', label: 'SOW Number', type: 'text', required: true },
      { key: 'projectName', label: 'Project Name', type: 'text', required: true },
      { key: 'description', label: 'Change Description', type: 'richtext', required: true },
      { key: 'budgetImpact', label: 'Budget Impact', type: 'currency', required: true },
    ],
  },
};

// ============================================
// SERVICE TYPE MAPPINGS
// ============================================

export const SERVICE_TYPE_NAMES: Record<string, string> = {
  brand: 'Brand Identity',
  web: 'Web Design & Development',
  saas: 'SaaS/Product Design',
  ai: 'AI/Automation Integration',
  other: 'Custom Project',
};

export const SERVICE_PROJECT_NAMES: Record<string, string> = {
  brand: 'Brand Identity Project',
  web: 'Web Design & Development Project',
  saas: 'SaaS Product Design & Build',
  ai: 'AI Integration Project',
  other: 'Custom Project',
};

// ============================================
// BUDGET TIER MAPPINGS
// ============================================

export const BUDGET_TO_TIER: Record<string, { tier: string; minPrice: number; maxPrice: number }> = {
  '3-5k': { tier: 'Foundation', minPrice: 3000, maxPrice: 5000 },
  '5-10k': { tier: 'Foundation', minPrice: 5000, maxPrice: 10000 },
  '10-25k': { tier: 'Growth', minPrice: 10000, maxPrice: 25000 },
  '25-50k': { tier: 'Scale', minPrice: 25000, maxPrice: 50000 },
  '50k+': { tier: 'Scale', minPrice: 50000, maxPrice: 100000 },
  'discuss': { tier: 'Growth', minPrice: 10000, maxPrice: 25000 },
};

// ============================================
// TIMELINE MAPPINGS
// ============================================

export const TIMELINE_TO_WEEKS: Record<string, { min: number; max: number }> = {
  'asap': { min: 4, max: 6 },
  '1-3months': { min: 4, max: 12 },
  '3-6months': { min: 12, max: 24 },
  'flexible': { min: 8, max: 16 },
};

// ============================================
// DEFAULT CONTENT GENERATORS
// ============================================

export function generateProjectName(lead: LeadForDocument): string {
  const serviceType = lead.service_interest || 'web';
  const projectName = SERVICE_PROJECT_NAMES[serviceType] || 'Custom Project';

  if (lead.company) {
    return `${lead.company} — ${projectName}`;
  }
  return projectName;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

// ============================================
// DEFAULT TIMELINE PHASES
// ============================================

export function getDefaultTimelinePhases(
  serviceType: string,
  complexity?: string
): TimelinePhase[] {
  const isComplex = complexity === 'High';

  const basePhases: TimelinePhase[] = [
    {
      name: 'Discovery & Strategy',
      duration: isComplex ? '2 weeks' : '1 week',
      color: '#3B82F6',
      description: 'Research, stakeholder interviews, strategy development',
    },
    {
      name: 'Design',
      duration: isComplex ? '3-4 weeks' : '2-3 weeks',
      color: '#8B5CF6',
      description: 'Visual design, prototyping, iteration',
    },
    {
      name: 'Development',
      duration: isComplex ? '4-6 weeks' : '3-4 weeks',
      color: '#10B981',
      description: 'Build, integration, testing',
    },
    {
      name: 'Launch & Support',
      duration: '1-2 weeks',
      color: '#F59E0B',
      description: 'Deployment, training, handover',
    },
  ];

  // Customize based on service type
  if (serviceType === 'brand') {
    basePhases[1].duration = isComplex ? '4-5 weeks' : '3-4 weeks';
    basePhases[2].name = 'Asset Production';
    basePhases[2].duration = isComplex ? '2-3 weeks' : '1-2 weeks';
  }

  return basePhases;
}

// ============================================
// DEFAULT SCOPE ITEMS
// ============================================

export function getDefaultScopeItems(
  serviceType: string,
  analysis?: LeadAnalysisForDocument
): ScopeItem[] {
  const baseItems: ScopeItem[] = [];

  switch (serviceType) {
    case 'brand':
      baseItems.push(
        { deliverable: 'Brand Strategy Document', description: 'Positioning, values, voice guidelines', included: true },
        { deliverable: 'Logo Design', description: 'Primary logo + variations', included: true },
        { deliverable: 'Color Palette', description: 'Primary & secondary colors with usage guidelines', included: true },
        { deliverable: 'Typography System', description: 'Font selection and hierarchy', included: true },
        { deliverable: 'Brand Guidelines PDF', description: 'Comprehensive usage documentation', included: true },
        { deliverable: 'Social Media Templates', description: 'Templates for key platforms', included: true },
        { deliverable: 'Business Card Design', description: 'Print-ready design files', included: true },
      );
      break;

    case 'web':
      baseItems.push(
        { deliverable: 'UX Research & Wireframes', description: 'User flows and page layouts', included: true },
        { deliverable: 'Visual Design', description: 'Full design for all pages', included: true },
        { deliverable: 'Responsive Development', description: 'Mobile-first implementation', included: true },
        { deliverable: 'CMS Integration', description: 'Content management setup', included: true },
        { deliverable: 'SEO Foundation', description: 'Technical SEO & meta setup', included: true },
        { deliverable: 'Analytics Setup', description: 'GA4 and tracking configuration', included: true },
        { deliverable: 'Launch Support', description: '2 weeks post-launch support', included: true },
      );
      break;

    case 'saas':
      baseItems.push(
        { deliverable: 'Product Strategy', description: 'Feature prioritization, user journeys', included: true },
        { deliverable: 'UI/UX Design System', description: 'Component library and patterns', included: true },
        { deliverable: 'Application Design', description: 'All screens and user flows', included: true },
        { deliverable: 'Prototype', description: 'Interactive Figma prototype', included: true },
        { deliverable: 'Frontend Development', description: 'React/Next.js implementation', included: true },
        { deliverable: 'Backend Integration', description: 'API integration and data layer', included: true },
        { deliverable: 'Testing & QA', description: 'Comprehensive testing', included: true },
      );
      break;

    case 'ai':
      baseItems.push(
        { deliverable: 'AI Strategy Workshop', description: 'Use case identification and prioritization', included: true },
        { deliverable: 'Data Analysis', description: 'Assessment of data readiness', included: true },
        { deliverable: 'Solution Architecture', description: 'Technical design and integration plan', included: true },
        { deliverable: 'AI Implementation', description: 'Model selection and integration', included: true },
        { deliverable: 'Testing & Validation', description: 'Performance and accuracy testing', included: true },
        { deliverable: 'Documentation', description: 'Technical docs and user guides', included: true },
      );
      break;

    default:
      baseItems.push(
        { deliverable: 'Discovery & Strategy', description: 'Requirements gathering and planning', included: true },
        { deliverable: 'Design Phase', description: 'Visual design and prototyping', included: true },
        { deliverable: 'Development', description: 'Implementation and build', included: true },
        { deliverable: 'Testing & Launch', description: 'QA and deployment', included: true },
      );
  }

  // Add recommended stack items if available
  if (analysis?.recommended_stack?.length) {
    baseItems.push({
      deliverable: 'Tech Stack Setup',
      description: `Implementation with ${analysis.recommended_stack.slice(0, 3).join(', ')}`,
      included: true,
    });
  }

  return baseItems;
}

// ============================================
// DEFAULT PRICING TIERS
// ============================================

export function getDefaultPricingTiers(
  budgetRange: string | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- part of the exported signature (re-exported from lib/documents); not used yet
  serviceType: string | null
): PricingTier[] {
  const budget = BUDGET_TO_TIER[budgetRange || 'discuss'];
  const basePrice = budget?.minPrice || 10000;

  return [
    {
      name: 'Foundation',
      price: Math.round(basePrice * 0.7),
      duration: '4-6 weeks',
      features: [
        'Core deliverables',
        '2 revision rounds',
        'Standard support',
        'Basic documentation',
      ],
      recommended: false,
    },
    {
      name: 'Growth',
      price: basePrice,
      duration: '6-8 weeks',
      features: [
        'All Foundation features',
        'Extended scope',
        '3 revision rounds',
        'Priority support',
        'Comprehensive documentation',
        'Training session',
      ],
      recommended: true,
    },
    {
      name: 'Scale',
      price: Math.round(basePrice * 1.5),
      duration: '8-12 weeks',
      features: [
        'All Growth features',
        'Premium deliverables',
        'Unlimited revisions',
        'Dedicated support',
        'Extended maintenance',
        'Strategic consultation',
      ],
      recommended: false,
    },
  ];
}

// ============================================
// DEFAULT PAYMENT SCHEDULE
// ============================================

export function getDefaultPaymentSchedule(totalAmount: number): PaymentMilestone[] {
  return [
    {
      description: '50% deposit upon signing',
      percentage: 50,
      amount: Math.round(totalAmount * 0.5),
      dueOn: 'signing',
    },
    {
      description: '25% at design approval',
      percentage: 25,
      amount: Math.round(totalAmount * 0.25),
      dueOn: 'design_approval',
    },
    {
      description: '25% upon project completion',
      percentage: 25,
      amount: Math.round(totalAmount * 0.25),
      dueOn: 'completion',
    },
  ];
}

// ============================================
// DEFAULT SOW PHASES
// ============================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- part of the exported signature (re-exported from lib/documents); not used yet
export function getDefaultSOWPhases(serviceType: string): SOWPhase[] {
  const phases: SOWPhase[] = [
    {
      name: 'Discovery & Strategy',
      number: 1,
      deliverables: [
        'Kickoff meeting and stakeholder interviews',
        'Competitive analysis and market research',
        'Strategic recommendations document',
      ],
    },
    {
      name: 'Design',
      number: 2,
      deliverables: [
        'Wireframes and user flows',
        'Visual design concepts',
        'Design system documentation',
        'Interactive prototype',
      ],
    },
    {
      name: 'Development',
      number: 3,
      deliverables: [
        'Frontend implementation',
        'Backend integration',
        'Content management setup',
        'Quality assurance testing',
      ],
    },
    {
      name: 'Launch & Handover',
      number: 4,
      deliverables: [
        'Production deployment',
        'Performance optimization',
        'Documentation and training',
        'Post-launch support period',
      ],
    },
  ];

  return phases;
}

// ============================================
// DEFAULT EXCLUSIONS
// ============================================

export function getDefaultExclusions(serviceType: string): string[] {
  const common = [
    'Third-party software licenses and subscriptions',
    'Stock photography and premium assets (unless specified)',
    'Content writing and copywriting (unless specified)',
    'Hosting and domain registration fees',
    'Ongoing maintenance beyond support period',
  ];

  switch (serviceType) {
    case 'brand':
      return [
        ...common,
        'Print production and manufacturing',
        'Trademark registration',
        'Photography or video production',
      ];
    case 'web':
    case 'saas':
      return [
        ...common,
        'Backend infrastructure costs',
        'Email marketing platform setup',
        'Paid advertising campaigns',
      ];
    case 'ai':
      return [
        ...common,
        'AI/ML API usage costs',
        'Data collection and cleaning',
        'Ongoing model training',
      ];
    default:
      return common;
  }
}

// ============================================
// MAIN CONTENT GENERATORS
// ============================================

export function generateDefaultProposalContent(
  lead: LeadForDocument,
  analysis?: LeadAnalysisForDocument
): ProposalContent {
  const today = new Date();
  const validUntil = addDays(today, 21);
  const serviceType = lead.service_interest || 'web';
  const pricingTiers = getDefaultPricingTiers(lead.budget_range, serviceType);
  const selectedTier = pricingTiers.find(t => t.recommended) || pricingTiers[1];

  return {
    projectName: generateProjectName(lead),
    clientCompany: lead.company || lead.name,
    clientName: lead.name,
    clientEmail: lead.email,
    date: formatDate(today),
    validUntil: formatDate(validUntil),

    executiveSummary: `${lead.company || lead.name} is seeking a ${SERVICE_TYPE_NAMES[serviceType] || 'custom'} solution. Based on our initial conversation, we've prepared this proposal outlining our recommended approach and investment options.`,

    keyOutcomes: [
      'Professional, conversion-focused design',
      'Technical excellence and performance',
      'Clear brand communication',
    ],

    understanding: lead.message || 'To be discussed during discovery phase.',
    problemStatement: 'To be refined during discovery.',
    successDefinition: 'To be defined collaboratively.',

    approach: `Our proven process ensures a smooth journey from concept to launch. We'll work closely with your team through ${getDefaultTimelinePhases(serviceType, analysis?.complexity).length} key phases.`,

    timeline: getDefaultTimelinePhases(serviceType, analysis?.complexity),
    scope: getDefaultScopeItems(serviceType, analysis),
    exclusions: getDefaultExclusions(serviceType),

    pricingTiers,
    selectedTier: selectedTier.name,
    paymentSchedule: getDefaultPaymentSchedule(selectedTier.price),

    caseStudies: [
      { name: 'Similar Project 1', result: 'Achieved key objectives', industry: 'Tech' },
      { name: 'Similar Project 2', result: 'Exceeded expectations', industry: 'Startup' },
    ],

    nextSteps: [
      'Review this proposal',
      'Schedule a call to discuss questions',
      'Sign and return to begin',
    ],
  };
}

export function generateDefaultSOWContent(
  lead: LeadForDocument,
  proposalContent?: Partial<ProposalContent>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- callers (generator.ts, admin documents API) pass the lead analysis; not used yet
  analysis?: LeadAnalysisForDocument
): SOWContent {
  const today = new Date();
  const serviceType = lead.service_interest || 'web';
  const timeline = TIMELINE_TO_WEEKS[lead.timeline || 'flexible'];
  const durationWeeks = Math.round((timeline.min + timeline.max) / 2);
  const completionDate = addWeeks(today, durationWeeks);

  const selectedTier = proposalContent?.pricingTiers?.find(
    t => t.name === proposalContent?.selectedTier
  );
  const totalInvestment = selectedTier?.price || 15000;

  return {
    projectName: proposalContent?.projectName || generateProjectName(lead),
    sowNumber: '', // Will be auto-generated
    clientCompany: lead.company || lead.name,
    clientName: lead.name,
    clientEmail: lead.email,
    effectiveDate: formatDate(today),
    projectDuration: `${durationWeeks} weeks`,
    estimatedCompletion: formatDate(completionDate),

    projectOverview: proposalContent?.executiveSummary ||
      `This Statement of Work outlines the scope, timeline, and investment for the ${SERVICE_TYPE_NAMES[serviceType]} project.`,

    phases: getDefaultSOWPhases(serviceType),
    exclusions: proposalContent?.exclusions || getDefaultExclusions(serviceType),

    assumptions: [
      { text: 'Client will provide all required content within 5 business days of request', category: 'content' },
      { text: 'Feedback will be consolidated and provided within 3 business days', category: 'feedback' },
      { text: 'One primary decision maker will be designated for approvals', category: 'process' },
      { text: 'Required third-party accounts and access will be provided promptly', category: 'access' },
    ],

    milestones: [
      { name: 'Project Kickoff', deliverables: 'Strategy session, requirements confirmed', targetDate: formatDate(today) },
      { name: 'Discovery Complete', deliverables: 'Research and strategy approved', targetDate: formatDate(addWeeks(today, 2)) },
      { name: 'Design Approval', deliverables: 'Final designs signed off', targetDate: formatDate(addWeeks(today, Math.round(durationWeeks * 0.5))) },
      { name: 'Development Complete', deliverables: 'All features built and tested', targetDate: formatDate(addWeeks(today, Math.round(durationWeeks * 0.85))) },
      { name: 'Project Launch', deliverables: 'Live deployment and handover', targetDate: formatDate(completionDate) },
    ],

    paymentSchedule: proposalContent?.paymentSchedule || getDefaultPaymentSchedule(totalInvestment),
    totalInvestment,

    revisionRounds: 3,
    feedbackDays: 3,
    extraRevisionRate: 150,

    clientResponsibilities: [
      'Provide timely feedback and approvals',
      'Supply required content, assets, and brand materials',
      'Designate a primary point of contact',
      'Ensure stakeholder availability for key meetings',
      'Provide access to necessary accounts and systems',
    ],

    primaryContact: lead.name,
    contentDeliveryDays: 5,
  };
}

export function generateDefaultInvoiceContent(
  lead: LeadForDocument,
  sowContent?: Partial<SOWContent>,
  milestoneType: 'deposit' | 'milestone' | 'final' = 'deposit'
): InvoiceContent {
  const today = new Date();
  const dueDate = addDays(today, 14);

  const totalInvestment = sowContent?.totalInvestment || 15000;
  let invoiceAmount: number;
  let milestoneDescription: string;

  switch (milestoneType) {
    case 'deposit':
      invoiceAmount = Math.round(totalInvestment * 0.5);
      milestoneDescription = '50% Deposit - Project Commencement';
      break;
    case 'milestone':
      invoiceAmount = Math.round(totalInvestment * 0.25);
      milestoneDescription = '25% Milestone - Design Approval';
      break;
    case 'final':
      invoiceAmount = Math.round(totalInvestment * 0.25);
      milestoneDescription = '25% Final - Project Completion';
      break;
  }

  const subtotal = invoiceAmount;
  const taxRate = 0.10; // 10% GST
  const taxAmount = Math.round(subtotal * taxRate);
  const total = subtotal + taxAmount;

  return {
    invoiceNumber: '', // Will be auto-generated
    issueDate: formatDate(today),
    dueDate: formatDate(dueDate),
    paymentTerms: 'NET14',

    clientCompany: lead.company || lead.name,
    clientName: lead.name,
    clientEmail: lead.email,

    providerCompany: 'Craefto',
    providerAddress: 'Melbourne, Victoria, Australia',
    providerABN: '00 000 000 000', // Placeholder

    lineItems: [
      {
        description: milestoneDescription,
        quantity: 1,
        unitPrice: invoiceAmount,
        amount: invoiceAmount,
      },
    ],

    subtotal,
    taxRate: taxRate * 100,
    taxAmount,
    total,
    currency: 'AUD',

    projectName: sowContent?.projectName || generateProjectName(lead),
    sowNumber: sowContent?.sowNumber,
    milestoneDescription,

    paymentInstructions: 'Please include the invoice number as payment reference.',
  };
}
