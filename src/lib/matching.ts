/**
 * Transparent Property Matching Engine
 * Implements "DreamHome Match Score" with mathematical weighting:
 * Budget fit: 30%
 * Location fit: 20%
 * Home requirements: 25%
 * Amenities: 15%
 * Neighborhood preferences: 10%
 */

import { Property, SearchCriteria, PropertyMatchScore } from '../types.ts';

export function calculateMatchScore(property: Property, criteria: SearchCriteria): PropertyMatchScore {
  const reasons: string[] = [];
  const tradeoffs: string[] = [];

  // 1. Budget Fit (30% weight)
  let budgetScore = 100;
  if (criteria.maxBudget && criteria.maxBudget > 0) {
    if (property.price <= criteria.maxBudget) {
      const savings = criteria.maxBudget - property.price;
      budgetScore = 100;
      reasons.push(`Priced at $${property.price.toLocaleString()}, well within your $${criteria.maxBudget.toLocaleString()} limit (saving $${savings.toLocaleString()}).`);
    } else {
      const overPercentage = (property.price - criteria.maxBudget) / criteria.maxBudget;
      if (overPercentage <= 0.05) {
        budgetScore = 80;
        tradeoffs.push(`Slightly over budget by $${(property.price - criteria.maxBudget).toLocaleString()} (approx ${(overPercentage * 100).toFixed(1)}%).`);
      } else if (overPercentage <= 0.15) {
        budgetScore = 55;
        tradeoffs.push(`Exceeds maximum budget by $${(property.price - criteria.maxBudget).toLocaleString()} (~${(overPercentage * 100).toFixed(0)}%).`);
      } else if (overPercentage <= 0.30) {
        budgetScore = 25;
        tradeoffs.push(`Significantly above budget by $${(property.price - criteria.maxBudget).toLocaleString()}.`);
      } else {
        budgetScore = 0;
        tradeoffs.push(`Extremely over budget ($${property.price.toLocaleString()} vs $${criteria.maxBudget.toLocaleString()}).`);
      }
    }
  } else {
    budgetScore = 90;
  }

  // 2. Location Fit (20% weight)
  let locationScore = 100;
  if (criteria.location && criteria.location.trim()) {
    const targetLoc = criteria.location.toLowerCase();
    const city = (property.location.city || '').toLowerCase();
    const address = (property.location.address || '').toLowerCase();
    const neighborhood = (property.location.neighborhood || '').toLowerCase();

    if (city.includes(targetLoc) || targetLoc.includes(city) ||
        neighborhood.includes(targetLoc) || targetLoc.includes(neighborhood) ||
        address.includes(targetLoc)) {
      locationScore = 100;
      reasons.push(`Direct match for your preferred area in ${property.location.neighborhood || property.location.city}.`);
    } else {
      locationScore = 60;
      tradeoffs.push(`Located in ${property.location.city}, slightly adjacent to requested query "${criteria.location}".`);
    }
  }

  // 3. Home Requirements Fit (25% weight)
  let requirementsScore = 100;
  let reqChecks = 0;
  let reqPassed = 0;

  // Bedrooms
  if (criteria.minBedrooms !== undefined && criteria.minBedrooms > 0) {
    reqChecks++;
    if (property.bedrooms >= criteria.minBedrooms) {
      reqPassed++;
      reasons.push(`${property.bedrooms} bedrooms satisfies your minimum requirement of ${criteria.minBedrooms}.`);
    } else {
      tradeoffs.push(`Only ${property.bedrooms} bedrooms (you specified at least ${criteria.minBedrooms}).`);
    }
  }

  // Property Type
  if (criteria.propertyType && criteria.propertyType !== 'any') {
    reqChecks++;
    if (property.propertyType.toLowerCase() === criteria.propertyType.toLowerCase()) {
      reqPassed++;
      reasons.push(`Matches requested property type (${property.propertyType.replace('_', ' ')}).`);
    } else {
      tradeoffs.push(`Property type is ${property.propertyType.replace('_', ' ')} rather than ${criteria.propertyType}.`);
    }
  }

  // House Size / Area
  if (criteria.minArea && criteria.minArea > 0) {
    reqChecks++;
    if (property.areaSqFt >= criteria.minArea) {
      reqPassed++;
      reasons.push(`Spacious ${property.areaSqFt.toLocaleString()} sq ft meets your ${criteria.minArea.toLocaleString()} sq ft requirement.`);
    } else {
      tradeoffs.push(`Total area of ${property.areaSqFt.toLocaleString()} sq ft is below your ${criteria.minArea.toLocaleString()} target.`);
    }
  }

  // Architectural style
  if (criteria.architecturalStyle && criteria.architecturalStyle.trim()) {
    reqChecks++;
    if (property.architecturalStyle?.toLowerCase().includes(criteria.architecturalStyle.toLowerCase())) {
      reqPassed++;
      reasons.push(`Architectural design reflects ${property.architecturalStyle} style.`);
    } else {
      tradeoffs.push(`Architectural style is ${property.architecturalStyle || 'standard'} instead of ${criteria.architecturalStyle}.`);
    }
  }

  requirementsScore = reqChecks > 0 ? Math.round((reqPassed / reqChecks) * 100) : 95;

  // 4. Amenities Fit (15% weight)
  let amenitiesScore = 100;
  const requestedFeatures = criteria.features || [];
  if (requestedFeatures.length > 0) {
    const propFeatures = property.features.map(f => f.toLowerCase());
    let featureMatches = 0;

    for (const reqFeature of requestedFeatures) {
      const cleanReq = reqFeature.toLowerCase().replace(/[\s_-]/g, '');
      const found = propFeatures.some(f => f.replace(/[\s_-]/g, '').includes(cleanReq) || cleanReq.includes(f.replace(/[\s_-]/g, '')));
      if (found) {
        featureMatches++;
        reasons.push(`Includes desired feature: ${reqFeature}.`);
      } else {
        tradeoffs.push(`Lacks requested amenity: ${reqFeature}.`);
      }
    }

    amenitiesScore = Math.round((featureMatches / requestedFeatures.length) * 100);
  } else {
    amenitiesScore = 90;
  }

  // 5. Neighborhood Fit (10% weight)
  let neighborhoodScore = 85;
  if (property.neighborhood) {
    const schoolsNearby = property.neighborhood.schools.length;
    const transitNearby = property.neighborhood.transit.length;
    const parksNearby = property.neighborhood.parks.length;

    if (criteria.schoolProximity && schoolsNearby > 0) {
      neighborhoodScore += 10;
      reasons.push(`${schoolsNearby} school(s) located within ${property.neighborhood.radiusMeters / 1000} km.`);
    }
    if (criteria.transitProximity && transitNearby > 0) {
      neighborhoodScore += 10;
      reasons.push(`High transit accessibility with nearby stations.`);
    }
    if (criteria.quietNeighborhood && parksNearby > 0) {
      neighborhoodScore += 5;
      reasons.push(`Green space and parks nearby for family-friendly recreation.`);
    }
  }
  neighborhoodScore = Math.min(100, Math.max(40, neighborhoodScore));

  // Weighted overall calculation:
  // Budget: 30%, Location: 20%, Requirements: 25%, Amenities: 15%, Neighborhood: 10%
  const overall = Math.round(
    budgetScore * 0.30 +
    locationScore * 0.20 +
    requirementsScore * 0.25 +
    amenitiesScore * 0.15 +
    neighborhoodScore * 0.10
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    breakdown: {
      budgetFit: budgetScore,
      locationFit: locationScore,
      requirementsFit: requirementsScore,
      amenitiesFit: amenitiesScore,
      neighborhoodFit: neighborhoodScore,
    },
    reasons,
    tradeoffs,
  };
}
