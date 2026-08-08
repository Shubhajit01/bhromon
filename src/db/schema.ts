import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import * as authSchema from './auth.schema';

export * from './auth.schema';

export const tripStatuses = ['draft', 'confirmed'] as const;

export type TripStatus = (typeof tripStatuses)[number];

export const itineraryRevisionStatuses = [
  'draft',
  'confirmed',
  'superseded',
  'discarded',
] as const;

export type ItineraryRevisionStatus =
  (typeof itineraryRevisionStatuses)[number];

export const trip = sqliteTable(
  'trip',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authSchema.user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: text('status').$type<TripStatus>().notNull().default('draft'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdateFn(() => sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    check('trip_status_check', sql`${table.status} in ('draft', 'confirmed')`),
  ],
);

export const itineraryRevision = sqliteTable(
  'itinerary_revision',
  {
    id: text('id').primaryKey(),
    tripId: text('trip_id')
      .notNull()
      .references(() => trip.id, { onDelete: 'cascade' }),
    revisionNumber: integer('revision_number').notNull(),
    status: text('status')
      .$type<ItineraryRevisionStatus>()
      .notNull()
      .default('draft'),
    content: text('content', { mode: 'json' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    confirmedAt: integer('confirmed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('itinerary_revision_trip_revision_unique').on(
      table.tripId,
      table.revisionNumber,
    ),
    uniqueIndex('itinerary_revision_current_draft_unique')
      .on(table.tripId)
      .where(sql`${table.status} = 'draft'`),
    uniqueIndex('itinerary_revision_current_confirmed_unique')
      .on(table.tripId)
      .where(sql`${table.status} = 'confirmed'`),
    index('itinerary_revision_trip_status_revision_idx').on(
      table.tripId,
      table.status,
      table.revisionNumber,
    ),
    check('itinerary_revision_number_check', sql`${table.revisionNumber} > 0`),
    check(
      'itinerary_revision_status_check',
      sql`${table.status} in ('draft', 'confirmed', 'superseded', 'discarded')`,
    ),
    check(
      'itinerary_revision_content_json_check',
      sql`json_valid(${table.content})`,
    ),
  ],
);
