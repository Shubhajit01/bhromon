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
- When creating new UI, read `DESIGN.md` before making changes. Do not read it by default for existing-UI maintenance or non-UI work.
- Prefer minimal, image-led UI with one dominant action, warm personal copy, and no elements that do not support the user's next step.
- Prefer conventional commit message format.

## Logging conventions

- Log structured lifecycle events at system boundaries and important state transitions: external calls, durable/background work, writes, authorization failures, retries, and unexpected errors. Include stable correlation fields (for example `tripId`, request/diagnostic ID, status, counts, and duration), but never prompts, chat content, credentials, cookies, tokens, or unnecessary personal data.
- Keep routine success paths quiet. Do not log every render, query-cache hit, protocol frame, normal socket connection, or every step of one operation. Prefer one start/completion pair for a meaningful long-running operation, warnings for recoverable degradation, and one error at the boundary that can act on it. Remove temporary diagnostic logs once the issue is understood.

## Date and time conventions

- Use `@formkit/tempo` for application-level date construction, parsing, formatting, and arithmetic. Keep native date APIs only at platform boundaries where Tempo has no equivalent, such as `Intl.DurationFormat`, browser timezone discovery, and database timestamp types.
- Read the traveller's IANA timezone through `getUserTimeZone()` from `src/utils/user-time-zone.ts`. Use `getUserDate()` when constructing a date in that timezone instead of pairing `tzDate(...)` with a separately derived timezone.
- Treat instants, calendar dates, and destination-local times as different concepts. Do not apply the traveller's timezone to destination-local itinerary data unless the product explicitly calls for that conversion.
- Derive agent timezone context from the timezone cookie/header. Do not send a client-generated current timestamp or timezone object in chat payloads. Compute the current instant when the agent prompt is generated, using the connection cookie when available and the server-derived stored timezone for the initial server-triggered reply.

## Data-query convention

Use this structure for entity queries by default. A `get-<entity-in-kebab-case>.ts` filename is the usual home, but choose a different filename when it better fits the feature.

1. Export a main implementation function, using the appropriate boundary for the work: `createClientFn`, `createServerFn`, or `createIsomorphicFn`. When a `createClientFn` or `createServerFn` accepts input, export its Zod schema and its inferred input type, then pass that schema to the function's validator. For example, export `getTripInputSchema` and `GetTripInput`. These are the single source of truth for the boundary and downstream query helpers.
2. Export `get<Entity>QueryOptions`, accepting the main function's inputs and returning the canonical `queryOptions`. Type its parameters from the exported inferred input type. Its `queryFn` must pass React Query's `signal` to the main implementation function.
3. Build query keys from a domain anchor and collection discriminator, followed by direct query inputs: for example, `[ANCHOR_KEYS.TRIP, COLLECTION.ONE, tripId]`. `ANCHOR_KEYS` contains only domain-prefix keys; it must not become a constant for every key fragment. Use shared collection constants such as `COLLECTION.ONE` and `COLLECTION.MANY` to preserve intentional prefix invalidation.
4. Export `load<Entity>(queryClient, ...args)`, which takes `QueryClient` first, accepts the same strongly typed inputs as `get<Entity>QueryOptions`, and calls `ensureQueryData(get<Entity>QueryOptions(...args))`.
5. Export `use<Entity>` as the main consumer hook. Prefer `useSuspenseQuery(get<Entity>QueryOptions(...args))` unless the caller needs non-suspense behaviour.
6. Export `useInvalidate<Entity>`, returning a helper that accepts the same entity inputs and invalidates the matching query via the canonical query-options function.

### Selector-pattern opt-in

Do not add selector support to query hooks by default. Before implementing a selector pattern for any query API, explicitly ask the user whether they want it and wait for confirmation; selectors are an intentional API choice, not a default convention.

When approved, an optional selector callback may be accepted by the hook. Use a default generic so `use<Entity>()` returns the original query data and `use<Entity>((data) => ...)` returns the selector result. For hooks that guarantee an entity exists, validate that guarantee before invoking the selector so its parameter is non-null.

See `src/features/auth/api/get-current-user.ts` for the reference implementation.

`src/features/auth/api/get-current-user.ts` is a special case and exposes extra auth-specific helpers. Do not treat its full exported surface as the default entity-query template; use the structure above instead.

## Data-write convention

Use the same function-boundary and input conventions for writes. Export the main `createServerFn`, `createClientFn`, or `createIsomorphicFn` implementation. When it accepts input, export its Zod schema and inferred input type, and use the schema as its validator. Consumers and mutation hooks should take their arguments from that inferred type.

Writes do not expose `get<Entity>QueryOptions`, `load<Entity>`, or `useInvalidate<Entity>` helpers. Those are read-query concerns.

## Server-function boundaries

- Treat `createServerFn` as a client/server RPC boundary, not as a reusable server implementation. Do not call one `createServerFn` from another server function or from a server route. Extract plain server-side implementation functions and have each boundary call those instead. Nested server-function calls failed after the production build when trip title generation and the itinerary API route tried to resolve extracted server-function IDs, even though the same paths worked locally.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the current product roadmap and delivery priorities.
