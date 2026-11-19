#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1
REGION="ap-south-2"

for SVC in core-services admin-services pdf-renderer; do
  aws ecs update-service --cluster reprojects-prod --service $SVC --desired-count 0 --region $REGION > /dev/null 2>&1 || true
  aws ecs delete-service --cluster reprojects-prod --service $SVC --force --region $REGION > /dev/null 2>&1 || true
done

for API_ID in $(aws apigatewayv2 get-apis --query "Items[?Name=='reprojects-gateway'].ApiId" --output text --region $REGION); do
  aws apigatewayv2 delete-api --api-id "$API_ID" --region $REGION
done
for LINK_ID in $(aws apigatewayv2 get-vpc-links --query "Items[?Name=='reprojects-vpclink'].VpcLinkId" --output text --region $REGION); do
  aws apigatewayv2 delete-vpc-link --vpc-link-id "$LINK_ID" --region $REGION
done

ALB_ARN=$(aws elbv2 describe-load-balancers --names reprojects-internal-alb --query "LoadBalancers[0].LoadBalancerArn" --output text --region $REGION 2>/dev/null || echo "")
if [[ -n "$ALB_ARN" && "$ALB_ARN" != "None" ]]; then
  aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" --region $REGION
  sleep 15
fi

for TG in reprojects-core-tg reprojects-admin-tg; do
  TG_ARN=$(aws elbv2 describe-target-groups --names $TG --query "TargetGroups[0].TargetGroupArn" --output text --region $REGION 2>/dev/null || echo "")
  [[ -n "$TG_ARN" && "$TG_ARN" != "None" ]] && aws elbv2 delete-target-group --target-group-arn "$TG_ARN" --region $REGION
done

echo "All hourly compute and load balancer resources deleted ($0/hr)."
