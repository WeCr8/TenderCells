#!/usr/bin/env bash
set -euo pipefail

echo "== git =="
git status --short
git rev-parse --abbrev-ref HEAD
git log -1 --oneline

echo "== MCP baseline =="
pushd applications/tendercells_ui/test_output/express-api >/dev/null
npm test
npm run build
popd >/dev/null

echo "== Builder baseline =="
pushd applications/tendercells_ui/test_output/tendercells-ui >/dev/null
npx vitest run src/__tests__/builder
npm run build
popd >/dev/null

echo "Preflight passed."
