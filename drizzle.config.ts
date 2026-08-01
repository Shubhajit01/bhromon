import { defineConfig } from 'drizzle-kit';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const D1_DIR = join(
  process.cwd(),
  '.wrangler',
  'state',
  'v3',
  'd1',
  'miniflare-D1DatabaseObject',
);

const localD1Url = (() => {
  const dbFile = readdirSync(D1_DIR)
    .filter((name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite')
    .map((name) => ({ name, mtime: statSync(join(D1_DIR, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!dbFile) {
    throw new Error(
      'No local D1 database found. Run `pnpm db:migrate:local` or `pnpm dev` first.',
    );
  }

  return join(D1_DIR, dbFile.name);
})();

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
  dbCredentials: { url: localD1Url },
});
