#!/usr/bin/env bash
set -euo pipefail
npm test
if [ -f .deploy.env ]; then
  # shellcheck disable=SC1091
  source .deploy.env
fi
if [ -n "${SITE_URL:-}" ]; then
  VITE_SITE_URL="$SITE_URL" npx cf deploy
else
  npx cf deploy
fi
