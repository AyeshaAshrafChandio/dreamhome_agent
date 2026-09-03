/**
 * WebMCP Tool Registrations for DreamHome Agent
 * Registers all 10 core real estate discovery, analysis, and decision tools
 * on `document.modelContext.registerTool`.
 * Enforces Human-In-The-Loop Approval Gates on consequential actions (contact_seller).
 */

import { ensureWebMcpBridge } from './bridge.ts';
import { WebMCPToolDefinition, Property, SearchCriteria, AffordabilityInput } from '../types.ts';

export interface ApprovalPromptRequest {
  toolName: string;
  actionTitle: string;
  description: string;
  details: Record<string, any>;
  onApprove: () => Promise<any>;
  onReject: () => void;
}

export type ApprovalHandler = (request: ApprovalPromptRequest) => void;

let globalApprovalHandler: ApprovalHandler | null = null;

export function setApprovalHandler(handler: ApprovalHandler) {
  globalApprovalHandler = handler;
}

export function registerAllWebMcpTools(callbacks?: {
  onToolStart?: (name: string, input: any) => void;
  onToolSuccess?: (name: string, result: any) => void;
  onToolError?: (name: string, error: string) => void;
}) {
  const modelContext = ensureWebMcpBridge();

  // Helper to log and notify
  async function callApi(endpoint: string, method: string = 'POST', body?: any) {
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error (${res.status}): ${errText || res.statusText}`);
    }
    return res.json();
  }

  // 1. search_homes
  modelContext.registerTool({
    name: 'search_homes',
    description: 'Searches real estate listings matching location, budget, bedrooms, property type, and lifestyle criteria. Returns structured properties with DreamHome Match Scores.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'Target city, neighborhood, or postal address (e.g. "Austin, TX")' },
        maxBudget: { type: 'number', description: 'Maximum purchase price or budget limit in USD' },
        minBudget: { type: 'number', description: 'Minimum purchase price in USD' },
        minBedrooms: { type: 'number', description: 'Minimum number of bedrooms desired' },
        propertyType: { type: 'string', description: 'single_family, condo, townhouse, apartment, villa' },
        minArea: { type: 'number', description: 'Minimum square footage / area' },
        features: { type: 'array', items: { type: 'string' }, description: 'Desired features like parking, garden, pool' },
        architecturalStyle: { type: 'string', description: 'Modern, Contemporary, Craftsman, Colonial, etc.' },
      },
      required: ['location'],
    },
    execute: async (input: SearchCriteria) => {
      callbacks?.onToolStart?.('search_homes', input);
      try {
        const result = await callApi('/api/properties/search', 'POST', input);
        callbacks?.onToolSuccess?.('search_homes', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('search_homes', err.message);
        throw err;
      }
    },
  });

  // 2. get_property_details
  modelContext.registerTool({
    name: 'get_property_details',
    description: 'Retrieves comprehensive specifications, structural details, and amenities for a specific property by ID.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', description: 'Unique property identifier' },
      },
      required: ['propertyId'],
    },
    execute: async (input: { propertyId: string }) => {
      callbacks?.onToolStart?.('get_property_details', input);
      try {
        const result = await callApi(`/api/properties/${encodeURIComponent(input.propertyId)}`, 'GET');
        callbacks?.onToolSuccess?.('get_property_details', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('get_property_details', err.message);
        throw err;
      }
    },
  });

  // 3. compare_properties
  modelContext.registerTool({
    name: 'compare_properties',
    description: 'Generates a transparent side-by-side comparison across 2 to 4 properties with pros, cons, tradeoffs, and financial analysis.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        propertyIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of 2-4 property IDs to compare',
        },
      },
      required: ['propertyIds'],
    },
    execute: async (input: { propertyIds: string[] }) => {
      callbacks?.onToolStart?.('compare_properties', input);
      try {
        const result = await callApi('/api/properties/compare', 'POST', input);
        callbacks?.onToolSuccess?.('compare_properties', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('compare_properties', err.message);
        throw err;
      }
    },
  });

  // 4. search_neighborhood
  modelContext.registerTool({
    name: 'search_neighborhood',
    description: 'Analyzes the surrounding environment of a location using real OpenStreetMap facilities (schools, hospitals, supermarkets, transit, parks) with deterministic distance calculations.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'Address or coordinates of the property/neighborhood' },
        radius: { type: 'number', description: 'Search radius in meters (default 2500)' },
      },
      required: ['location'],
    },
    execute: async (input: { location: string; radius?: number }) => {
      callbacks?.onToolStart?.('search_neighborhood', input);
      try {
        const result = await callApi('/api/neighborhood/search', 'POST', input);
        callbacks?.onToolSuccess?.('search_neighborhood', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('search_neighborhood', err.message);
        throw err;
      }
    },
  });

  // 5. calculate_affordability
  modelContext.registerTool({
    name: 'calculate_affordability',
    description: 'Computes deterministic mortgage amortization, property taxes, insurance, HOA, and monthly affordability without LLM estimation.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        budget: { type: 'number', description: 'Monthly budget in USD' },
        propertyPrice: { type: 'number', description: 'Total purchase price in USD' },
        downPayment: { type: 'number', description: 'Down payment amount in USD' },
        financingRate: { type: 'number', description: 'Annual interest percentage rate (e.g. 6.5)' },
        financingYears: { type: 'number', description: 'Term of loan in years (e.g. 30)' },
        propertyTaxRate: { type: 'number', description: 'Optional annual property tax rate % (default 1.2%)' },
        homeInsuranceAnnual: { type: 'number', description: 'Optional annual homeowners insurance' },
        hoaMonthly: { type: 'number', description: 'Optional monthly HOA fee' },
      },
      required: ['budget', 'propertyPrice', 'downPayment'],
    },
    execute: async (input: AffordabilityInput) => {
      callbacks?.onToolStart?.('calculate_affordability', input);
      try {
        const result = await callApi('/api/affordability/calculate', 'POST', input);
        callbacks?.onToolSuccess?.('calculate_affordability', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('calculate_affordability', err.message);
        throw err;
      }
    },
  });

  // 6. save_property
  modelContext.registerTool({
    name: 'save_property',
    description: 'Saves a property to the user’s persistent favorites collection in the database.',
    readOnlyHint: false,
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', description: 'ID of the property to save' },
        notes: { type: 'string', description: 'Optional personal buyer notes' },
      },
      required: ['propertyId'],
    },
    execute: async (input: { propertyId: string; notes?: string }) => {
      callbacks?.onToolStart?.('save_property', input);
      try {
        const result = await callApi('/api/saved', 'POST', input);
        callbacks?.onToolSuccess?.('save_property', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('save_property', err.message);
        throw err;
      }
    },
  });

  // 7. get_saved_properties
  modelContext.registerTool({
    name: 'get_saved_properties',
    description: 'Retrieves all previously saved properties for the current user.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      callbacks?.onToolStart?.('get_saved_properties', {});
      try {
        const result = await callApi('/api/saved', 'GET');
        callbacks?.onToolSuccess?.('get_saved_properties', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('get_saved_properties', err.message);
        throw err;
      }
    },
  });

  // 8. create_viewing_request
  modelContext.registerTool({
    name: 'create_viewing_request',
    description: 'Schedules an in-person property viewing appointment with preferred date and time. Stored in database with pending status.',
    readOnlyHint: false,
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', description: 'Property ID to tour' },
        preferredDate: { type: 'string', description: 'Desired date (YYYY-MM-DD)' },
        preferredTime: { type: 'string', description: 'Desired time slot (e.g. 14:00)' },
        notes: { type: 'string', description: 'Optional requests or questions for the listing agent' },
      },
      required: ['propertyId', 'preferredDate', 'preferredTime'],
    },
    execute: async (input: any) => {
      callbacks?.onToolStart?.('create_viewing_request', input);
      try {
        const result = await callApi('/api/viewings', 'POST', input);
        callbacks?.onToolSuccess?.('create_viewing_request', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('create_viewing_request', err.message);
        throw err;
      }
    },
  });

  // 9. contact_seller (CONSEQUENTIAL ACTION — APPROVAL GATED)
  modelContext.registerTool({
    name: 'contact_seller',
    description: 'Drafts and transmits an inquiry to a property seller or listing broker. CRITICAL: Consequential action strictly gated by human-in-the-loop approval.',
    readOnlyHint: false,
    requiresApproval: true,
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', description: 'Property ID' },
        message: { type: 'string', description: 'Proposed message to send to the seller' },
      },
      required: ['propertyId'],
    },
    execute: async (input: { propertyId: string; message?: string }) => {
      callbacks?.onToolStart?.('contact_seller', input);

      // Step 1: Create Draft on server
      const draftRes = await callApi('/api/contacts/draft', 'POST', input);
      const draft = draftRes.draft;

      // Step 2: Trigger Human-in-the-Loop Approval Gate
      return new Promise((resolve, reject) => {
        if (!globalApprovalHandler) {
          // If no UI handler registered, do not send!
          const msg = 'Approval Gate: No approval handler configured. Message held in draft state.';
          callbacks?.onToolError?.('contact_seller', msg);
          return reject(new Error(msg));
        }

        globalApprovalHandler({
          toolName: 'contact_seller',
          actionTitle: 'Human Approval Required: Send Inquiry to Seller',
          description: `The AI agent drafted an inquiry for ${draft.propertyTitle}. No message will be sent without your explicit review and consent.`,
          details: {
            propertyTitle: draft.propertyTitle,
            recipient: draft.recipient,
            message: draft.message,
            sellerCompany: draftRes.sellerDetails?.company,
            sellerPhone: draftRes.sellerDetails?.phone,
            sellerEmail: draftRes.sellerDetails?.email,
            mlsId: draftRes.sellerDetails?.mlsId,
            providerName: draftRes.sellerDetails?.providerName,
          },
          onApprove: async () => {
            try {
              const res = await callApi(`/api/contacts/${draft.id}/approve`, 'POST');
              callbacks?.onToolSuccess?.('contact_seller', res);
              resolve({
                status: 'sent',
                message: 'Inquiry successfully transmitted to seller following explicit approval.',
                contact: res.contact,
              });
            } catch (err: any) {
              callbacks?.onToolError?.('contact_seller', err.message);
              reject(err);
            }
          },
          onReject: async () => {
            await callApi(`/api/contacts/${draft.id}/reject`, 'POST');
            callbacks?.onToolError?.('contact_seller', 'Action rejected by user.');
            resolve({
              status: 'cancelled',
              message: 'Seller contact cancelled upon human rejection.',
            });
          },
        });
      });
    },
  });

  // 10. get_user_preferences
  modelContext.registerTool({
    name: 'get_user_preferences',
    description: 'Retrieves current buyer profile preferences and defaults.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      callbacks?.onToolStart?.('get_user_preferences', {});
      try {
        const result = await callApi('/api/auth/me', 'GET');
        callbacks?.onToolSuccess?.('get_user_preferences', result);
        return result;
      } catch (err: any) {
        callbacks?.onToolError?.('get_user_preferences', err.message);
        throw err;
      }
    },
  });

  return modelContext;
}
