#!/usr/bin/env bash
set -euo pipefail
source .deploy.env
npm test
VITE_SITE_URL="$SITE_URL" npm run build
aws s3 sync dist "s3://$BUCKET" --exclude "assets/*" --cache-control "no-cache"
aws s3 sync dist/assets "s3://$BUCKET/assets" --cache-control "public,max-age=31536000,immutable"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/" "/index.html" "/og.png"
echo "$SITE_URL"
