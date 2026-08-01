import { defineRelations } from 'drizzle-orm';

import * as authSchema from './auth.schema';
import * as appSchema from './schema';

export const schemas = { ...authSchema, ...appSchema };

export const relations = defineRelations(schemas, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    trips: r.many.trip(),
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
  trip: {
    user: r.one.user({
      from: r.trip.userId,
      to: r.user.id,
      optional: false,
    }),
  },
}));
