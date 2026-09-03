import React from 'react';
import { X, GitCompare, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Property } from '../types.ts';

interface PropertyComparisonModalProps {
  properties: Property[];
  onClose: () => void;
  onSelectProperty: (property: Property) => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  properties,
  onClose,
  onSelectProperty,
}) => {
  if (properties.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-slate-700 shrink-0" />
            <h2 className="font-bold text-sm sm:text-lg text-slate-900 truncate">
              Side-by-Side Comparison ({properties.length} Properties)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer touch-manipulation"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Swipe Hint Banner */}
        <div className="sm:hidden px-4 py-2 bg-slate-100 text-slate-600 text-xs flex items-center justify-between border-b border-slate-200 shrink-0">
          <span>👉 Swipe horizontally to compare options</span>
          <span className="font-semibold text-slate-800">{properties.length} Homes</span>
        </div>

        {/* Comparison Table */}
        <div className="p-3 sm:p-6 overflow-x-auto overflow-y-auto flex-1">
          <div className="min-w-[620px] sm:min-w-[700px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="py-3 px-3 sm:px-4 w-32 sm:w-40 bg-slate-50 sticky left-0 z-20 font-semibold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200">Specification</th>
                  {properties.map((p, idx) => (
                    <th key={p.id} className="py-3 px-4 bg-slate-50 min-w-[180px] sm:min-w-[220px]">
                      <div className="font-mono text-[10px] uppercase text-slate-400">Option #{idx + 1}</div>
                      <div className="font-bold text-slate-900 text-sm line-clamp-1">{p.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {/* Asking Price */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Asking Price</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4 font-mono font-extrabold text-slate-900 text-base sm:text-lg">
                      ${p.price.toLocaleString()}
                    </td>
                  ))}
                </tr>

                {/* Match Score */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Match Score</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                        {p.matchScore?.overall || 85}% Fit
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Price Per Sq Ft */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Price / sqft</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4 font-mono text-slate-600 text-xs">
                      ${Math.round(p.price / (p.areaSqFt || 1))}
                    </td>
                  ))}
                </tr>

                {/* Bedrooms & Bathrooms */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Beds / Baths</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-slate-800 text-xs">
                      {p.bedrooms} Beds / {p.bathrooms} Baths
                    </td>
                  ))}
                </tr>

                {/* Total Area */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Living Area</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-slate-800 text-xs font-mono">
                      {p.areaSqFt.toLocaleString()} sq ft
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Location</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-slate-800 text-xs">
                      {p.location.address || p.location.city}, {p.location.state || p.location.country}
                    </td>
                  ))}
                </tr>

                {/* Property Type */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Type & Style</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-slate-800 text-xs">
                      {p.propertyType.replace('_', ' ')} ({p.architecturalStyle || 'Modern'})
                    </td>
                  ))}
                </tr>

                {/* Key Features */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Features</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.features.map((f, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                            {f.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Pros */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Key Advantages</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-xs text-slate-700 space-y-1">
                      {(p.matchScore?.reasons || ['Spacious floor plan']).slice(0, 2).map((r, i) => (
                        <div key={i} className="flex items-start text-emerald-700">
                          <Check className="w-3 h-3 mr-1 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Compromises / Cons */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200 text-xs sm:text-sm">Tradeoffs</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-xs text-slate-600 space-y-1">
                      {(p.matchScore?.tradeoffs || ['Standard suburban location']).slice(0, 2).map((t, i) => (
                        <div key={i} className="flex items-start text-amber-700">
                          <AlertCircle className="w-3 h-3 mr-1 shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Select Action */}
                <tr>
                  <td className="py-3 px-3 sm:px-4 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200"></td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      <button
                        onClick={() => {
                          onSelectProperty(p);
                          onClose();
                        }}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors min-h-[40px] cursor-pointer touch-manipulation"
                      >
                        <span>Inspect This Home</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
