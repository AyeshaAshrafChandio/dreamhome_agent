import React from 'react';
import { Bed, Bath, Square, MapPin, Heart, GitCompare, MessageSquare, Calendar, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Property } from '../types.ts';

interface PropertyCardProps {
  property: Property;
  index: number;
  isSaved: boolean;
  isCompared: boolean;
  onSave: (property: Property) => void;
  onToggleCompare: (property: Property) => void;
  onSelectDetails: (property: Property) => void;
  onContactSeller: (property: Property) => void;
  onScheduleViewing: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  index,
  isSaved,
  isCompared,
  onSave,
  onToggleCompare,
  onSelectDetails,
  onContactSeller,
  onScheduleViewing,
}) => {
  const matchScore = property.matchScore?.overall || 85;

  // Fallback architectural / house illustration if photos empty
  const photoUrl =
    property.photos && property.photos.length > 0
      ? property.photos[0]
      : `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80`;

  return (
    <div
      id={`property-card-${property.id}`}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all duration-200 group relative"
    >
      {/* Property Image & Clean Minimalism Overlay Badges */}
      <div className="relative aspect-16/10 overflow-hidden bg-slate-100 shrink-0">
        <img
          src={photoUrl}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Clean Minimalism Match Badge */}
        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 uppercase tracking-wide">
          {matchScore}% MATCH
        </div>

        {/* Index counter badge */}
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
          #{index + 1}
        </div>

        {/* Quick Save & Compare buttons with accessible touch targets */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(property);
            }}
            className={`w-9 h-9 sm:w-8 sm:h-8 rounded-md border backdrop-blur-xs transition-colors flex items-center justify-center text-xs shadow-xs cursor-pointer touch-manipulation active:scale-95 ${
              isCompared
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white/95 text-slate-600 hover:text-slate-900 hover:bg-white border-slate-200'
            }`}
            title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
            aria-label={isCompared ? 'Remove from Compare' : 'Add to Compare'}
          >
            <GitCompare className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(property);
            }}
            className={`w-9 h-9 sm:w-8 sm:h-8 rounded-md border backdrop-blur-xs transition-colors flex items-center justify-center text-xs shadow-xs cursor-pointer touch-manipulation active:scale-95 ${
              isSaved
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white/95 text-slate-600 hover:text-rose-600 hover:bg-white border-slate-200'
            }`}
            title={isSaved ? 'Remove from Saved' : 'Save Property'}
            aria-label={isSaved ? 'Remove from Saved' : 'Save Property'}
          >
            <Heart className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Header Title & Price */}
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-1 leading-snug">
              {property.title}
            </h3>
            <span className="text-base sm:text-lg font-bold text-slate-900 shrink-0 font-mono">
              ${property.price.toLocaleString()}
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1">
              {property.location.neighborhood ? `${property.location.neighborhood}, ` : ''}
              {property.location.city || property.location.address} • {property.architecturalStyle || property.propertyType.replace('_', ' ')}
            </span>
          </p>

          {/* Clean Minimalism 3-Box Spec Grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
            <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Beds</div>
              <div className="text-sm font-bold text-slate-900">{property.bedrooms}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Baths</div>
              <div className="text-sm font-bold text-slate-900">{property.bathrooms}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Sq Ft</div>
              <div className="text-sm font-bold text-slate-900">{property.areaSqFt.toLocaleString()}</div>
            </div>
          </div>

          {/* Match Score Reason snippet */}
          {property.matchScore?.reasons && property.matchScore.reasons.length > 0 && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 space-y-1 mb-2">
              <div className="flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3 mr-1.5 shrink-0 text-emerald-600" />
                <span className="line-clamp-1">{property.matchScore.reasons[0]}</span>
              </div>
              {property.matchScore.tradeoffs && property.matchScore.tradeoffs.length > 0 && (
                <div className="flex items-center text-slate-500">
                  <AlertCircle className="w-3 h-3 mr-1.5 shrink-0 text-amber-500" />
                  <span className="line-clamp-1">{property.matchScore.tradeoffs[0]}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls & Affordability Status */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
            <span className="truncate">Affordability Confirmed</span>
          </span>

          <div className="grid grid-cols-3 gap-1.5 w-full xs:w-auto shrink-0">
            <button
              onClick={() => onScheduleViewing(property)}
              className="px-2.5 py-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors min-h-[38px] flex items-center justify-center cursor-pointer touch-manipulation"
              title="Schedule viewing"
            >
              Tour
            </button>
            <button
              onClick={() => onContactSeller(property)}
              className="px-2.5 py-2 sm:py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors min-h-[38px] flex items-center justify-center cursor-pointer touch-manipulation"
              title="Contact Seller (Approval gated)"
            >
              Contact
            </button>
            <button
              onClick={() => onSelectDetails(property)}
              className="px-3 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md transition-colors min-h-[38px] flex items-center justify-center cursor-pointer touch-manipulation"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
