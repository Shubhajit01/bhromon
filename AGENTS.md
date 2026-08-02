<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

# AGENTS.md

Bhromon is an AI-powered self-tour planning platform. Build the smallest vertical slice that lets a traveller describe a trip, refine a draft itinerary in chat, view it on a map, and confirm it.

## Code conventions

- Prefer interfaces over type aliases for object-shaped TypeScript declarations. Keep type aliases for unions, intersections, and other types that cannot be expressed naturally as interfaces.
- Prefer minimal, image-led UI with one dominant action, warm personal copy, and no elements that do not support the user's next step.
- Prefer conventional commit message format.

## Data-query convention

Use this structure for entity queries by default. A `get-<entity-in-kebab-case>.ts` filename is the usual home, but choose a different filename when it better fits the feature.

1. Export a main implementation function, using the appropriate boundary for the work: `createClientFn`, `createServerFn`, or `createIsomorphicFn`. When a `createClientFn` or `createServerFn` accepts input, export its Zod schema and its inferred input type, then pass that schema to the function's validator. For example, export `getTripInputSchema` and `GetTripInput`. These are the single source of truth for the boundary and downstream query helpers.
2. Export `get<Entity>QueryOptions`, accepting the main function's inputs and returning the canonical `queryOptions`. Type its parameters from the exported inferred input type. Its `queryFn` must pass React Query's `signal` to the main implementation function.
3. Build query keys from a domain anchor and collection discriminator, followed by direct query inputs: for example, `[ANCHOR_KEYS.TRIP, COLLECTION.ONE, tripId]`. `ANCHOR_KEYS` contains only domain-prefix keys; it must not become a constant for every key fragment. Use shared collection constants such as `COLLECTION.ONE` and `COLLECTION.MANY` to preserve intentional prefix invalidation.
4. Export `load<Entity>(queryClient, ...args)`, which takes `QueryClient` first, accepts the same strongly typed inputs as `get<Entity>QueryOptions`, and calls `ensureQueryData(get<Entity>QueryOptions(...args))`.
5. Export `use<Entity>` as the main consumer hook. Prefer `useSuspenseQuery(get<Entity>QueryOptions(...args))` unless the caller needs non-suspense behaviour.
6. Export `useInvalidate<Entity>`, returning a helper that accepts the same entity inputs and invalidates the matching query via the canonical query-options function.

`src/features/auth/api/get-current-user.ts` is a special case and exposes extra auth-specific helpers. Do not treat its full exported surface as the default entity-query template; use the structure above instead.

## Data-write convention

Use the same function-boundary and input conventions for writes. Export the main `createServerFn`, `createClientFn`, or `createIsomorphicFn` implementation. When it accepts input, export its Zod schema and inferred input type, and use the schema as its validator. Consumers and mutation hooks should take their arguments from that inferred type.

Writes do not expose `get<Entity>QueryOptions`, `load<Entity>`, or `useInvalidate<Entity>` helpers. Those are read-query concerns.

## Todo

- [ ] `feat-001` Foundation: Create the TanStack Start and Cloudflare deployment foundation with D1, Drizzle, and repeatable local verification.
- [ ] `feat-002` Trip domain and revisions: Persist trips, itinerary revisions, draft/confirmed states, and safe discard behavior.
- [ ] `feat-003` Conversational trip planning: Stream a planning conversation that gathers requirements and produces a Zod-validated draft itinerary.
- [ ] `feat-004` Trip views and map: Show draft and confirmed trips, day-by-day itinerary, costs, and mapped travel legs.
- [ ] `feat-005` Preference memory and guidance: Use user-approved explicit preferences in planning and attach sourced cultural/legal guides to destinations.
