# AGENTS.md

Bhromon is an AI-powered self-tour planning platform. Build the smallest vertical slice that lets a traveller describe a trip, refine a draft itinerary in chat, view it on a map, and confirm it.

## Startup Workflow

1. Read this file, `feature_list.json`, `progress.md`, and `session-handoff.md`.
2. Run `./init.sh` before editing.
3. Work on exactly one feature at a time; select it from `feature_list.json`.

## Product Invariants

- A trip is either `draft` or `confirmed`.
- Editing a confirmed trip creates a draft revision; discarding it preserves the prior confirmed itinerary.
- The canonical trip and itinerary revisions live in D1. Agent/Durable Object state is transient chat coordination, not the source of truth.
- Model-generated trip requirements and itineraries must validate against Zod schemas before persistence.
- Store explicit, user-approved preferences in D1. Add Vectorize only for semantic retrieval/recommendations, not as the profile store.
- Cultural/legal guidance must include source and freshness metadata. Do not present it as legal advice.
- No bookings, sharing, collaboration, or live availability/pricing in MVP scope.

## Technical Direction

- TanStack Start + TanStack Query
- Cloudflare Workers, Agents/Durable Objects, D1, Drizzle, Workers AI
- Zod for model and API boundaries
- Carto for itinerary maps

## Definition of Done

A feature is complete only when its acceptance criteria are met, relevant automated checks pass, evidence is recorded in `feature_list.json` or `progress.md`, and the next session can begin with `./init.sh`.

## End of Session

Update `feature_list.json`, `progress.md`, and `session-handoff.md` with the active feature, verification evidence, decisions, risks, and exact next step. Do not overwrite user work or expand scope without approval.

Leave the repository clean and restartable: the next session must be able to follow the startup workflow and run `./init.sh` immediately.
