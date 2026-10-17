#!/usr/bin/env bash
set -euo pipefail

BASE="${TC_PUBLIC_ORIGIN:-https://tendercells.com}"

echo "== Public pages =="
for path in "/" "/assistants" "/privacy" "/terms" "/.well-known/oauth-authorization-server" "/.well-known/oauth-protected-resource"; do
  printf "%-45s" "$BASE$path"
  code="$(curl -L -sS -o /dev/null -w "%{http_code}" "$BASE$path")"
  echo " $code"
  case "$code" in
    2*|3*) ;;
    *) echo "FAILED: $BASE$path"; exit 1 ;;
  esac
done

echo "== MCP demo initialize =="
body='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"store-preflight","version":"1"}}}'
code="$(curl -sS -o /tmp/tc_mcp_demo.out -w "%{http_code}" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -X POST "$BASE/mcp/demo" \
  --data "$body")"
echo "$BASE/mcp/demo -> $code"
case "$code" in
  2*) ;;
  *) cat /tmp/tc_mcp_demo.out || true; exit 1 ;;
esac

echo "== Local repo tests =="
pushd applications/tendercells_ui/test_output/express-api >/dev/null
npm test
npm run build
popd >/dev/null

pushd applications/tendercells_ui/test_output/tendercells-ui >/dev/null
npx vitest run src/__tests__/builder
npm run build
popd >/dev/null

echo "Store preflight passed. Manual OAuth + ChatGPT + Claude tests are still required."
