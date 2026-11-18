#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

REGION="ap-south-2"
ENV_FILE=".env.docker"
KEYS=("MONGO_URI" "ADMIN_JWT_SECRET" "PDF_INTERNAL_SECRET")

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found in repository root."
  exit 1
fi

for KEY in "${KEYS[@]}"; do
  VALUE=$(grep -E "^${KEY}=" "$ENV_FILE" | head -n 1 | cut -d '=' -f 2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
  if [[ -z "$VALUE" ]]; then
    echo "Error: $KEY is empty or missing in$ENV_FILE"
    exit 1
  fi

  aws ssm put-parameter \
    --name "/reprojects/prod/${KEY}" \
    --type "SecureString" \
    --value "$VALUE" \
    --overwrite \
    --region "$REGION" > /dev/null

  echo "Synced /reprojects/prod/${KEY}"
done
