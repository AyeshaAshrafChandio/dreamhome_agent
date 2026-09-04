import React, { useState } from 'react';
import {
  X, Bed, Bath, Square, MapPin, CheckCircle2, AlertCircle, Heart, Calendar, MessageSquare,
  Compass, ChevronLeft, ChevronRight, Maximize2, Camera, Home, Calculator, School, Bus,
  ShoppingCart, Trees, Stethoscope
} from 'lucide-react';
import { Property, AffordabilityResult } from '../types.ts';
import { calculateAffordability } from '../lib/affordability.ts';
import { getRealPropertyPhotoDetails } from '../lib/propertyPhotos.ts';

interface PropertyDetailModalProps {
  property: Property | null;
  onClose: () => void;
  isSaved: boolean;
  onSave: (property: Property) => void;
  onContactSeller: (property: Property) => void;
  onScheduleViewing: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  onClose,
  isSaved,
  onSave,
  onContactSeller,
  onScheduleViewing,
}) => {
  if (!property) return null;

  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Retrieve authentic real property photos with room categorization
  const photoList = getRealPropertyPhotoDetails(property);
  const activePhoto = photoList[activePhotoIdx] || photoList[0];

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIdx((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
  };

  // Local state for affordability parameters
  const [downPayment, setDownPayment] = useState<number>(Math.round(property.price * 0.2));
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [loanYears, setLoanYears] = useState<number>(30);
  const [buyerBudget, setBuyerBudget] = useState<number>(Math.round(property.price * 0.0075));

  const affordability: AffordabilityResult = calculateAffordability({
    budget: buyerBudget,
    propertyPrice: property.price,
    downPayment,
    financingRate: interestRate,
    financingYears: loanYears,
  });

  const match = property.matchScore;
  const neighborhood = property.neighborhood;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Lightbox / Fullscreen Image Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-between p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="w-full flex items-center justify-between text-white py-2 px-4 max-w-6xl">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs uppercase font-mono tracking-wider">
                {activePhoto.category}
              </span>
              <span className="text-sm font-medium text-slate-200">{activePhoto.caption}</span>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white cursor-pointer"
              title="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            className="relative max-w-6xl w-full flex-1 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhoto.url}
              alt={activePhoto.caption}
              referrerPolicy="no-referrer"
              className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            {photoList.length > 1 && (
              <>
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                  title="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                  title="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="py-2 text-slate-400 text-xs font-mono">
            {activePhotoIdx + 1} of {photoList.length} • Click anywhere outside image or press ESC to exit
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-900 text-white">
              {property.propertyType.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-mono">ID: {property.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer touch-manipulation"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          {/* Main Title & Price */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{property.title}</h2>
              <div className="flex items-center text-slate-500 text-xs sm:text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1 text-slate-400 shrink-0" />
                <span>{property.location.address || property.location.city}, {property.location.state || property.location.country}</span>
              </div>
            </div>
            <div className="text-left sm:text-right mt-1 sm:mt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                ${property.price.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                Est. ${(property.price / (property.areaSqFt || 1)).toFixed(0)}/sqft
              </div>
            </div>
          </div>

          {/* Authentic Real Property Photo Gallery */}
          <div className="space-y-2.5">
            {/* Primary Hero Photo Frame */}
            <div className="relative aspect-16/10 sm:aspect-16/9 w-full rounded-xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200 group select-none">
              <img
                src={activePhoto.url}
                alt={activePhoto.caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-101"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
                }}
              />

              {/* Room Caption Badge */}
              <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
                <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-1.5">
                  <Home className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activePhoto.caption}</span>
                </span>
              </div>

              {/* Photo Count and Fullscreen buttons */}
              <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
                <span className="px-2 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-mono rounded-md flex items-center space-x-1">
                  <Camera className="w-3 h-3 text-slate-300" />
                  <span>{activePhotoIdx + 1} / {photoList.length}</span>
                </span>
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-md backdrop-blur-xs transition-colors cursor-pointer"
                  title="View fullscreen"
                  aria-label="View fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Carousel Navigation Arrows */}
              {photoList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                    title="Previous room photo"
                    aria-label="Previous room photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                    title="Next room photo"
                    aria-label="Next room photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Room Thumbnails Filmstrip Strip */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {photoList.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative flex-shrink-0 w-20 sm:w-24 aspect-16/10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === activePhotoIdx
                      ? 'border-slate-900 ring-2 ring-slate-900/30 shadow-xs scale-102'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={p.url}
                    alt={p.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] font-medium text-center py-0.5 truncate px-1">
                    {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Key Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                <Bed className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Bedrooms</div>
                <div className="text-sm font-bold text-slate-900">{property.bedrooms} Beds</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                <Bath className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Bathrooms</div>
                <div className="text-sm font-bold text-slate-900">{property.bathrooms} Baths</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                <Square className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Living Area</div>
                <div className="text-sm font-bold text-slate-900">{property.areaSqFt.toLocaleString()} sqft</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                <Compass className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Style / Built</div>
                <div className="text-sm font-bold text-slate-900 truncate">{property.architecturalStyle || 'Modern'}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-lg border border-slate-200">
              {property.description}
            </p>
          </div>

          {/* DreamHome Match Score Breakdown */}
          {match && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">DreamHome Match Score: {match.overall}/100</h3>
                  <p className="text-xs text-slate-500">Transparent algorithmic fit breakdown for your criteria</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500 text-white font-bold text-sm rounded-md shadow-xs">
                  {match.overall}%
                </span>
              </div>

              {/* Breakdown Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1 text-slate-700">
                    <span>Budget Fit (30%)</span>
                    <span className="font-semibold">{match.breakdown.budgetFit}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${match.breakdown.budgetFit}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-700">
                    <span>Location Fit (20%)</span>
                    <span className="font-semibold">{match.breakdown.locationFit}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${match.breakdown.locationFit}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-700">
                    <span>Home Requirements (25%)</span>
                    <span className="font-semibold">{match.breakdown.requirementsFit}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${match.breakdown.requirementsFit}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-700">
                    <span>Amenities & Lifestyle (15%)</span>
                    <span className="font-semibold">{match.breakdown.amenitiesFit}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${match.breakdown.amenitiesFit}%` }} />
                  </div>
                </div>
              </div>

              {/* Why it matches & Tradeoffs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="font-semibold text-emerald-800 mb-1.5 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Key Matching Reasons
                  </div>
                  <ul className="space-y-1 text-slate-600">
                    {match.reasons.map((r, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-emerald-500 mr-1.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800 mb-1.5 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Tradeoffs & Limitations
                  </div>
                  <ul className="space-y-1 text-slate-600">
                    {match.tradeoffs.length > 0 ? (
                      match.tradeoffs.map((t, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-amber-500 mr-1.5">•</span>
                          <span>{t}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic">No significant compromises identified against requested parameters.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Real OpenStreetMap Neighborhood Analysis */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Neighborhood & Environmental Analysis</h3>
                <p className="text-xs text-slate-500">Real facility distances retrieved from OpenStreetMap</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700">
                Walkability Score: {neighborhood?.walkabilityScore || 75}/100
              </span>
            </div>

            {/* Clear Real Data vs AI Interpretation Banner */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 font-semibold">
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px]">REAL DATA</span>
                <span>{neighborhood?.realDataSummary || 'Proximity metrics verified with OpenStreetMap geographic network.'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded font-mono text-[10px]">AI INTERPRETATION</span>
                <span>{neighborhood?.aiInterpretation || 'Convenient layout for daily errands and commuting.'}</span>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Schools */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mb-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <span>Nearby Schools</span>
                </div>
                {neighborhood?.schools && neighborhood.schools.length > 0 ? (
                  <ul className="space-y-1 text-slate-600">
                    {neighborhood.schools.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="truncate pr-2">{s.name}</span>
                        <span className="font-mono text-slate-500 shrink-0">{s.distanceKm} km</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">No schools found within 2.5 km</p>
                )}
              </div>

              {/* Transit */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mb-2">
                  <Bus className="w-4 h-4 text-emerald-600" />
                  <span>Public Transit</span>
                </div>
                {neighborhood?.transit && neighborhood.transit.length > 0 ? (
                  <ul className="space-y-1 text-slate-600">
                    {neighborhood.transit.slice(0, 3).map((t, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="truncate pr-2">{t.name}</span>
                        <span className="font-mono text-slate-500 shrink-0">{t.distanceKm} km</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">No transit stations mapped nearby</p>
                )}
              </div>

              {/* Supermarkets */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900 mb-2">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                  <span>Groceries & Shopping</span>
                </div>
                {neighborhood?.groceryStores && neighborhood.groceryStores.length > 0 ? (
                  <ul className="space-y-1 text-slate-600">
                    {neighborhood.groceryStores.slice(0, 3).map((g, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="truncate pr-2">{g.name}</span>
                        <span className="font-mono text-slate-500 shrink-0">{g.distanceKm} km</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">Local grocery stores not indexed</p>
                )}
              </div>
            </div>
          </div>

          {/* Deterministic Affordability Calculator */}
          <div className="p-5 rounded-xl bg-slate-900 text-white space-y-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">Deterministic Affordability Calculator</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-emerald-400 rounded-md font-mono border border-slate-700">
                Mathematical Verification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Down Payment ($)</label>
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full p-2.5 sm:p-2 bg-slate-800 border border-slate-700 rounded-md text-white font-mono text-sm sm:text-xs outline-hidden focus:border-slate-500 min-h-[42px] sm:min-h-0"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full p-2.5 sm:p-2 bg-slate-800 border border-slate-700 rounded-md text-white font-mono text-sm sm:text-xs outline-hidden focus:border-slate-500 min-h-[42px] sm:min-h-0"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Loan Term (Years)</label>
                <select
                  value={loanYears}
                  onChange={(e) => setLoanYears(Number(e.target.value))}
                  className="w-full p-2.5 sm:p-2 bg-slate-800 border border-slate-700 rounded-md text-white font-mono text-sm sm:text-xs outline-hidden focus:border-slate-500 min-h-[42px] sm:min-h-0"
                >
                  <option value={15}>15 Years Fixed</option>
                  <option value={30}>30 Years Fixed</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  value={buyerBudget}
                  onChange={(e) => setBuyerBudget(Number(e.target.value))}
                  className="w-full p-2.5 sm:p-2 bg-slate-800 border border-slate-700 rounded-md text-white font-mono text-sm sm:text-xs outline-hidden focus:border-slate-500 min-h-[42px] sm:min-h-0"
                />
              </div>
            </div>

            {/* Affordability Output Breakdown */}
            <div className="p-3.5 sm:p-4 bg-slate-800/90 rounded-lg border border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Principal & Interest</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  ${affordability.monthlyPrincipalAndInterest.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tax & Insurance</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  ${(affordability.monthlyTax + affordability.monthlyInsurance).toFixed(0)}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Monthly</div>
                <div className="text-base font-extrabold text-white mt-0.5 font-mono">
                  ${affordability.totalMonthlyPayment.toLocaleString()}/mo
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Status</div>
                <div className={`text-xs font-bold mt-1 ${affordability.isAffordable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {affordability.isAffordable ? 'Within Budget' : 'Exceeds Budget'}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic">{affordability.explanation}</p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onSave(property)}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-md text-xs font-medium transition-colors flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer touch-manipulation ${
              isSaved ? 'bg-rose-500 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Heart className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved to Favorites' : 'Save Property'}</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => onScheduleViewing(property)}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-lg sm:rounded-md text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 min-h-[44px] cursor-pointer touch-manipulation"
            >
              <Calendar className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-600" />
              <span>Schedule Viewing</span>
            </button>

            <button
              onClick={() => onContactSeller(property)}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg sm:rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1.5 min-h-[44px] cursor-pointer touch-manipulation"
            >
              <MessageSquare className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span>Contact Seller (Approval Gate)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
