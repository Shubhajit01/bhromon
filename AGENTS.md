# AGENTS.md

Bhromon is an AI-powered self-tour planning platform. Build the smallest vertical slice that lets a traveller describe a trip, refine a draft itinerary in chat, view it on a map, and confirm it.

## Code conventions

- Prefer interfaces over type aliases for object-shaped TypeScript declarations. Keep type aliases for unions, intersections, and other types that cannot be expressed naturally as interfaces.
- Prefer minimal, image-led UI with one dominant action, warm personal copy, and no elements that do not support the user's next step.

## Todo

- [ ] `feat-001` Foundation: Create the TanStack Start and Cloudflare deployment foundation with D1, Drizzle, and repeatable local verification.
- [ ] `feat-002` Trip domain and revisions: Persist trips, itinerary revisions, draft/confirmed states, and safe discard behavior.
- [ ] `feat-003` Conversational trip planning: Stream a planning conversation that gathers requirements and produces a Zod-validated draft itinerary.
- [ ] `feat-004` Trip views and map: Show draft and confirmed trips, day-by-day itinerary, costs, and mapped travel legs.
- [ ] `feat-005` Preference memory and guidance: Use user-approved explicit preferences in planning and attach sourced cultural/legal guides to destinations.
