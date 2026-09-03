/**
 * DreamHome AI Agent Engine
 * Powered by Gemini 3.8 Flash via @google/genai on the server.
 * Converts natural language user queries into structured criteria,
 * determines tool actions, evaluates tradeoffs, and refuses to fabricate facts.
 */

import { GoogleGenAI } from '@google/genai';
import { SearchCriteria, Property } from '../types.ts';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AgentIntentResult {
  intent: 'search' | 'refine_search' | 'compare' | 'save' | 'viewing' | 'contact_seller' | 'affordability' | 'general_query';
  summary: string;
  structuredCriteria?: SearchCriteria;
  targetIndices?: number[];
  targetPropertyId?: string;
  toolToExecute?: string;
  toolInput?: Record<string, any>;
  requiresApproval?: boolean;
  approvalPayload?: {
    action: string;
    description: string;
    propertyId?: string;
    draftMessage?: string;
  };
  explanation?: string;
}

export async function processUserIntent(
  userMessage: string,
  context: {
    previousCriteria?: SearchCriteria;
    currentProperties?: Property[];
    savedPropertyIds?: string[];
  }
): Promise<AgentIntentResult> {
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `
You are the DreamHome AI Real Estate Agent operating a web application via WebMCP tools.
The user message is: "${userMessage}"

Context:
- Existing search criteria: ${JSON.stringify(context.previousCriteria || {})}
- Number of currently displayed properties: ${context.currentProperties?.length || 0}
- Properties overview: ${JSON.stringify((context.currentProperties || []).slice(0, 5).map((p, idx) => ({ index: idx + 1, id: p.id, title: p.title, price: p.price, city: p.location.city, beds: p.bedrooms })))}

Analyze the user's intent and return a clean JSON object with this exact schema:
{
  "intent": "search" | "refine_search" | "compare" | "save" | "viewing" | "contact_seller" | "affordability" | "general_query",
  "summary": "Short 1-sentence description of what the agent is doing",
  "structuredCriteria": {
    "location": "extracted location string or existing",
    "maxBudget": number or null,
    "minBudget": number or null,
    "minBedrooms": number or null,
    "propertyType": "single_family" | "apartment" | "condo" | "townhouse" | "villa" | null,
    "minArea": number or null,
    "features": ["parking", "garden", "pool", etc.],
    "architecturalStyle": string or null,
    "quietNeighborhood": boolean,
    "schoolProximity": boolean,
    "transitProximity": boolean
  },
  "targetIndices": [numbers representing 1-based indices of properties mentioned, e.g. [1, 2, 3]],
  "targetPropertyId": "id if a specific property was selected or mentioned",
  "toolToExecute": "search_homes" | "compare_properties" | "save_property" | "create_viewing_request" | "contact_seller" | "calculate_affordability" | "search_neighborhood" | null,
  "toolInput": { ...arguments for the WebMCP tool },
  "requiresApproval": boolean (TRUE ONLY for consequential actions like contact_seller, purchasing, or booking commitment),
  "approvalPayload": {
    "action": "Contact Seller" | "Book Viewing",
    "description": "Details requiring human confirmation",
    "draftMessage": "Polite draft message if contacting seller"
  },
  "explanation": "Clear, objective reasoning about the query. NEVER fabricate facts. If data is unavailable, explicitly state 'Information unavailable from the connected data source.'"
}

Return ONLY valid JSON.
`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 6s')), 6000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        timeoutPromise,
      ]);

      const text = response.text?.trim() || '';
      const parsed = JSON.parse(text);
      return parsed;
    } catch (err) {
      console.warn('Gemini API call error in processUserIntent, falling back to deterministic parser:', err);
    }
  }

  // Resilient Deterministic Rule-Based Fallback Parser
  return parseIntentDeterministic(userMessage, context);
}

function parseIntentDeterministic(
  message: string,
  context: { previousCriteria?: SearchCriteria; currentProperties?: Property[] }
): AgentIntentResult {
  const lower = message.toLowerCase();

  // Contact seller intent (ALWAYS APPROVAL GATED)
  if (lower.includes('contact') || lower.includes('seller') || lower.includes('message the owner')) {
    const firstProp = context.currentProperties?.[0];
    return {
      intent: 'contact_seller',
      summary: 'Preparing inquiry for the seller. Awaiting your approval before transmitting.',
      toolToExecute: 'contact_seller',
      targetPropertyId: firstProp?.id,
      requiresApproval: true,
      approvalPayload: {
        action: 'Contact Seller',
        propertyId: firstProp?.id,
        description: `Inquire about ${firstProp?.title || 'the selected property'} regarding availability, pricing terms, and private tour options.`,
        draftMessage: `Hello, I am interested in your listing for ${firstProp?.title || 'the property'} listed at $${firstProp?.price?.toLocaleString() || 'the asking price'}. Could you please share more details regarding utility costs and viewing availability this week? Thank you!`,
      },
      explanation: 'Consequential action detected: Contacting a seller requires explicit human approval before any message is sent.',
    };
  }

  // Compare intent
  if (lower.includes('compare')) {
    const props = context.currentProperties || [];
    const ids = props.slice(0, 3).map(p => p.id);
    return {
      intent: 'compare',
      summary: `Comparing the top ${ids.length} selected properties side by side.`,
      toolToExecute: 'compare_properties',
      targetIndices: [1, 2, 3].slice(0, ids.length),
      toolInput: { propertyIds: ids },
      explanation: 'Retrieved detailed specification and financial comparison across your selected properties.',
    };
  }

  // Save property intent
  if (lower.includes('save')) {
    let targetIndex = 1;
    const match = lower.match(/(?:number|#|property)\s*(\d+)/i);
    if (match) {
      targetIndex = parseInt(match[1], 10);
    }
    const prop = context.currentProperties?.[targetIndex - 1] || context.currentProperties?.[0];
    return {
      intent: 'save',
      summary: `Saving ${prop?.title || 'property'} to your saved collection.`,
      toolToExecute: 'save_property',
      targetIndices: [targetIndex],
      targetPropertyId: prop?.id,
      toolInput: { propertyId: prop?.id },
      explanation: `Executing WebMCP save_property tool for property ID ${prop?.id}.`,
    };
  }

  // Viewing request intent
  if (lower.includes('viewing') || lower.includes('visit') || lower.includes('tour') || lower.includes('schedule')) {
    const prop = context.currentProperties?.[0];
    return {
      intent: 'viewing',
      summary: 'Scheduling property viewing appointment.',
      toolToExecute: 'create_viewing_request',
      targetPropertyId: prop?.id,
      toolInput: {
        propertyId: prop?.id,
        preferredDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        preferredTime: '14:00',
      },
      explanation: 'Preparing viewing appointment in database with pending confirmation status.',
    };
  }

  // Search / Refine Search extraction
  const criteria: SearchCriteria = {
    location: context.previousCriteria?.location || 'Austin, TX',
    features: [...(context.previousCriteria?.features || [])],
  };

  // Location extraction
  const inMatch = message.match(/\b(?:in|at|around|near)\s+([A-Za-z0-9\s,]+?)(?:\s+under|\s+with|\s+for|\s+below|\s+having|\.|$)/i);
  if (inMatch && inMatch[1].trim()) {
    criteria.location = inMatch[1].trim();
  }

  // Budget extraction
  const budgetMatch = message.match(/(?:under|below|max|budget of|\$)\s*\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|thousand|m|million)?/i);
  if (budgetMatch) {
    let num = parseFloat(budgetMatch[1].replace(/,/g, ''));
    const unit = (budgetMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') num *= 1000;
    if (unit === 'm' || unit === 'million') num *= 1000000;
    criteria.maxBudget = num;
  }

  // Bedroom extraction
  const bedMatch = message.match(/(\d+)\s*(?:bed|bedroom|bhk|br)/i);
  if (bedMatch) {
    criteria.minBedrooms = parseInt(bedMatch[1], 10);
  }

  // Feature extraction
  if (lower.includes('parking') && !criteria.features.includes('parking')) criteria.features.push('parking');
  if (lower.includes('garden') && !criteria.features.includes('garden')) criteria.features.push('garden');
  if (lower.includes('pool') && !criteria.features.includes('pool')) criteria.features.push('pool');
  if (lower.includes('balcony') && !criteria.features.includes('balcony')) criteria.features.push('balcony');
  if (lower.includes('office') && !criteria.features.includes('home_office')) criteria.features.push('home_office');
  if (lower.includes('pet') && !criteria.features.includes('pet_friendly')) criteria.features.push('pet_friendly');
  if (lower.includes('quiet')) criteria.quietNeighborhood = true;
  if (lower.includes('school')) criteria.schoolProximity = true;
  if (lower.includes('transport') || lower.includes('transit')) criteria.transitProximity = true;

  if (lower.includes('modern')) criteria.architecturalStyle = 'Modern';
  if (lower.includes('contemporary')) criteria.architecturalStyle = 'Contemporary';

  return {
    intent: context.previousCriteria ? 'refine_search' : 'search',
    summary: `Searching properties matching your criteria in ${criteria.location}${criteria.maxBudget ? ` under $${criteria.maxBudget.toLocaleString()}` : ''}.`,
    structuredCriteria: criteria,
    toolToExecute: 'search_homes',
    toolInput: criteria,
    explanation: 'Converted natural language requirements into structured search criteria for WebMCP search_homes invocation.',
  };
}
