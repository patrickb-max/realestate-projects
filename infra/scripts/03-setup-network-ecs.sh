#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

REGION="ap-south-2"
CLUSTER="reprojects-prod"

echo "1. Fetching Default VPC and Subnets in $REGION..."
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query "Vpcs[0].VpcId" --output text --region "$REGION")
SUBNET_IDS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" --query "Subnets[*].SubnetId" --output text --region "$REGION" | tr '\t' ' ')
SUBNET_CSV=$(echo "$SUBNET_IDS" | tr ' ' ',')

echo "2. Ensuring Security Groups..."
ALB_SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=reprojects-alb-sg Name=vpc-id,Values="$VPC_ID" --query "SecurityGroups[0].GroupId" --output text --region "$REGION")
[[ "$ALB_SG" == "None" || -z "$ALB_SG" ]] && ALB_SG=$(aws ec2 create-security-group --group-name reprojects-alb-sg --description "ALB public ingress" --vpc-id "$VPC_ID" --query "GroupId" --output text --region "$REGION")
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION" 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --protocol tcp --port 3002 --cidr 0.0.0.0/0 --region "$REGION" 2>/dev/null || true

ECS_SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=reprojects-ecs-sg Name=vpc-id,Values="$VPC_ID" --query "SecurityGroups[0].GroupId" --output text --region "$REGION")
[[ "$ECS_SG" == "None" || -z "$ECS_SG" ]] && ECS_SG=$(aws ec2 create-security-group --group-name reprojects-ecs-sg --description "Fargate tasks SG" --vpc-id "$VPC_ID" --query "GroupId" --output text --region "$REGION")
aws ec2 authorize-security-group-ingress --group-id "$ECS_SG" --protocol tcp --port 3000 --source-group "$ALB_SG" --region "$REGION" 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id "$ECS_SG" --protocol tcp --port 3002 --source-group "$ALB_SG" --region "$REGION" 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id "$ECS_SG" --protocol -1 --source-group "$ECS_SG" --region "$REGION" 2>/dev/null || true

echo "3. Ensuring Target Groups & ALB..."
CORE_TG=$(aws elbv2 describe-target-groups --names reprojects-core-tg --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION" 2>/dev/null || \
  aws elbv2 create-target-group --name reprojects-core-tg --protocol HTTP --port 3000 --vpc-id "$VPC_ID" --target-type ip --matcher HttpCode=200-499 --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION")
ADMIN_TG=$(aws elbv2 describe-target-groups --names reprojects-admin-tg --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION" 2>/dev/null || \
  aws elbv2 create-target-group --name reprojects-admin-tg --protocol HTTP --port 3002 --vpc-id "$VPC_ID" --target-type ip --matcher HttpCode=200-499 --query "TargetGroups[0].TargetGroupArn" --output text --region "$REGION")

ALB_ARN=$(aws elbv2 describe-load-balancers --names reprojects-alb --query "LoadBalancers[0].LoadBalancerArn" --output text --region "$REGION" 2>/dev/null || \
  aws elbv2 create-load-balancer --name reprojects-alb --subnets $SUBNET_IDS --security-groups "$ALB_SG" --scheme internet-facing --type application --query "LoadBalancers[0].LoadBalancerArn" --output text --region "$REGION")
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query "LoadBalancers[0].DNSName" --output text --region "$REGION")

PORTS=$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --query "Listeners[*].Port" --output text --region "$REGION")
echo "$PORTS" | grep -qw "80" || aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn="$CORE_TG" --region "$REGION" > /dev/null
echo "$PORTS" | grep -qw "3002" || aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 3002 --default-actions Type=forward,TargetGroupArn="$ADMIN_TG" --region "$REGION" > /dev/null

echo "4. Ensuring ECS Cluster is ACTIVE..."
C_STATUS=$(aws ecs describe-clusters --clusters "$CLUSTER" --query "clusters[0].status" --output text --region "$REGION" 2>/dev/null || echo "NONE")
[[ "$C_STATUS" != "ACTIVE" && "$C_STATUS" != "PROVISIONING" ]] && aws ecs create-cluster --cluster-name "$CLUSTER" --service-connect-defaults namespace=reprojects.local --region "$REGION" > /dev/null
for i in {1..15}; do
  [[ "$(aws ecs describe-clusters --clusters "$CLUSTER" --query "clusters[0].status" --output text --region "$REGION")" == "ACTIVE" ]] && break
  sleep 3
done

echo "5. Registering Task Definitions & Deploying Services..."
aws ecs register-task-definition --cli-input-json file://infra/ecs/core-services-task.json --region "$REGION" > /dev/null
aws ecs register-task-definition --cli-input-json file://infra/ecs/admin-services-task.json --region "$REGION" > /dev/null
aws ecs register-task-definition --cli-input-json file://infra/ecs/pdf-renderer-task.json --region "$REGION" > /dev/null

NET_CFG="awsvpcConfiguration={subnets=[$SUBNET_CSV],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}"

aws ecs create-service --cluster "$CLUSTER" --service-name pdf-renderer --task-definition reprojects-pdf-renderer --desired-count 1 --launch-type FARGATE --network-configuration "$NET_CFG" --service-connect-configuration "enabled=true,namespace=reprojects.local,services=[{portName=http,discoveryName=pdf-renderer,clientAliases=[{port=3004,dnsName=pdf-renderer}]}]" --region "$REGION" > /dev/null 2>&1 || aws ecs update-service --cluster "$CLUSTER" --service pdf-renderer --force-new-deployment --region "$REGION" > /dev/null
aws ecs create-service --cluster "$CLUSTER" --service-name core-services --task-definition reprojects-core-services --desired-count 1 --launch-type FARGATE --network-configuration "$NET_CFG" --load-balancers "targetGroupArn=$CORE_TG,containerName=core-services,containerPort=3000" --service-connect-configuration "enabled=true,namespace=reprojects.local" --region "$REGION" > /dev/null 2>&1 || aws ecs update-service --cluster "$CLUSTER" --service core-services --force-new-deployment --region "$REGION" > /dev/null
aws ecs create-service --cluster "$CLUSTER" --service-name admin-services --task-definition reprojects-admin-services --desired-count 1 --launch-type FARGATE --network-configuration "$NET_CFG" --load-balancers "targetGroupArn=$ADMIN_TG,containerName=admin-services,containerPort=3002" --service-connect-configuration "enabled=true,namespace=reprojects.local" --region "$REGION" > /dev/null 2>&1 || aws ecs update-service --cluster "$CLUSTER" --service admin-services --force-new-deployment --region "$REGION" > /dev/null

echo "=========================================="
echo "Core Services URL  : http://${ALB_DNS}"
echo "Admin Services URL : http://${ALB_DNS}:3002"
echo "PDF Renderer DNS   : http://pdf-renderer:3004 (internal only)"
echo "=========================================="
