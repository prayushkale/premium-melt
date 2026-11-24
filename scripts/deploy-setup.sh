#!/usr/bin/env bash
set -euo pipefail
test ! -f .deploy.env || { echo "Already set up"; exit 1; }
REGION=ap-south-1
BUCKET="premium-melt-$(openssl rand -hex 4)"
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
aws s3api create-bucket --bucket "$BUCKET" --region $REGION \
  --create-bucket-configuration LocationConstraint=$REGION
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
OAC=$(aws cloudfront create-origin-access-control --origin-access-control-config \
  "Name=$BUCKET,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
  --query OriginAccessControl.Id --output text)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cat > "$TMP/dist.json" <<JSON
{
  "CallerReference": "$BUCKET", "Comment": "premium-melt", "Enabled": true,
  "DefaultRootObject": "index.html", "PriceClass": "PriceClass_200",
  "Origins": { "Quantity": 1, "Items": [{
    "Id": "s3", "DomainName": "$BUCKET.s3.$REGION.amazonaws.com",
    "OriginAccessControlId": "$OAC", "S3OriginConfig": { "OriginAccessIdentity": "" } }] },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3", "ViewerProtocolPolicy": "redirect-to-https", "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6" }
}
JSON
read -r DIST_ID DOMAIN <<< "$(aws cloudfront create-distribution --distribution-config "file://$TMP/dist.json" \
  --query 'Distribution.[Id,DomainName]' --output text)"
cat > "$TMP/policy.json" <<JSON
{ "Version": "2012-10-17", "Statement": [{
  "Effect": "Allow", "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject", "Resource": "arn:aws:s3:::$BUCKET/*",
  "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT:distribution/$DIST_ID" } } }] }
JSON
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "file://$TMP/policy.json"
printf 'BUCKET=%s\nDIST_ID=%s\nSITE_URL=https://%s\n' "$BUCKET" "$DIST_ID" "$DOMAIN" > .deploy.env
aws cloudfront wait distribution-deployed --id "$DIST_ID"
cat .deploy.env
