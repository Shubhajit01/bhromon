import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import * as authSchema from './auth.schema';

export * from './auth.schema';

export const tripStatuses = ['draft', 'confirmed'] as const;

export type TripStatus = (typeof tripStatuses)[number];

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
