#!/usr/bin/env bash
set -euo pipefail

pushd applications/tendercells_ui/test_output/express-api >/dev/null
npm run mcp:builder-gen
npm test
npm run build
popd >/dev/null

pushd applications/tendercells_ui/test_output/tendercells-ui >/dev/null
npx vitest run src/__tests__/builder
npm run build
popd >/dev/null

echo "B01 verification passed."
