#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

REGION="ap-south-2"
CLUSTER="reprojects-prod"

VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query "Vpcs[0].VpcId" --output text --region "$REGION")
SUBNET_IDS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" --query "Subnets[*].SubnetId" --output text --region "$REGION" | tr '\t' ' ')
SUBNET_CSV=$(echo "$SUBNET_IDS" | tr ' ' ',')
ECS_SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=reprojects-ecs-sg Name=vpc-id,Values="$VPC_ID" --query "SecurityGroups[0].GroupId" --output text --region "$REGION")

echo "1. Creating Internal ALB (0 public IPs) & Target Groups..."
CORE_TG=$(aws elbv2 create-target-group --name reprojects-core-tg --protocol HTTP --port 3000 --vpc-id "$VPC_ID" --target-type ip --matcher HttpCode=200-499 --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION")
ADMIN_TG=$(aws elbv2 create-target-group --name reprojects-admin-tg --protocol HTTP --port 3002 --vpc-id "$VPC_ID" --target-type ip --matcher HttpCode=200-499 --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION")

ALB_ARN=$(aws elbv2 create-load-balancer --name reprojects-internal-alb --subnets $SUBNET_IDS --security-groups "$ECS_SG" --scheme internal --type application --query "LoadBalancers[0].LoadBalancerArn" --output text --region "$REGION")
CORE_LISTENER=$(aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn="$CORE_TG" --query "Listeners[0].ListenerArn" --output text --region "$REGION")
ADMIN_LISTENER=$(aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 3002 --default-actions Type=forward,TargetGroupArn="$ADMIN_TG" --query "Listeners[0].ListenerArn" --output text --region "$REGION")

echo "2. Creating API Gateway VPC Link v2 (takes ~2 mins)..."
VPC_LINK_ID=$(aws apigatewayv2 create-vpc-link --name reprojects-vpclink --subnet-ids $SUBNET_IDS --security-group-ids "$ECS_SG" --query "VpcLinkId" --output text --region "$REGION")
for i in {1..30}; do
  STATUS=$(aws apigatewayv2 get-vpc-link --vpc-link-id "$VPC_LINK_ID" --query "VpcLinkStatus" --output text --region "$REGION")
  [[ "$STATUS" == "AVAILABLE" ]] && break
  sleep 5
done
EOFcat << 'EOF' > infra/scripts/05-setup-apigw-alb.sh
#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

REGION="ap-south-2"
CLUSTER="reprojects-prod"

VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query "Vpcs[0].VpcId" --output text --region "$REGION")
SUBNET_IDS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" --query "Subnets[*].SubnetId" --output text --region "$REGION" | tr '\t' ' ')
SUBNET_CSV=$(echo "$SUBNET_IDS" | tr ' ' ',')
ECS_SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=reprojects-ecs-sg Name=vpc-id,Values="$VPC_ID" --query "SecurityGroups[0].GroupId" --output text --region "$REGION")

echo "1. Creating Internal ALB (0 public IPs) & Target Groups..."
CORE_TG=$(aws elbv2 create-target-group --name reprojects-core-tg --protocol HTTP --port 3000 --vpc-id "$VPC_ID" --target-type ip --matcher HttpCode=200-499 --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION")
ADMIN_TG=$(aws elbv2 create-target-group --name reprojects-admin-tg --protocol HTTP --port 3002 --vpc-id "$VPC_ID" --target-type ip --matcher HttpCode=200-499 --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION")

ALB_ARN=$(aws elbv2 create-load-balancer --name reprojects-internal-alb --subnets $SUBNET_IDS --security-groups "$ECS_SG" --scheme internal --type application --query "LoadBalancers[0].LoadBalancerArn" --output text --region "$REGION")
CORE_LISTENER=$(aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn="$CORE_TG" --query "Listeners[0].ListenerArn" --output text --region "$REGION")
ADMIN_LISTENER=$(aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 3002 --default-actions Type=forward,TargetGroupArn="$ADMIN_TG" --query "Listeners[0].ListenerArn" --output text --region "$REGION")

echo "2. Creating API Gateway VPC Link v2 (takes ~2 mins)..."
VPC_LINK_ID=$(aws apigatewayv2 create-vpc-link --name reprojects-vpclink --subnet-ids $SUBNET_IDS --security-group-ids "$ECS_SG" --query "VpcLinkId" --output text --region "$REGION")
for i in {1..30}; do
  STATUS=$(aws apigatewayv2 get-vpc-link --vpc-link-id "$VPC_LINK_ID" --query "VpcLinkStatus" --output text --region "$REGION")
  [[ "$STATUS" == "AVAILABLE" ]] && break
  sleep 5
done

echo "3. Creating HTTP API Gateway & Private ALB Integrations..."
API_ID=$(aws apigatewayv2 create-api --name reprojects-gateway --protocol-type HTTP --query "ApiId" --output text --region "$REGION")

CORE_INT=$(aws apigatewayv2 create-integration --api-id "$API_ID" --integration-type HTTP_PROXY --integration-method ANY --integration-uri "$CORE_LISTENER" --connection-type VPC_LINK --connection-id "$VPC_LINK_ID" --payload-format-version 1.0 --query "IntegrationId" --output text --region "$REGION")
ADMIN_INT=$(aws apigatewayv2 create-integration --api-id "$API_ID" --integration-type HTTP_PROXY --integration-method ANY --integration-uri "$ADMIN_LISTENER" --connection-type VPC_LINK --connection-id "$VPC_LINK_ID" --payload-format-version 1.0 --query "IntegrationId" --output text --region "$REGION")

aws apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /admin/{proxy+}" --target "integrations/$ADMIN_INT" --region "$REGION" > /dev/null
aws apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /{proxy+}" --target "integrations/$CORE_INT" --region "$REGION" > /dev/null
aws apigatewayv2 create-stage --api-id "$API_ID" --stage-name '$default' --auto-deploy --region "$REGION" > /dev/null

echo "4. Starting Fargate Services behind Internal ALB..."
aws ecs register-task-definition --cli-input-json file://infra/ecs/core-services-task.json --region "$REGION" > /dev/null
aws ecs register-task-definition --cli-input-json file://infra/ecs/admin-services-task.json --region "$REGION" > /dev/null

NET_CFG="awsvpcConfiguration={subnets=[$SUBNET_CSV],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}"
aws ecs create-service --cluster "$CLUSTER" --service-name core-services --task-definition reprojects-core-services --desired-count 1 --launch-type FARGATE --network-configuration "$NET_CFG" --load-balancers "targetGroupArn=$CORE_TG,containerName=core-services,containerPort=3000" --region "$REGION" > /dev/null
aws ecs create-service --cluster "$CLUSTER" --service-name admin-services --task-definition reprojects-admin-services --desired-count 1 --launch-type FARGATE --network-configuration "$NET_CFG" --load-balancers "targetGroupArn=$ADMIN_TG,containerName=admin-services,containerPort=3002" --region "$REGION" > /dev/null

echo "=========================================="
echo "HTTPS API Gateway URL : https://${API_ID}.execute-api.${REGION}.amazonaws.com"
echo "Core API Route        : https://${API_ID}.execute-api.${REGION}.amazonaws.com/health"
echo "Admin API Route       : https://${API_ID}.execute-api.${REGION}.amazonaws.com/admin/"
echo "=========================================="
