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
    itineraryRevisions: r.many.itineraryRevision(),
  },
  itineraryRevision: {
    trip: r.one.trip({
      from: r.itineraryRevision.tripId,
      to: r.trip.id,
      optional: false,
    }),
    days: r.many.itineraryDay(),
    transitions: r.many.itineraryTransition(),
  },
  itineraryDay: {
    revision: r.one.itineraryRevision({
      from: r.itineraryDay.revisionId,
      to: r.itineraryRevision.id,
      optional: false,
    }),
    highlights: r.many.itineraryDayHighlight(),
    visits: r.many.placeVisit(),
  },
  itineraryDayHighlight: {
    day: r.one.itineraryDay({
      from: r.itineraryDayHighlight.dayId,
      to: r.itineraryDay.id,
      optional: false,
    }),
  },
  place: {
    visits: r.many.placeVisit(),
    externalIds: r.many.placeExternalId(),
  },
  placeExternalId: {
    place: r.one.place({
      from: r.placeExternalId.placeId,
      to: r.place.id,
      optional: false,
    }),
  },
  placeVisit: {
    day: r.one.itineraryDay({
      from: [r.placeVisit.dayId, r.placeVisit.revisionId],
      to: [r.itineraryDay.id, r.itineraryDay.revisionId],
      optional: false,
    }),
    place: r.one.place({
      from: r.placeVisit.placeId,
      to: r.place.id,
      optional: false,
    }),
    activities: r.many.itineraryActivity(),
    outgoingTransitions: r.many.itineraryTransition({
      from: [r.placeVisit.id, r.placeVisit.revisionId],
      to: [
        r.itineraryTransition.originVisitId,
        r.itineraryTransition.revisionId,
      ],
      alias: 'transitionOrigin',
    }),
    incomingTransitions: r.many.itineraryTransition({
      from: [r.placeVisit.id, r.placeVisit.revisionId],
      to: [
        r.itineraryTransition.destinationVisitId,
        r.itineraryTransition.revisionId,
      ],
      alias: 'transitionDestination',
    }),
  },
  itineraryActivity: {
    visit: r.one.placeVisit({
      from: [r.itineraryActivity.visitId, r.itineraryActivity.revisionId],
      to: [r.placeVisit.id, r.placeVisit.revisionId],
      optional: false,
    }),
  },
  itineraryTransition: {
    revision: r.one.itineraryRevision({
      from: r.itineraryTransition.revisionId,
      to: r.itineraryRevision.id,
      optional: false,
    }),
    originVisit: r.one.placeVisit({
      from: [
        r.itineraryTransition.originVisitId,
        r.itineraryTransition.revisionId,
      ],
      to: [r.placeVisit.id, r.placeVisit.revisionId],
      optional: false,
      alias: 'transitionOrigin',
    }),
    destinationVisit: r.one.placeVisit({
      from: [
        r.itineraryTransition.destinationVisitId,
        r.itineraryTransition.revisionId,
      ],
      to: [r.placeVisit.id, r.placeVisit.revisionId],
      optional: false,
      alias: 'transitionDestination',
    }),
    legs: r.many.itineraryRouteLeg(),
  },
  itineraryRouteLeg: {
    transition: r.one.itineraryTransition({
      from: r.itineraryRouteLeg.transitionId,
      to: r.itineraryTransition.id,
      optional: false,
    }),
  },
}));
