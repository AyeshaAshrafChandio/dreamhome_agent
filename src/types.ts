/**
 * DreamHome Agent — Global Type Definitions
 * Strict types for properties, WebMCP tools, matching engine, and persistence.
 */

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: {
    address: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
    lat: number;
    lng: number;
    neighborhood?: string;
  };
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  propertyType: 'single_family' | 'apartment' | 'townhouse' | 'condo' | 'villa' | 'duplex';
  architecturalStyle?: string;
  floors: number;
  yearBuilt?: number;
  features: string[]; // e.g. ['parking', 'garden', 'pool', 'balcony', 'home_office', 'pet_friendly']
  photos: string[];
  source: {
    providerName: string;
    listingId?: string;
    sourceUrl?: string;
    lastUpdated: string;
  };
  seller: {
    name: string;
    type: 'agent' | 'owner' | 'broker';
    phone?: string;
    email?: string;
    company?: string;
  };
  matchScore?: PropertyMatchScore;
  neighborhood?: NeighborhoodInfo;
}

export interface PropertyMatchScore {
  overall: number; // 0 - 100
  breakdown: {
    budgetFit: number; // weight 30%
    locationFit: number; // weight 20%
    requirementsFit: number; // weight 25%
    amenitiesFit: number; // weight 15%
    neighborhoodFit: number; // weight 10%
  };
  reasons: string[];
  tradeoffs: string[];
}

export interface AmenityDistance {
  name: string;
  distanceKm: number;
  type?: string;
  lat?: number;
  lng?: number;
}

export interface NeighborhoodInfo {
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  radiusMeters: number;
  schools: AmenityDistance[];
  hospitals: AmenityDistance[];
  groceryStores: AmenityDistance[];
  transit: AmenityDistance[];
  parks: AmenityDistance[];
  walkabilityScore: number; // 0 - 100 calculated from real POI density
  realDataSummary: string;
  aiInterpretation?: string;
}

export interface SearchCriteria {
  location: string;
  maxBudget?: number;
  minBudget?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  propertyType?: string;
  minArea?: number;
  maxArea?: number;
  features?: string[];
  architecturalStyle?: string;
  lifestylePreferences?: string[];
  quietNeighborhood?: boolean;
  schoolProximity?: boolean;
  transitProximity?: boolean;
}

export interface AffordabilityInput {
  budget: number;
  propertyPrice: number;
  downPayment: number;
  financingRate: number; // annual % e.g. 6.5
  financingYears: number; // e.g. 30
  propertyTaxRate?: number; // annual % e.g. 1.2
  homeInsuranceAnnual?: number;
  hoaMonthly?: number;
}

export interface AffordabilityResult {
  loanAmount: number;
  downPaymentPercent: number;
  monthlyPrincipalAndInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  totalMonthlyPayment: number;
  isAffordable: boolean;
  surplusOrDeficit: number;
  ruleOfThumbMaxPrice: number;
  explanation: string;
}

export interface PropertyComparison {
  properties: Property[];
  criteria: SearchCriteria;
  comparisonTable: {
    id: string;
    title: string;
    price: number;
    pricePerSqFt: number;
    location: string;
    bedrooms: number;
    bathrooms: number;
    areaSqFt: number;
    features: string[];
    estimatedMonthlyPayment: number;
    matchScore: number;
    pros: string[];
    cons: string[];
  }[];
  verdictSummary: string;
}

export interface ViewingRequest {
  id: string;
  userId: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled';
  createdAt: string;
}

export interface SellerContactDraft {
  id: string;
  userId?: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  recipient: string | {
    name: string;
    type: string;
    email?: string;
    phone?: string;
  };
  sellerName?: string;
  sellerCompany?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  mlsId?: string;
  providerName?: string;
  message: string;
  actionName: string;
  requiresApproval: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  dispatchedAt?: string;
  deliveryStatus?: 'delivered' | 'read' | 'pending';
  agentReply?: {
    from: string;
    company?: string;
    text: string;
    receivedAt: string;
    status: string;
  };
  followUps?: Array<{
    id: string;
    sender: 'user' | 'agent';
    text: string;
    sentAt: string;
  }>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  budget?: number;
  preferredLocation?: string;
  preferredBedrooms?: number;
}

export interface AgentActionLog {
  id: string;
  userId: string;
  toolName: string;
  input: Record<string, any>;
  outputSummary: string;
  success: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'not_required';
  timestamp: string;
}

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  requiresApproval?: boolean;
  execute: (input: any) => Promise<any>;
}

export interface SystemStatus {
  webMcpDetected: boolean;
  webMcpMode: 'native' | 'standard_bridge';
  registeredToolsCount: number;
  registeredTools: string[];
  database: {
    type: 'postgresql' | 'embedded_sqlite_relational';
    connected: boolean;
    tablesReady: boolean;
  };
  providers: {
    propertyApi: {
      name: string;
      configured: boolean;
      status: string;
    };
    geocoding: {
      name: string;
      configured: boolean;
      status: string;
    };
    places: {
      name: string;
      configured: boolean;
      status: string;
    };
    ai: {
      name: string;
      configured: boolean;
      model: string;
    };
  };
}

export const TYPES_READY = true;
