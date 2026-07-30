#!/usr/bin/env bash
set -euo pipefail

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git diff --check
fi

if [[ -f package.json ]]; then
  pnpm install --frozen-lockfile
  pnpm lint
  pnpm typecheck
  pnpm test
else
  echo "No application scaffold yet. Baseline repository check passed."
fi
