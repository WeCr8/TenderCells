#!/usr/bin/env bash
set -euo pipefail
rm -rf dist
tsc -p tsconfig.json
node dist/src/testRunner.js
node ../regression/regression-audit.mjs
