import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  real,
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

export const itineraryTransitionStatuses = [
  'pending',
  'routed',
  'failed',
  'stale',
] as const;

export type ItineraryTransitionStatus =
  (typeof itineraryTransitionStatuses)[number];

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
    destinationTimeZone: text('destination_time_zone'),
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
  ],
);

export const itineraryDay = sqliteTable(
  'itinerary_day',
  {
    id: text('id').primaryKey(),
    revisionId: text('revision_id')
      .notNull()
      .references(() => itineraryRevision.id, { onDelete: 'cascade' }),
    sourceRef: text('source_ref').notNull(),
    dayNumber: integer('day_number').notNull(),
    date: text('date'),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
  },
  (table) => [
    uniqueIndex('itinerary_day_revision_number_unique').on(
      table.revisionId,
      table.dayNumber,
    ),
    uniqueIndex('itinerary_day_revision_source_ref_unique').on(
      table.revisionId,
      table.sourceRef,
    ),
    uniqueIndex('itinerary_day_id_revision_unique').on(
      table.id,
      table.revisionId,
    ),
    index('itinerary_day_revision_idx').on(table.revisionId),
    check('itinerary_day_number_check', sql`${table.dayNumber} > 0`),
  ],
);

export const itineraryDayHighlight = sqliteTable(
  'itinerary_day_highlight',
  {
    id: text('id').primaryKey(),
    dayId: text('day_id')
      .notNull()
      .references(() => itineraryDay.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    text: text('text').notNull(),
  },
  (table) => [
    uniqueIndex('itinerary_day_highlight_position_unique').on(
      table.dayId,
      table.position,
    ),
    index('itinerary_day_highlight_day_idx').on(table.dayId),
    check('itinerary_day_highlight_position_check', sql`${table.position} > 0`),
  ],
);

export const place = sqliteTable(
  'place',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    address: text('address'),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdateFn(() => sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('place_name_idx').on(table.name),
    check('place_latitude_check', sql`${table.latitude} between -90 and 90`),
    check(
      'place_longitude_check',
      sql`${table.longitude} between -180 and 180`,
    ),
  ],
);

export const placeExternalId = sqliteTable(
  'place_external_id',
  {
    id: text('id').primaryKey(),
    placeId: integer('place_id')
      .notNull()
      .references(() => place.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    externalId: text('external_id').notNull(),
  },
  (table) => [
    uniqueIndex('place_external_id_provider_id_unique').on(
      table.provider,
      table.externalId,
    ),
    uniqueIndex('place_external_id_place_provider_unique').on(
      table.placeId,
      table.provider,
    ),
    index('place_external_id_place_idx').on(table.placeId),
  ],
);

export const placeVisit = sqliteTable(
  'place_visit',
  {
    id: text('id').primaryKey(),
    revisionId: text('revision_id').notNull(),
    dayId: text('day_id').notNull(),
    placeId: integer('place_id')
      .notNull()
      .references(() => place.id),
    sourceRef: text('source_ref').notNull(),
    sequence: integer('sequence').notNull(),
  },
  (table) => [
    uniqueIndex('place_visit_day_sequence_unique').on(
      table.dayId,
      table.sequence,
    ),
    uniqueIndex('place_visit_day_source_ref_unique').on(
      table.dayId,
      table.sourceRef,
    ),
    uniqueIndex('place_visit_revision_source_ref_unique').on(
      table.revisionId,
      table.sourceRef,
    ),
    uniqueIndex('place_visit_id_revision_unique').on(
      table.id,
      table.revisionId,
    ),
    index('place_visit_day_idx').on(table.dayId),
    index('place_visit_revision_idx').on(table.revisionId),
    index('place_visit_place_idx').on(table.placeId),
    foreignKey({
      name: 'place_visit_day_revision_fk',
      columns: [table.dayId, table.revisionId],
      foreignColumns: [itineraryDay.id, itineraryDay.revisionId],
    }).onDelete('cascade'),
    check('place_visit_sequence_check', sql`${table.sequence} > 0`),
  ],
);

export const itineraryActivity = sqliteTable(
  'itinerary_activity',
  {
    id: text('id').primaryKey(),
    revisionId: text('revision_id').notNull(),
    visitId: text('visit_id').notNull(),
    sourceRef: text('source_ref').notNull(),
    position: integer('position').notNull(),
    category: text('category'),
    startTime: text('start_time'),
    endTime: text('end_time'),
    timeLabel: text('time_label'),
    title: text('title').notNull(),
    description: text('description'),
  },
  (table) => [
    uniqueIndex('itinerary_activity_visit_position_unique').on(
      table.visitId,
      table.position,
    ),
    uniqueIndex('itinerary_activity_visit_source_ref_unique').on(
      table.visitId,
      table.sourceRef,
    ),
    uniqueIndex('itinerary_activity_revision_source_ref_unique').on(
      table.revisionId,
      table.sourceRef,
    ),
    index('itinerary_activity_visit_idx').on(table.visitId),
    index('itinerary_activity_revision_idx').on(table.revisionId),
    foreignKey({
      name: 'itinerary_activity_visit_revision_fk',
      columns: [table.visitId, table.revisionId],
      foreignColumns: [placeVisit.id, placeVisit.revisionId],
    }).onDelete('cascade'),
    check('itinerary_activity_position_check', sql`${table.position} > 0`),
    check(
      'itinerary_activity_time_presence_check',
      sql`${table.startTime} is not null or ${table.timeLabel} is not null`,
    ),
    check(
      'itinerary_activity_end_time_check',
      sql`${table.endTime} is null or ${table.startTime} is not null`,
    ),
  ],
);

export const itineraryTransition = sqliteTable(
  'itinerary_transition',
  {
    id: text('id').primaryKey(),
    revisionId: text('revision_id')
      .notNull()
      .references(() => itineraryRevision.id, { onDelete: 'cascade' }),
    originVisitId: text('origin_visit_id').notNull(),
    destinationVisitId: text('destination_visit_id').notNull(),
    sequence: integer('sequence').notNull(),
    status: text('status')
      .$type<ItineraryTransitionStatus>()
      .notNull()
      .default('pending'),
    primaryMode: text('primary_mode'),
    distanceMeters: integer('distance_meters'),
    durationSeconds: integer('duration_seconds'),
    provider: text('provider'),
    providerRouteId: text('provider_route_id'),
    encodedPolyline: text('encoded_polyline'),
  },
  (table) => [
    uniqueIndex('itinerary_transition_revision_sequence_unique').on(
      table.revisionId,
      table.sequence,
    ),
    uniqueIndex('itinerary_transition_visit_pair_unique').on(
      table.revisionId,
      table.originVisitId,
      table.destinationVisitId,
    ),
    index('itinerary_transition_revision_idx').on(table.revisionId),
    index('itinerary_transition_origin_visit_idx').on(table.originVisitId),
    index('itinerary_transition_destination_visit_idx').on(
      table.destinationVisitId,
    ),
    foreignKey({
      name: 'itinerary_transition_origin_visit_revision_fk',
      columns: [table.originVisitId, table.revisionId],
      foreignColumns: [placeVisit.id, placeVisit.revisionId],
    }).onDelete('cascade'),
    foreignKey({
      name: 'itinerary_transition_destination_visit_revision_fk',
      columns: [table.destinationVisitId, table.revisionId],
      foreignColumns: [placeVisit.id, placeVisit.revisionId],
    }).onDelete('cascade'),
    check('itinerary_transition_sequence_check', sql`${table.sequence} > 0`),
    check(
      'itinerary_transition_status_check',
      sql`${table.status} in ('pending', 'routed', 'failed', 'stale')`,
    ),
    check(
      'itinerary_transition_distinct_visits_check',
      sql`${table.originVisitId} <> ${table.destinationVisitId}`,
    ),
    check(
      'itinerary_transition_distance_check',
      sql`${table.distanceMeters} is null or ${table.distanceMeters} >= 0`,
    ),
    check(
      'itinerary_transition_duration_check',
      sql`${table.durationSeconds} is null or ${table.durationSeconds} >= 0`,
    ),
  ],
);

export const itineraryRouteLeg = sqliteTable(
  'itinerary_route_leg',
  {
    id: text('id').primaryKey(),
    transitionId: text('transition_id')
      .notNull()
      .references(() => itineraryTransition.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(),
    mode: text('mode').notNull(),
    fromLabel: text('from_label'),
    toLabel: text('to_label'),
    departureTime: text('departure_time'),
    arrivalTime: text('arrival_time'),
    distanceMeters: integer('distance_meters'),
    durationSeconds: integer('duration_seconds'),
    encodedPolyline: text('encoded_polyline'),
  },
  (table) => [
    uniqueIndex('itinerary_route_leg_transition_sequence_unique').on(
      table.transitionId,
      table.sequence,
    ),
    index('itinerary_route_leg_transition_idx').on(table.transitionId),
    check('itinerary_route_leg_sequence_check', sql`${table.sequence} > 0`),
    check(
      'itinerary_route_leg_distance_check',
      sql`${table.distanceMeters} is null or ${table.distanceMeters} >= 0`,
    ),
    check(
      'itinerary_route_leg_duration_check',
      sql`${table.durationSeconds} is null or ${table.durationSeconds} >= 0`,
    ),
  ],
);
