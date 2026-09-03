/**
 * Real Geocoding Provider Layer
 * Supports OpenStreetMap Nominatim (Public, Zero-Key, Official) and Google Geocoding API.
 * NO FAKE COORDINATES.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface GeocodingProvider {
  name: string;
  geocode(query: string): Promise<GeocodeResult | null>;
  reverseGeocode(lat: number, lng: number): Promise<string | null>;
}

export class NominatimGeocodingProvider implements GeocodingProvider {
  name = 'OpenStreetMap Nominatim';

  async geocode(query: string): Promise<GeocodeResult | null> {
    if (!query || !query.trim()) return null;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=1&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DreamHomeAgent/1.0 (WebMCP-RealEstate; legitimate-research)',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        console.warn(`Nominatim geocoding responded with HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      const first = data[0];
      const address = first.address || {};
      const city = address.city || address.town || address.village || address.municipality || address.county || '';
      const state = address.state || '';
      const country = address.country || '';

      return {
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
        displayName: first.display_name,
        city,
        state,
        country,
      };
    } catch (err) {
      console.error('Nominatim geocoding error:', err);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DreamHomeAgent/1.0 (WebMCP-RealEstate; legitimate-research)',
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.display_name || null;
    } catch (err) {
      console.error('Nominatim reverseGeocode error:', err);
      return null;
    }
  }
}

export class GoogleGeocodingProvider implements GeocodingProvider {
  name = 'Google Geocoding API';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocode(query: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) return null;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null;
      }

      const result = data.results[0];
      const location = result.geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        displayName: result.formatted_address,
      };
    } catch (err) {
      console.error('Google geocoding error:', err);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) return null;
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.status === 'OK' && data.results?.[0]) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}

// Factory function
export function getGeocodingProvider(): GeocodingProvider {
  const customProvider = process.env.GEOCODING_PROVIDER;
  const googleKey = process.env.GEOCODING_API_KEY || process.env.MAPS_API_KEY;

  if (customProvider === 'google' && googleKey) {
    return new GoogleGeocodingProvider(googleKey);
  }

  // Default to robust, live, keyless OpenStreetMap Nominatim
  return new NominatimGeocodingProvider();
}
