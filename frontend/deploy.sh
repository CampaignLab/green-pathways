#!/bin/bash

# You need an .env.production.local file which has
# the values below plus AWS_REGION and AWS_PROFILE
export $(grep -v '^#' .env.production.local | xargs)

npm run build
aws s3 sync dist/ s3://$AWS_BUCKET
aws cloudfront create-invalidation --distribution-id $AWS_DISTRIBUTION_ID --paths "/*"
