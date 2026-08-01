import { defineRelations, sql } from 'drizzle-orm';
import { check, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import * as authSchema from './auth.schema';

export * from './auth.schema';

export const tripStatuses = ['draft', 'confirmed'] as const;

export type TripStatus = (typeof tripStatuses)[number];

export const trip = sqliteTable(
  'trip',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    status: text('status').$type<TripStatus>().notNull().default('draft'),
  },
  (table) => [
    check('trip_status_check', sql`${table.status} in ('draft', 'confirmed')`),
  ],
);

export const relations = defineRelations(authSchema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },
}));
