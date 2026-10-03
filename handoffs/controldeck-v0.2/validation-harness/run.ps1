$ErrorActionPreference = "Stop"
if (Test-Path dist) { Remove-Item -Recurse -Force dist }
tsc -p tsconfig.json
node dist/src/testRunner.js
node ../regression/regression-audit.mjs
