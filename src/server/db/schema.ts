/**
 * Drizzle ORM PostgreSQL Schema for DreamHome Agent
 * Defines production tables:
 * users, user_preferences, properties, property_sources,
 * saved_properties, viewing_requests, seller_contacts,
 * agent_sessions, agent_actions, webmcp_tool_logs.
 * Indexes on location, price, bedrooms, property_type.
 */

import { pgTable, text, integer, doublePrecision, boolean, timestamp, index } from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. User Preferences Table
export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  budget: integer('budget'),
  location: text('location'),
  bedrooms: integer('bedrooms'),
  propertyType: text('property_type'),
  featuresJson: text('features_json'), // serialized JSON array
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Property Sources Table
export const propertySources = pgTable('property_sources', {
  id: text('id').primaryKey(),
  providerName: text('provider_name').notNull(),
  baseUrl: text('base_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Properties Table
export const properties = pgTable(
  'properties',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id').references(() => propertySources.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    price: integer('price').notNull(),
    currency: text('currency').default('$').notNull(),
    address: text('address').notNull(),
    city: text('city').notNull(),
    state: text('state'),
    zipCode: text('zip_code'),
    country: text('country').default('US').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    neighborhood: text('neighborhood'),
    bedrooms: integer('bedrooms').notNull(),
    bathrooms: doublePrecision('bathrooms').notNull(),
    areaSqFt: integer('area_sq_ft').notNull(),
    propertyType: text('property_type').notNull(), // single_family, condo, townhouse, etc.
    architecturalStyle: text('architectural_style'),
    floors: integer('floors').default(1).notNull(),
    yearBuilt: integer('year_built'),
    featuresJson: text('features_json').notNull(), // JSON array
    photosJson: text('photos_json').notNull(), // JSON array
    sellerName: text('seller_name').notNull(),
    sellerType: text('seller_type').default('agent').notNull(),
    sellerPhone: text('seller_phone'),
    sellerEmail: text('seller_email'),
    sellerCompany: text('seller_company'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    cityIndex: index('properties_city_idx').on(table.city),
    neighborhoodIndex: index('properties_neighborhood_idx').on(table.neighborhood),
    priceIndex: index('properties_price_idx').on(table.price),
    bedroomsIndex: index('properties_bedrooms_idx').on(table.bedrooms),
    propertyTypeIndex: index('properties_type_idx').on(table.propertyType),
  })
);

// 5. Saved Properties Table
export const savedProperties = pgTable('saved_properties', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  propertyId: text('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Viewing Requests Table
export const viewingRequests = pgTable('viewing_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  propertyId: text('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  preferredDate: text('preferred_date').notNull(),
  preferredTime: text('preferred_time').notNull(),
  notes: text('notes'),
  status: text('status').default('pending').notNull(), // pending, confirmed, rescheduled, cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Seller Contacts Table
export const sellerContacts = pgTable('seller_contacts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  propertyId: text('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  recipient: text('recipient').notNull(),
  message: text('message').notNull(),
  requiresApproval: boolean('requires_approval').default(true).notNull(),
  approvalStatus: text('approval_status').default('pending').notNull(), // pending, approved, rejected
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Agent Sessions Table
export const agentSessions = pgTable('agent_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  criteriaJson: text('criteria_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Agent Actions Table
export const agentActions = pgTable('agent_actions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => agentSessions.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionType: text('action_type').notNull(),
  payloadJson: text('payload_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. WebMCP Tool Logs Table
export const webmcpToolLogs = pgTable('webmcp_tool_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  toolName: text('tool_name').notNull(),
  inputJson: text('input_json').notNull(),
  outputSummary: text('output_summary').notNull(),
  success: boolean('success').notNull(),
  approvalStatus: text('approval_status').default('not_required').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
