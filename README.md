# Bhromon

Bhromon is an AI-powered workspace for planning self-guided trips. A traveller starts with a free-form idea, works through the details with a conversational planning agent, and saves a structured day-by-day itinerary for later review.

The product is designed for independent travellers who care about their own interests, pace, constraints, and sense of discovery. Its interface is intentionally calm, personal, and focused on the next planning decision rather than on bookings or travel inventory.

> Bhromon is under active development. The core prompt-to-itinerary flow is available; maps, confirmed-trip revisions, preference memory, and destination guidance are planned next.

## What works today

- Start a trip from a natural-language prompt.
- Continue planning in a persistent, trip-specific AI conversation.
- Resolve relative travel dates using the traveller's local time zone.
- Check short-range destination forecasts through Open-Meteo when relevant.
- Review and explicitly approve a structured itinerary before it is saved.
- Browse saved trips and filter them by draft or confirmed status.
- View a saved itinerary as a day-by-day schedule with highlights, times, and locations.
- Begin immediately with an anonymous account; Better Auth also provides the email/password backend for future account flows.

Bookings, payments, sharing, collaboration, live availability, and live pricing are intentionally outside the current product scope.

## How it works

1. The traveller describes the trip they have in mind.
2. Bhromon creates an anonymous session when needed, generates a short trip title, and opens a dedicated planning workspace.
3. A stateful Cloudflare Agent asks focused follow-up questions about dates, destination, companions, pace, budget, interests, and constraints.
4. When the plan is complete, the agent produces a Zod-validated itinerary and asks for explicit approval before persisting it.
5. The saved draft appears on the trip page as a structured, day-by-day plan.

## Tech stack

| Area                   | Technology                                                    |
| ---------------------- | ------------------------------------------------------------- |
| Application            | React 19, TypeScript, TanStack Start, TanStack Router         |
| Data fetching          | TanStack Query with server functions and route loaders        |
| UI                     | Tailwind CSS 4, shadcn, React Aria Components, Phosphor Icons |
| AI                     | AI SDK, Cloudflare AI Chat, Workers AI                        |
| Stateful chat          | Cloudflare Agents SDK and Durable Objects                     |
| Database               | Cloudflare D1 (SQLite), Drizzle ORM, Drizzle Kit              |
| Authentication         | Better Auth with anonymous and email/password support         |
| Validation             | Zod for server boundaries, tool input, and itinerary output   |
| External data          | Open-Meteo geocoding and weather APIs                         |
| Runtime and deployment | Vite, Cloudflare Workers, Wrangler                            |
| Quality                | ESLint, Prettier, strict TypeScript, React Compiler           |

The planning agent currently uses Cloudflare-hosted GLM 4.7 Flash for conversation and Llama 3.1 8B Instruct Fast for trip-title generation.

## Architecture

Bhromon is a full-stack TanStack Start application deployed as a Cloudflare Worker.

- File-based routes in `src/routes` own screens, loaders, and HTTP endpoints.
- Feature modules in `src/features` group trip, chat, and authentication behaviour.
- TanStack server functions form the application boundary for authenticated reads and writes.
- Each trip chat is backed by a Durable Object, which keeps its messages and agent state together.
- D1 stores users, sessions, trips, and versioned itinerary revisions.
- Itineraries are stored as versioned JSON documents after schema validation.
- React Query supplies canonical cache keys, route preloading, and mutation invalidation.

The current data model supports `draft` and `confirmed` trips plus `draft`, `confirmed`, `superseded`, and `discarded` itinerary revisions. Only draft itinerary creation is exposed in the UI today.

## Getting started

### Prerequisites

- Node.js with Corepack enabled
- pnpm
- A Cloudflare account with Workers AI access for AI-backed flows and deployment

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure local environment variables

Copy the committed template and add a strong, private authentication secret:

```bash
cp .env.example .env
```

```dotenv
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3000
```

Never commit `.env` or secret values. `.env.example` should contain names and safe placeholders only.

### 3. Create the local database

Apply the checked-in D1 migrations:

```bash
pnpm db:migrate:local
```

### 4. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

If an AI request cannot reach Workers AI locally, authenticate Wrangler with `pnpm exec wrangler login` and restart the development server.

## Available commands

| Command                  | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `pnpm dev`               | Start the Vite development server on port 3000        |
| `pnpm build`             | Create a production build                             |
| `pnpm preview`           | Build and preview the production output               |
| `pnpm lint`              | Run ESLint                                            |
| `pnpm check`             | Check formatting with Prettier                        |
| `pnpm format`            | Format files and apply ESLint fixes                   |
| `pnpm generate-routes`   | Regenerate the TanStack Router route tree             |
| `pnpm db:generate`       | Generate a Drizzle migration from schema changes      |
| `pnpm db:migrate:local`  | Apply D1 migrations to the local database             |
| `pnpm db:migrate:remote` | Apply D1 migrations to the configured remote database |
| `pnpm db:studio`         | Open Drizzle Studio for the local D1 database         |
| `pnpm auth:generate`     | Regenerate the Better Auth database schema            |
| `pnpm cf-typegen`        | Regenerate Cloudflare binding types                   |
| `pnpm deploy`            | Build and deploy the Worker with Wrangler             |

There is no automated test script configured yet. Before opening a change, run:

```bash
pnpm lint
pnpm check
pnpm build
```

## Database changes

The Drizzle schema lives in `src/db/schema.ts`, while generated migrations are committed under `migrations/`.

For a schema change:

```bash
pnpm db:generate
pnpm db:migrate:local
```

Review the generated SQL before applying it remotely. Drizzle Studio expects a local Wrangler D1 database to exist, so run the local migration or development server first.

## Deployment

The application is configured for Cloudflare Workers in `wrangler.jsonc`, with bindings for D1, Workers AI, and the `TripAgent` Durable Object.

Before the first deployment:

1. Create the production D1 database and replace the placeholder `database_id` in `wrangler.jsonc`.
2. Configure `BETTER_AUTH_URL` for the deployed origin.
3. Store `BETTER_AUTH_SECRET` as a Cloudflare secret rather than committing it.
4. Authenticate Wrangler and apply the remote migrations.

```bash
pnpm exec wrangler login
pnpm db:migrate:remote
pnpm deploy
```

Cloudflare observability and source-map uploads are enabled in the Worker configuration.

## Project structure

```text
src/
├── components/             Shared UI primitives
├── config/                 Query-key and collection constants
├── db/                     Drizzle schema, relations, and D1 client
├── features/
│   ├── auth/               Session queries and authentication UI
│   ├── trip/               Trip queries, mutations, schemas, and views
│   └── trip-chat/          Chat UI, Cloudflare Agent, prompts, and tools
├── routes/                 TanStack Router routes and API handlers
├── styles/                 Global styles, typography, and fonts
├── router.tsx              Router and React Query integration
└── server.ts               Worker entry point and agent request routing

migrations/                 Generated D1 migration history
public/                     Static public assets and response headers
```

## Roadmap

- Complete the trip lifecycle: confirm, revise, accept, and safely discard itinerary revisions.
- Add mapped travel legs and richer trip views, including estimated costs.
- Remember only traveller-approved preferences and apply them to future plans.
- Attach sourced cultural and legal guidance to destinations.
- Expand authentication from automatic anonymous sessions to user-facing account flows.
- Add automated unit and integration coverage for the core planning journey.

## Contributing

Read [AGENTS.md](AGENTS.md) before making changes. It contains the repository conventions, query and mutation patterns, current feature sequence, and UI guidance. New interface work should also follow [DESIGN.md](DESIGN.md) and the product principles in [PRODUCT.md](PRODUCT.md).

Use conventional commit messages where practical, keep changes scoped to the smallest useful vertical slice, and do not commit generated secrets or local Cloudflare state.
