import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { anonymous } from 'better-auth/plugins';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { env } from 'cloudflare:workers';

import { db } from '#/db/db.server';
import { schemas } from '#/db/relations';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, { provider: 'sqlite', schema: schemas }),
  plugins: [anonymous(), tanstackStartCookies()],
});
