#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

REGION="ap-south-2"

echo "Creating CloudWatch Log Groups in $REGION..."
for SERVICE in core-services admin-services pdf-renderer; do
  aws logs create-log-group --log-group-name "/ecs/reprojects-${SERVICE}" --region "$REGION" 2>/dev/null || true
done

echo "Creating ecsTaskExecutionRole..."
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://infra/policies/ecs-trust-policy.json 2>/dev/null || true

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SSMReadSecretsPolicy \
  --policy-document file://infra/policies/ecs-ssm-policy.json

echo "IAM role and CloudWatch log groups ready."
