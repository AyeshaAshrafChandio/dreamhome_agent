/**
 * DreamHome Agent — Full-Stack Express Server
 * Serves real estate APIs, AI agent reasoning, WebMCP backend routes,
 * and mounts Vite development middleware.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { dbManager } from './src/server/db/index.ts';
import { getActivePropertyProvider } from './src/server/providers/property.ts';
import { getGeocodingProvider } from './src/server/providers/geocoding.ts';
import { getPlacesProvider } from './src/server/providers/places.ts';
import { processUserIntent } from './src/server/agent.ts';
import { calculateAffordability } from './src/lib/affordability.ts';
import { calculateMatchScore } from './src/lib/matching.ts';
import { Property, SearchCriteria, AffordabilityInput } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Simple JWT / Auth Token helper using crypto
const AUTH_SECRET = process.env.AUTH_SECRET || 'dreamhome-agent-production-secret-key-32chars';

function createToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 86400000 * 7 })).toString('base64');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifyToken(token: string): string | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('hex');
    if (expected !== signature) return null;
    const data = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
    if (data.exp < Date.now()) return null;
    return data.userId;
  } catch {
    return null;
  }
}

// Auth middleware (tolerant: provides authenticated user if token present, or demo guest user)
function getAuthUserId(req: Request): string {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.substring(7);
    const id = verifyToken(token);
    if (id) return id;
  }
  return 'user_default_buyer';
}

// ---------------- API ROUTES ----------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 1. System & Configuration Status
app.get('/api/config/status', async (req: Request, res: Response) => {
  const propertyProvider = getActivePropertyProvider();
  const geocoding = getGeocodingProvider();
  const places = getPlacesProvider();
  const dbStatus = dbManager.getDatabaseStatus();

  res.json({
    webMcpDetected: true,
    webMcpMode: 'standard_bridge',
    registeredToolsCount: 10,
    registeredTools: [
      'search_homes',
      'get_property_details',
      'compare_properties',
      'search_neighborhood',
      'calculate_affordability',
      'save_property',
      'get_saved_properties',
      'create_viewing_request',
      'contact_seller',
      'get_user_preferences',
    ],
    database: dbStatus,
    providers: {
      propertyApi: {
        name: propertyProvider.name,
        configured: propertyProvider.isConfigured(),
        status: propertyProvider.isConfigured()
          ? 'Active (Live API Connected)'
          : 'Awaiting API Key (Set RENTCAST_API_KEY in .env or Settings)',
      },
      geocoding: {
        name: geocoding.name,
        configured: true,
        status: 'Active (OpenStreetMap Global Coordinates)',
      },
      places: {
        name: places.name,
        configured: true,
        status: 'Active (OpenStreetMap Overpass POI Engine)',
      },
      ai: {
        name: 'Google Gemini AI',
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: 'gemini-3.8-flash',
      },
    },
  });
});

// 2. Authentication Routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await dbManager.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = crypto.createHash('sha256').update(password + AUTH_SECRET).digest('hex');
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const user = await dbManager.createUser({ id, email, name, passwordHash });
    const token = createToken(user.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await dbManager.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const hash = crypto.createHash('sha256').update(password + AUTH_SECRET).digest('hex');
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(user.id);
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const user = await dbManager.getUserById(userId);
  if (user) {
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } else {
    res.json({ user: { id: userId, email: 'buyer@dreamhome.agent', name: 'Home Buyer' } });
  }
});

// 3. Property Search Route
app.post('/api/properties/search', async (req: Request, res: Response) => {
  try {
    const criteria: SearchCriteria = req.body || { location: 'Austin, TX' };
    const propertyProvider = getActivePropertyProvider();
    const geocoding = getGeocodingProvider();
    const places = getPlacesProvider();

    // 1. Geocode location if provided
    let geocodeResult = null;
    if (criteria.location && criteria.location.trim()) {
      geocodeResult = await geocoding.geocode(criteria.location);
    }

    // 2. Query Property Provider or Database
    let properties: Property[] = [];
    let providerName = propertyProvider.name;
    let configured = propertyProvider.isConfigured();
    let errorMessage: string | undefined;

    if (configured) {
      const searchRes = await propertyProvider.searchProperties(criteria);
      properties = searchRes.properties;
      errorMessage = searchRes.error;
    } else {
      // Check database storage
      properties = await dbManager.searchProperties(criteria);
      if (properties.length === 0) {
        errorMessage = 'Property provider API key is unconfigured and database contains no listings. Please configure RENTCAST_API_KEY in .env or Settings.';
      }
    }

    // 3. Enrich properties with real coordinates and real OpenStreetMap POI
    const enrichedProperties = await Promise.all(
      properties.map(async (p) => {
        // If property lacks coordinates, geocode its address
        if ((!p.location.lat || !p.location.lng) && p.location.address) {
          const geo = await geocoding.geocode(`${p.location.address}, ${p.location.city}`);
          if (geo) {
            p.location.lat = geo.lat;
            p.location.lng = geo.lng;
          } else if (geocodeResult) {
            p.location.lat = geocodeResult.lat;
            p.location.lng = geocodeResult.lng;
          }
        }

        // Fetch real neighborhood POI if coordinates exist
        if (p.location.lat && p.location.lng && !p.neighborhood) {
          try {
            p.neighborhood = await places.getNeighborhoodAmenities(
              p.location.lat,
              p.location.lng,
              p.location.address || p.location.city,
              2000
            );
          } catch (e) {
            console.warn('Could not fetch neighborhood POI for property', p.id);
          }
        }

        // Compute DreamHome Match Score
        p.matchScore = calculateMatchScore(p, criteria);
        await dbManager.saveOrUpdateProperty(p);
        return p;
      })
    );

    // Sort properties by overall match score descending
    enrichedProperties.sort((a, b) => (b.matchScore?.overall || 0) - (a.matchScore?.overall || 0));

    // Log the WebMCP action
    const userId = getAuthUserId(req);
    await dbManager.logWebMcpAction({
      userId,
      toolName: 'search_homes',
      input: criteria,
      outputSummary: `Found ${enrichedProperties.length} properties in ${criteria.location || 'specified criteria'}.`,
      success: true,
      approvalStatus: 'not_required',
    });

    res.json({
      properties: enrichedProperties,
      total: enrichedProperties.length,
      criteria,
      geocodeResult,
      providerName,
      configured,
      error: errorMessage,
    });
  } catch (err: any) {
    console.error('Property search error:', err);
    res.status(500).json({ error: `Property search failed: ${err.message}` });
  }
});

// 4. Property Detail Route
app.get('/api/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let prop = await dbManager.getPropertyById(id);

    if (!prop) {
      const provider = getActivePropertyProvider();
      prop = await provider.getProperty(id);
    }

    if (!prop) {
      return res.status(404).json({ error: `Property with ID ${id} not found.` });
    }

    const userId = getAuthUserId(req);
    await dbManager.logWebMcpAction({
      userId,
      toolName: 'get_property_details',
      input: { propertyId: id },
      outputSummary: `Retrieved specifications for ${prop.title} ($${prop.price.toLocaleString()}).`,
      success: true,
      approvalStatus: 'not_required',
    });

    res.json(prop);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Compare Properties Route
app.post('/api/properties/compare', async (req: Request, res: Response) => {
  try {
    const { propertyIds, criteria = {} } = req.body;
    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({ error: 'propertyIds array is required' });
    }

    const properties: Property[] = [];
    for (const id of propertyIds) {
      const p = await dbManager.getPropertyById(id);
      if (p) properties.push(p);
    }

    if (properties.length === 0) {
      return res.status(404).json({ error: 'None of the requested properties were found.' });
    }

    const comparisonTable = properties.map((p) => {
      const afford = calculateAffordability({
        budget: criteria.maxBudget || p.price * 0.007,
        propertyPrice: p.price,
        downPayment: p.price * 0.2,
        financingRate: 6.5,
        financingYears: 30,
      });

      return {
        id: p.id,
        title: p.title,
        price: p.price,
        pricePerSqFt: p.areaSqFt > 0 ? Math.round(p.price / p.areaSqFt) : 0,
        location: `${p.location.city}, ${p.location.state || ''}`,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqFt: p.areaSqFt,
        features: p.features,
        estimatedMonthlyPayment: afford.totalMonthlyPayment,
        matchScore: p.matchScore?.overall || 85,
        pros: p.matchScore?.reasons || ['Solid structural specifications'],
        cons: p.matchScore?.tradeoffs || [],
      };
    });

    const verdictSummary = `Compared ${properties.length} properties. Top match is ${properties[0].title} with score ${properties[0].matchScore?.overall || 85}/100.`;

    const userId = getAuthUserId(req);
    await dbManager.logWebMcpAction({
      userId,
      toolName: 'compare_properties',
      input: { propertyIds },
      outputSummary: verdictSummary,
      success: true,
      approvalStatus: 'not_required',
    });

    res.json({
      properties,
      comparisonTable,
      verdictSummary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Neighborhood Search Route
app.post('/api/neighborhood/search', async (req: Request, res: Response) => {
  try {
    const { location, radius = 2500 } = req.body;
    const geocoding = getGeocodingProvider();
    const places = getPlacesProvider();

    let lat: number;
    let lng: number;
    let addressName: string = '';

    if (typeof location === 'object' && location !== null && location.lat && location.lng) {
      lat = Number(location.lat);
      lng = Number(location.lng);
      addressName = location.address || location.displayName || '';
      if (!addressName) {
        const rev = await geocoding.reverseGeocode(lat, lng);
        addressName = rev || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } else {
      const locationStr = String(location || 'Austin, TX');
      const geo = await geocoding.geocode(locationStr);
      if (!geo) {
        return res.status(404).json({ error: `Could not geocode location: ${locationStr}` });
      }
      lat = geo.lat;
      lng = geo.lng;
      addressName = geo.displayName;
    }

    const neighborhood = await places.getNeighborhoodAmenities(lat, lng, addressName, radius);

    const userId = getAuthUserId(req);
    await dbManager.logWebMcpAction({
      userId,
      toolName: 'search_neighborhood',
      input: { location, radius },
      outputSummary: `Verified ${neighborhood.schools.length} schools and ${neighborhood.transit.length} transit stops near ${addressName.substring(0, 35)}.`,
      success: true,
      approvalStatus: 'not_required',
    });

    res.json(neighborhood);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Affordability Calculation Route
app.post('/api/affordability/calculate', async (req: Request, res: Response) => {
  try {
    const input: AffordabilityInput = req.body;
    const result = calculateAffordability(input);

    const userId = getAuthUserId(req);
    await dbManager.logWebMcpAction({
      userId,
      toolName: 'calculate_affordability',
      input,
      outputSummary: `Estimated monthly payment $${result.totalMonthlyPayment.toLocaleString()} on $${Number(input.propertyPrice || 0).toLocaleString()} home.`,
      success: true,
      approvalStatus: 'not_required',
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Saved Properties
app.get('/api/saved', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const saved = await dbManager.getSavedPropertiesForUser(userId);
  res.json({ properties: saved });
});

app.post('/api/saved', async (req: Request, res: Response) => {
  try {
    const { propertyId, notes } = req.body;
    if (!propertyId) return res.status(400).json({ error: 'propertyId is required' });
    const userId = getAuthUserId(req);
    const result = await dbManager.savePropertyForUser(userId, propertyId, notes);

    await dbManager.logWebMcpAction({
      userId,
      toolName: 'save_property',
      input: { propertyId, notes },
      outputSummary: `Property ${propertyId} saved to user profile.`,
      success: true,
      approvalStatus: 'not_required',
    });

    res.json({ success: true, saved: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/saved/:propertyId', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { propertyId } = req.params;
  await dbManager.removeSavedProperty(userId, propertyId);
  res.json({ success: true });
});

// 9. Viewing Requests
app.get('/api/viewings', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const viewings = await dbManager.getViewingRequestsForUser(userId);
  res.json({ viewings });
});

app.post('/api/viewings', async (req: Request, res: Response) => {
  try {
    const { propertyId, preferredDate, preferredTime, notes } = req.body;
    if (!propertyId || !preferredDate || !preferredTime) {
      return res.status(400).json({ error: 'propertyId, preferredDate, and preferredTime are required' });
    }

    const prop = await dbManager.getPropertyById(propertyId);
    const userId = getAuthUserId(req);

    const record = await dbManager.createViewingRequest({
      userId,
      propertyId,
      propertyTitle: prop?.title || 'Property',
      propertyPrice: prop?.price || 0,
      preferredDate,
      preferredTime,
      notes,
    });

    await dbManager.logWebMcpAction({
      userId,
      toolName: 'create_viewing_request',
      input: { propertyId, preferredDate, preferredTime },
      outputSummary: `Created viewing appointment for ${record.propertyTitle} on ${preferredDate} at ${preferredTime} (Status: Pending Seller Confirmation).`,
      success: true,
      approvalStatus: 'not_required',
    });

    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Contact Seller (Approval-Gated Flow)
app.get('/api/contacts', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const contacts = await dbManager.getSellerContactsForUser(userId);
  res.json({ contacts });
});

app.post('/api/contacts/draft', async (req: Request, res: Response) => {
  try {
    const { propertyId, message } = req.body;
    const prop = await dbManager.getPropertyById(propertyId);
    if (!prop) return res.status(404).json({ error: 'Property not found' });

    const userId = getAuthUserId(req);
    const draft = await dbManager.createSellerContactDraft({
      userId,
      propertyId,
      propertyTitle: prop.title,
      propertyPrice: prop.price,
      actionName: 'Contact Seller',
      recipient: prop.seller.name || 'Listing Agent',
      message: message || `Hello, I am interested in ${prop.title}. Please provide more details on availability.`,
    });

    await dbManager.logWebMcpAction({
      userId,
      toolName: 'contact_seller',
      input: { propertyId, message: draft.message },
      outputSummary: `Drafted message to seller ${draft.recipient}. Pausing for explicit human approval.`,
      success: true,
      approvalStatus: 'pending',
    });

    res.json({
      draft,
      requiresApproval: true,
      sellerDetails: {
        name: prop.seller.name || 'Listing Agent',
        company: prop.seller.company || 'Licensed Brokerage',
        phone: prop.seller.phone,
        email: prop.seller.email,
        mlsId: prop.source?.listingId,
        providerName: prop.source?.providerName || 'MLS Live Data',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);
    const approved = await dbManager.approveAndSendSellerContact(id, userId);
    if (!approved) return res.status(404).json({ error: 'Contact draft not found' });

    await dbManager.logWebMcpAction({
      userId,
      toolName: 'contact_seller',
      input: { contactId: id },
      outputSummary: `Human approved contact to ${approved.recipient}. Message officially dispatched.`,
      success: true,
      approvalStatus: 'approved',
    });

    res.json({ success: true, contact: approved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);
    await dbManager.rejectSellerContact(id, userId);

    await dbManager.logWebMcpAction({
      userId,
      toolName: 'contact_seller',
      input: { contactId: id },
      outputSummary: `Human rejected contact request. Action cancelled.`,
      success: true,
      approvalStatus: 'rejected',
    });

    res.json({ success: true, status: 'rejected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. AI Agent Intent Processing
app.post('/api/agent/process-intent', async (req: Request, res: Response) => {
  try {
    const { message, previousCriteria, currentProperties } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const result = await processUserIntent(message, {
      previousCriteria,
      currentProperties,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Action Logs & Audit Trail
app.get('/api/agent/action-logs', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const logs = await dbManager.getWebMcpLogs(userId);
  res.json({ logs });
});

app.post('/api/agent/action-logs', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const log = await dbManager.logWebMcpAction({
    userId,
    toolName: req.body.toolName,
    input: req.body.input || {},
    outputSummary: req.body.outputSummary || 'Executed WebMCP tool',
    success: req.body.success !== false,
    approvalStatus: req.body.approvalStatus || 'not_required',
  });
  res.json(log);
});

// ---------------- VITE & STATIC SERVING ----------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DreamHome Agent server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
