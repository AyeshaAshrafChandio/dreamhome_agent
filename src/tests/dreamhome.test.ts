/**
 * Comprehensive Test Suite for DreamHome Agent
 * Tests:
 * 1. WebMCP tool registration & schemas
 * 2. Deterministic affordability mathematics (NO LLM ARITHMETIC)
 * 3. Transparent Property Matching Engine & weights
 * 4. Human-in-the-loop approval gating for contact_seller
 * 5. Haversine distance calculations
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { calculateAffordability } from '../lib/affordability.ts';
import { calculateMatchScore } from '../lib/matching.ts';
import { calculateHaversineDistanceKm } from '../server/providers/places.ts';
import { ensureWebMcpBridge } from '../webmcp/bridge.ts';
import { registerAllWebMcpTools, setApprovalHandler } from '../webmcp/registerTools.ts';
import { Property, SearchCriteria } from '../types.ts';

describe('Deterministic Affordability Engine', () => {
  test('accurately calculates monthly mortgage payment and budget fit', () => {
    const result = calculateAffordability({
      budget: 4500,
      propertyPrice: 600000,
      downPayment: 120000, // 20% down, 480k loan
      financingRate: 6.5,
      financingYears: 30,
      propertyTaxRate: 1.2,
      hoaMonthly: 0,
    });

    // Monthly principal & interest on $480,000 at 6.5% for 30 years is ~$3,033.95
    assert.ok(result.monthlyPrincipalAndInterest > 3000 && result.monthlyPrincipalAndInterest < 3050,
      `Expected P&I around 3034, got ${result.monthlyPrincipalAndInterest}`);

    // Monthly tax = (600,000 * 0.012) / 12 = 600
    assert.strictEqual(result.monthlyTax, 600);

    // Total monthly payment = P&I + Tax + Insurance (~225)
    assert.ok(result.totalMonthlyPayment > 3800 && result.totalMonthlyPayment < 3900,
      `Expected total payment around 3859, got ${result.totalMonthlyPayment}`);

    // Since total payment (~$3,859) < budget ($4,500), it should be affordable
    assert.strictEqual(result.isAffordable, true);
    assert.ok(result.surplusOrDeficit > 600);
  });

  test('flags over-budget purchases accurately', () => {
    const result = calculateAffordability({
      budget: 2000,
      propertyPrice: 800000,
      downPayment: 80000, // 10% down, 720k loan
      financingRate: 7.0,
      financingYears: 30,
    });

    assert.strictEqual(result.isAffordable, false);
    assert.ok(result.surplusOrDeficit < 0);
    assert.ok(result.explanation.includes('Over budget'));
  });
});

describe('DreamHome Match Score Algorithm', () => {
  const sampleProperty: Property = {
    id: 'test_prop_1',
    title: 'Sunny Contemporary in Austin',
    description: 'Beautiful 3 bed home with parking and solar panels',
    price: 650000,
    currency: '$',
    location: {
      address: '100 Congress Ave',
      city: 'Austin',
      state: 'TX',
      country: 'US',
      lat: 30.2672,
      lng: -97.7431,
      neighborhood: 'Downtown',
    },
    bedrooms: 3,
    bathrooms: 2,
    areaSqFt: 2100,
    propertyType: 'single_family',
    architecturalStyle: 'Modern',
    floors: 2,
    features: ['parking', 'garden', 'solar_panels'],
    photos: [],
    source: {
      providerName: 'MLS',
      lastUpdated: new Date().toISOString(),
    },
    seller: {
      name: 'Agent Smith',
      type: 'agent',
    },
  };

  test('generates transparent score and explanations matching budget and bedrooms', () => {
    const criteria: SearchCriteria = {
      location: 'Austin',
      maxBudget: 700000,
      minBedrooms: 3,
      features: ['parking'],
    };

    const score = calculateMatchScore(sampleProperty, criteria);

    // Should receive a high match score (>85)
    assert.ok(score.overall >= 85, `Expected score >= 85, got ${score.overall}`);
    assert.strictEqual(score.breakdown.budgetFit, 100);
    assert.strictEqual(score.breakdown.locationFit, 100);

    // Check transparency
    assert.ok(score.reasons.length > 0, 'Must provide clear reasons');
    assert.ok(score.reasons.some(r => r.includes('saving')), 'Should note budget savings');
  });

  test('identifies tradeoffs when requirements are unmet', () => {
    const criteria: SearchCriteria = {
      location: 'Austin',
      maxBudget: 500000, // property is 650k, so over budget
      minBedrooms: 4, // property has 3 beds
      features: ['pool'], // property lacks pool
    };

    const score = calculateMatchScore(sampleProperty, criteria);

    assert.ok(score.overall < 60, `Expected low score, got ${score.overall}`);
    assert.ok(score.tradeoffs.length >= 2, 'Should detail compromises');
    assert.ok(score.tradeoffs.some(t => t.includes('budget')), 'Should flag over budget');
    assert.ok(score.tradeoffs.some(t => t.includes('bedrooms')), 'Should flag bedroom deficit');
  });
});

describe('WebMCP Tool Layer', () => {
  test('registers all 10 standard tools on document.modelContext', () => {
    const bridge = ensureWebMcpBridge();
    registerAllWebMcpTools();

    const registered = bridge.getTools();
    const toolNames = registered.map(t => t.name);

    assert.ok(registered.length >= 10, `Expected at least 10 tools, found ${registered.length}`);
    assert.ok(toolNames.includes('search_homes'));
    assert.ok(toolNames.includes('get_property_details'));
    assert.ok(toolNames.includes('compare_properties'));
    assert.ok(toolNames.includes('search_neighborhood'));
    assert.ok(toolNames.includes('calculate_affordability'));
    assert.ok(toolNames.includes('save_property'));
    assert.ok(toolNames.includes('get_saved_properties'));
    assert.ok(toolNames.includes('create_viewing_request'));
    assert.ok(toolNames.includes('contact_seller'));
    assert.ok(toolNames.includes('get_user_preferences'));
  });

  test('contact_seller is marked as requiring human approval', () => {
    const bridge = ensureWebMcpBridge();
    const contactTool = bridge.getTool('contact_seller');
    assert.ok(contactTool, 'contact_seller must be registered');
    assert.strictEqual(contactTool?.requiresApproval, true, 'contact_seller MUST have requiresApproval=true');
  });
});

describe('Geographic Distance Calculations', () => {
  test('computes accurate Haversine distance in kilometers', () => {
    // Distance from Austin Downtown (30.2672, -97.7431) to Mueller Austin (30.3012, -97.7051) is approx 5.1 km
    const dist = calculateHaversineDistanceKm(30.2672, -97.7431, 30.3012, -97.7051);
    assert.ok(dist >= 4.8 && dist <= 5.5, `Expected distance ~5.1 km, got ${dist}`);
  });
});
