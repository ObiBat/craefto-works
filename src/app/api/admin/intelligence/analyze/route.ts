import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface LeadData {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  message: string | null;
}

interface CompanyResearch {
  domain: string | null;
  industry: string | null;
  estimated_size: string | null;
  linkedin_url: string | null;
  tech_signals: string[];
  funding_stage: string | null;
}

// Extract domain from email
function extractDomain(email: string): string | null {
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || commonDomains.includes(domain)) return null;
  return domain;
}

// Research company from domain/name
async function researchCompany(email: string, companyName: string | null): Promise<CompanyResearch> {
  const domain = extractDomain(email);
  const research: CompanyResearch = {
    domain,
    industry: null,
    estimated_size: null,
    linkedin_url: null,
    tech_signals: [],
    funding_stage: null,
  };

  if (!domain && !companyName) return research;

  // Try to fetch company website for tech signals
  if (domain) {
    try {
      const response = await fetch(`https://${domain}`, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CraeftoBot/1.0)' },
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Detect tech stack from HTML
        if (html.includes('__NEXT_DATA__') || html.includes('_next/')) {
          research.tech_signals.push('Next.js');
        }
        if (html.includes('react') || html.includes('React')) {
          research.tech_signals.push('React');
        }
        if (html.includes('shopify') || html.includes('Shopify')) {
          research.tech_signals.push('Shopify');
          research.industry = 'E-commerce';
        }
        if (html.includes('wordpress') || html.includes('wp-content')) {
          research.tech_signals.push('WordPress');
        }
        if (html.includes('stripe')) {
          research.tech_signals.push('Stripe');
        }
        if (html.includes('intercom')) {
          research.tech_signals.push('Intercom');
          research.estimated_size = 'Growth stage';
        }
        if (html.includes('hubspot')) {
          research.tech_signals.push('HubSpot');
        }
        
        // Industry detection from content
        const lowerHtml = html.toLowerCase();
        if (lowerHtml.includes('fintech') || lowerHtml.includes('financial')) {
          research.industry = 'Fintech';
        } else if (lowerHtml.includes('healthcare') || lowerHtml.includes('health')) {
          research.industry = 'Healthcare';
        } else if (lowerHtml.includes('saas') || lowerHtml.includes('software')) {
          research.industry = 'SaaS';
        } else if (lowerHtml.includes('real estate') || lowerHtml.includes('property')) {
          research.industry = 'Real Estate';
        } else if (lowerHtml.includes('education') || lowerHtml.includes('learning')) {
          research.industry = 'EdTech';
        }
      }
    } catch {
      // Website fetch failed, continue without
    }
    
    research.linkedin_url = `https://www.linkedin.com/company/${domain.split('.')[0]}`;
  }

  return research;
}

// Generate response template based on analysis
function generateResponseTemplate(lead: LeadData, analysis: ReturnType<typeof analyzeLeadRuleBased>): string {
  const firstName = lead.name.split(' ')[0];
  const serviceNames: Record<string, string> = {
    'web': 'web design and development',
    'saas': 'SaaS product development',
    'ai': 'AI and automation solutions',
    'brand': 'brand identity',
    'other': 'your project',
  };
  const serviceName = serviceNames[lead.service_interest || 'other'] ?? serviceNames.other;
  
  // High fit template
  if (analysis.fit_score >= 0.6) {
    return `Hi ${firstName},

Thanks for reaching out about ${serviceName}. ${lead.company ? `I took a look at ${lead.company} and ` : ''}this sounds like a great fit for what we do.

${lead.message && lead.message.length > 100 ? `I especially liked the detail you provided about your project—` : ''}I'd love to learn more about your goals and timeline.

Are you available for a quick discovery call this week? I have slots open [SUGGEST TIMES].

Looking forward to connecting.

Best,
Obi`;
  }
  
  // Medium fit template
  if (analysis.fit_score >= 0.4) {
    return `Hi ${firstName},

Thanks for getting in touch about ${serviceName}. I've reviewed your inquiry and have a few questions to make sure we're aligned before moving forward.

Could you share a bit more about:
1. The specific outcomes you're hoping to achieve
2. Any existing materials or branding we'd be working with
3. Your decision-making timeline

Once I understand these better, I can provide a more tailored proposal.

Best,
Obi`;
  }
  
  // Low fit - polite decline or referral
  return `Hi ${firstName},

Thanks for considering Craefto for ${serviceName}. I've reviewed your project details.

Based on the scope and budget, I think you might be better served by [ALTERNATIVE SUGGESTION]. They specialize in projects at this scale and do great work.

If your requirements change or you'd like to discuss a phased approach, I'm happy to chat.

Best wishes with the project,
Obi`;
}

// Generate discovery call agenda
function generateCallAgenda(lead: LeadData, analysis: ReturnType<typeof analyzeLeadRuleBased>): string[] {
  const agenda: string[] = [];
  
  agenda.push('Introductions and background (5 min)');
  
  if (lead.company) {
    agenda.push(`Learn about ${lead.company}'s current challenges and goals`);
  } else {
    agenda.push('Understand the business context and target audience');
  }
  
  const serviceQuestions: Record<string, string> = {
    'web': 'Discuss website goals, key pages, and conversion objectives',
    'saas': 'Map out core features, user flows, and MVP scope',
    'ai': 'Identify automation opportunities and data requirements',
    'brand': 'Explore brand values, positioning, and competitive landscape',
    'other': 'Define project scope and success metrics',
  };
  agenda.push(serviceQuestions[lead.service_interest || 'other'] ?? serviceQuestions.other);
  
  if (analysis.scope_creep_risk > 0.5) {
    agenda.push('⚠️ Clarify boundaries and phasing to manage scope');
  }
  
  if (lead.timeline === 'asap') {
    agenda.push('⚠️ Discuss realistic timeline and any flexibility');
  }
  
  agenda.push('Review budget alignment and payment structure');
  agenda.push('Outline next steps and proposal timeline');
  
  return agenda;
}

// Detect red flags
function detectRedFlags(lead: LeadData): { flag: string; severity: 'low' | 'medium' | 'high' }[] {
  const flags: { flag: string; severity: 'low' | 'medium' | 'high' }[] = [];
  
  // Budget + Timeline mismatch
  if (lead.budget_range === '3-5k' && lead.timeline === 'asap') {
    flags.push({ flag: 'Low budget with urgent timeline', severity: 'high' });
  }
  
  if (lead.budget_range === '3-5k' && lead.service_interest === 'saas') {
    flags.push({ flag: 'Budget too low for SaaS development', severity: 'high' });
  }
  
  // Vague requirements
  if (!lead.message || lead.message.length < 50) {
    flags.push({ flag: 'Vague project description', severity: 'medium' });
  }
  
  // No company (could be fine, but flag it)
  if (!lead.company) {
    flags.push({ flag: 'No company provided', severity: 'low' });
  }
  
  // "Discuss" budget often means misaligned expectations
  if (lead.budget_range === 'discuss') {
    flags.push({ flag: 'Budget not disclosed - may need qualification', severity: 'medium' });
  }
  
  // Keywords suggesting trouble
  const troubleKeywords = ['cheap', 'free', 'exposure', 'equity only', 'revision', 'unlimited'];
  const messageLower = (lead.message || '').toLowerCase();
  for (const keyword of troubleKeywords) {
    if (messageLower.includes(keyword)) {
      flags.push({ flag: `Message contains "${keyword}"`, severity: 'high' });
      break;
    }
  }
  
  return flags;
}

// Rule-based analysis when ML service is unavailable
function analyzeLeadRuleBased(lead: LeadData) {
  let fitScore = 0.5; // Base score
  let scopeCreepRisk = 0.3; // Base risk
  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  // Budget analysis
  const budgetScores: Record<string, { fit: number; risk: number }> = {
    '50k+': { fit: 0.3, risk: -0.1 },
    '25-50k': { fit: 0.2, risk: -0.05 },
    '10-25k': { fit: 0.1, risk: 0 },
    '5-10k': { fit: 0, risk: 0.1 },
    '3-5k': { fit: -0.1, risk: 0.2 },
    'discuss': { fit: -0.05, risk: 0.15 },
  };

  if (lead.budget_range && budgetScores[lead.budget_range]) {
    fitScore += budgetScores[lead.budget_range].fit;
    scopeCreepRisk += budgetScores[lead.budget_range].risk;
    if (['50k+', '25-50k'].includes(lead.budget_range)) {
      greenFlags.push('Strong budget');
    }
  }

  // Timeline analysis
  const timelineScores: Record<string, { fit: number; risk: number }> = {
    'asap': { fit: 0.1, risk: 0.2 },
    '1-3months': { fit: 0.15, risk: 0 },
    '3-6months': { fit: 0.1, risk: -0.1 },
    'flexible': { fit: 0.05, risk: 0.1 },
  };

  if (lead.timeline && timelineScores[lead.timeline]) {
    fitScore += timelineScores[lead.timeline].fit;
    scopeCreepRisk += timelineScores[lead.timeline].risk;
    if (lead.timeline === 'asap') {
      redFlags.push('Urgent timeline');
    }
    if (lead.timeline === '1-3months') {
      greenFlags.push('Realistic timeline');
    }
  }

  // Company presence
  if (lead.company) {
    fitScore += 0.1;
    greenFlags.push('Company provided');
  }

  // Message length analysis
  const messageLength = lead.message?.length || 0;
  if (messageLength > 500) {
    fitScore += 0.1;
    greenFlags.push('Detailed brief');
  } else if (messageLength < 50) {
    scopeCreepRisk += 0.15;
    redFlags.push('Vague requirements');
  }

  // Service type to project type mapping
  const serviceToProject: Record<string, string> = {
    'web': 'Web Application',
    'saas': 'SaaS Platform',
    'ai': 'AI Integration',
    'brand': 'Brand Identity',
    'other': 'Discovery',
  };

  // Complexity based on service + budget
  let complexity = 'Medium';
  if (['saas', 'ai'].includes(lead.service_interest || '')) {
    complexity = 'High';
    scopeCreepRisk += 0.1;
  } else if (lead.service_interest === 'brand') {
    complexity = 'Low';
    scopeCreepRisk -= 0.1;
  }

  // Recommended stack based on service
  const stackRecommendations: Record<string, string[]> = {
    'web': ['Next.js', 'Tailwind', 'Vercel'],
    'saas': ['Next.js', 'Supabase', 'Stripe', 'Vercel'],
    'ai': ['Next.js', 'Python', 'OpenAI', 'Vercel'],
    'brand': ['Figma', 'Adobe CC'],
    'other': ['Next.js', 'Tailwind'],
  };

  // Clamp values
  fitScore = Math.max(0, Math.min(1, fitScore));
  scopeCreepRisk = Math.max(0, Math.min(1, scopeCreepRisk));

  // Determine if review needed
  const requiresReview = fitScore < 0.4 || scopeCreepRisk > 0.7 || redFlags.length > 2;

  return {
    fit_score: fitScore,
    project_type: serviceToProject[lead.service_interest || 'other'] || 'Discovery',
    complexity,
    scope_creep_risk: scopeCreepRisk,
    recommended_stack: stackRecommendations[lead.service_interest || 'other'] || ['Next.js', 'Tailwind'],
    red_flags: redFlags,
    green_flags: greenFlags,
    requires_review: requiresReview,
    analysis_mode: 'rule_based',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Try ML service first (if configured)
    let analysis;
    const mlServiceUrl = process.env.ML_SERVICE_URL;

    if (mlServiceUrl) {
      try {
        const mlResponse = await fetch(`${mlServiceUrl}/api/v1/intelligence/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: lead.company,
            industry: 'unknown',
            project_description: lead.message,
            budget_range: lead.budget_range,
            timeline: lead.timeline,
            requested_features: [],
            client_experience: 'unknown',
            revision_expectations: 'moderate',
          }),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (mlResponse.ok) {
          const mlData = await mlResponse.json();
          analysis = {
            fit_score: mlData.client_fit_score,
            project_type: mlData.project_type,
            complexity: mlData.complexity_level,
            scope_creep_risk: mlData.scope_creep_risk,
            recommended_stack: mlData.recommended_stack,
            red_flags: mlData.red_flags,
            green_flags: mlData.green_flags,
            requires_review: mlData.requires_human_review,
            analysis_mode: 'ml_service',
          };
        }
      } catch {
        console.log('ML service unavailable, using rule-based analysis');
      }
    }

    // Fall back to rule-based analysis
    if (!analysis) {
      analysis = analyzeLeadRuleBased(lead as LeadData);
    }

    // Save analysis to database
    const { error: insertError } = await supabase
      .from('lead_analysis')
      .upsert({
        lead_id: leadId,
        fit_score: analysis.fit_score,
        project_type: analysis.project_type,
        complexity: analysis.complexity,
        scope_creep_risk: analysis.scope_creep_risk,
        recommended_stack: analysis.recommended_stack,
        red_flags: analysis.red_flags,
        green_flags: analysis.green_flags,
        requires_review: analysis.requires_review,
        analysis_mode: analysis.analysis_mode,
        analyzed_at: new Date().toISOString(),
      }, {
        onConflict: 'lead_id',
      });

    if (insertError) {
      console.error('Error saving analysis:', insertError);
      // Still return the analysis even if save fails
    }

    // Enhanced Intelligence V2: Company research, templates, agenda
    const companyResearch = await researchCompany(lead.email, lead.company);
    const detailedRedFlags = detectRedFlags(lead as LeadData);
    const responseTemplate = generateResponseTemplate(lead as LeadData, analysis);
    const callAgenda = generateCallAgenda(lead as LeadData, analysis);

    // Merge detailed red flags into analysis
    const enhancedAnalysis = {
      ...analysis,
      company_research: companyResearch,
      detailed_red_flags: detailedRedFlags,
      response_template: responseTemplate,
      call_agenda: callAgenda,
    };

    // Save enhanced analysis
    const { error: updateError } = await supabase
      .from('lead_analysis')
      .upsert({
        lead_id: leadId,
        fit_score: analysis.fit_score,
        project_type: analysis.project_type,
        complexity: analysis.complexity,
        scope_creep_risk: analysis.scope_creep_risk,
        recommended_stack: analysis.recommended_stack,
        red_flags: analysis.red_flags,
        green_flags: analysis.green_flags,
        requires_review: analysis.requires_review,
        analysis_mode: analysis.analysis_mode,
        company_research: companyResearch,
        detailed_red_flags: detailedRedFlags,
        response_template: responseTemplate,
        call_agenda: callAgenda,
        analyzed_at: new Date().toISOString(),
      }, {
        onConflict: 'lead_id',
      });

    if (updateError) {
      console.error('Error saving enhanced analysis:', updateError);
    }

    // Log activity
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      type: 'ai_analysis',
      title: 'AI Analysis Completed',
      description: `${analysis.analysis_mode === 'ml_service' ? 'ML Service' : 'Rule-based'} analysis: Fit Score ${Math.round(analysis.fit_score * 100)}%, Scope Risk ${Math.round(analysis.scope_creep_risk * 100)}%${companyResearch.domain ? ` | Company: ${companyResearch.domain}` : ''}`,
      metadata: {
        fit_score: analysis.fit_score,
        scope_creep_risk: analysis.scope_creep_risk,
        project_type: analysis.project_type,
        complexity: analysis.complexity,
        analysis_mode: analysis.analysis_mode,
        has_company_research: !!companyResearch.domain,
      },
    });

    return NextResponse.json({ analysis: enhancedAnalysis });
  } catch (error) {
    console.error('Error analyzing lead:', error);
    return NextResponse.json({ error: 'Failed to analyze lead' }, { status: 500 });
  }
}
