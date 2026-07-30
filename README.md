# Bhromon

An AI-powered self-tour planning workspace. Describe a trip idea, refine it in conversation, and turn it into a visual itinerary you can confirm.

## MVP

- Create a trip from a free-form prompt.
- Refine its requirements and itinerary through an AI planning chat.
- View draft and confirmed trips, including day-by-day plans and mapped travel legs.
- Edit confirmed trips as safe draft revisions; accept or discard each revision.
- Apply explicit traveller preferences and show sourced cultural/legal travel guidance.

Bookings, sharing, collaboration, live availability, and live pricing are intentionally out of scope.

## Stack

- TanStack Start, Router, and Query
- Cloudflare Workers, AI Agents/Durable Objects, D1, Drizzle, and Workers AI
- Zod for API and AI-output validation
- Carto for map visualizations

## Development

Requirements: Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`.

### Checks

```bash
pnpm lint
pnpm check
pnpm build
```

Run the project startup check before beginning work:

```bash
./init.sh
```

## Deployment

The app is configured for Cloudflare Workers.

```bash
pnpm deploy
```

Authenticate first with `wrangler login`. Add Cloudflare bindings and secrets as their corresponding features are implemented; never commit secret values.

## Working Agreement

Read [AGENTS.md](AGENTS.md) before contributing. The current feature sequence and implementation evidence live in [feature_list.json](feature_list.json) and [progress.md](progress.md).
