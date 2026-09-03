import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Property } from '../types.ts';

interface MapViewProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not yet created
    if (!mapInstanceRef.current) {
      const initialLat = selectedProperty?.location.lat || (properties[0]?.location.lat) || 30.2672;
      const initialLng = selectedProperty?.location.lng || (properties[0]?.location.lng) || -97.7431;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 12,
        zoomControl: true,
      });

      // OpenStreetMap standard tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // ResizeObserver to handle container size changes smoothly on mobile/desktop
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filter properties with valid coordinates
    const validProperties = properties.filter(
      (p) => typeof p.location.lat === 'number' && typeof p.location.lng === 'number' && p.location.lat !== 0
    );

    if (validProperties.length === 0) return;

    const bounds = L.latLngBounds([]);

    // Custom Icon helper
    const createCustomIcon = (priceText: string, isSelected: boolean) => {
      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background-color: ${isSelected ? '#0f172a' : '#ffffff'};
            color: ${isSelected ? '#ffffff' : '#0f172a'};
            border: 1.5px solid ${isSelected ? '#0f172a' : '#cbd5e1'};
            border-radius: 6px;
            padding: 3px 6px;
            font-weight: 700;
            font-size: 11px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            white-space: nowrap;
            display: inline-block;
            cursor: pointer;
          ">
            $${priceText}
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });
    };

    validProperties.forEach((prop) => {
      const isSelected = selectedProperty?.id === prop.id;
      const priceK = prop.price >= 1000000 ? `${(prop.price / 1000000).toFixed(1)}M` : `${Math.round(prop.price / 1000)}k`;
      const icon = createCustomIcon(priceK, isSelected);

      const marker = L.marker([prop.location.lat, prop.location.lng], { icon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 160px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
            $${prop.price.toLocaleString()}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            ${prop.bedrooms} beds • ${prop.bathrooms} baths • ${prop.areaSqFt} sqft
          </div>
          <div style="font-size: 10px; color: #94a3b8;">
            ${prop.location.address || prop.location.city}
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectProperty(prop);
      });

      markersRef.current.push(marker);
      bounds.extend([prop.location.lat, prop.location.lng]);
    });

    // If a property is specifically selected, center on it
    if (selectedProperty && selectedProperty.location.lat && selectedProperty.location.lng) {
      map.setView([selectedProperty.location.lat, selectedProperty.location.lng], 14, { animate: true });
    } else if (validProperties.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [properties, selectedProperty]);

  return (
    <div className="w-full h-full min-h-[350px] rounded-xl overflow-hidden border border-slate-200 relative shadow-xs">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
