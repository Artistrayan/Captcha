import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sites = pgTable('sites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  domain: text('domain').notNull(),
  siteKey: text('site_key').notNull().unique(), // Public
  secretKeyHash: text('secret_key_hash').notNull(), // Private, stored as hash
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id).notNull(),
  keyHash: text('key_hash').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const captchaChallenges = pgTable('captcha_challenges', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const verificationEvents = pgTable('verification_events', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id).notNull(),
  success: boolean('success').notNull(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usageRecords = pgTable('usage_records', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id).notNull(),
  count: integer('count').default(0).notNull(),
  month: text('month').notNull(), // YYYY-MM
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  plan: text('plan').notNull().default('free'),
  limit: integer('limit').notNull().default(1000),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
