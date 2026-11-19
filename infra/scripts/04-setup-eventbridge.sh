#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

REGION="ap-south-2"
CLUSTER_ARN="arn:aws:ecs:${REGION}:551897326491:cluster/reprojects-prod"

echo "1. Creating IAM role for EventBridge -> ECS RunTask..."
aws iam create-role --role-name EventBridgeECSRole --assume-role-policy-document file://infra/policies/eventbridge-trust-policy.json 2>/dev/null || true
aws iam put-role-policy --role-name EventBridgeECSRole --policy-name EventBridgeRunECSTask --policy-document file://infra/policies/eventbridge-ecs-policy.json

echo "2. Ensuring ECS Cluster & PDF Task Definition exist..."
aws ecs create-cluster --cluster-name reprojects-prod --region "$REGION" > /dev/null
TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file://infra/ecs/pdf-renderer-task.json --query "taskDefinition.taskDefinitionArn" --output text --region "$REGION")

echo "3. Creating Custom EventBridge Bus & Rule..."
aws events create-event-bus --name reprojects-events --region "$REGION" 2>/dev/null || true
aws events put-rule \
  --name trigger-pdf-renderer \
  --event-bus-name reprojects-events \
  --event-pattern '{"source":["reprojects.core"],"detail-type":["GeneratePdfRequested"]}' \
  --state ENABLED \
  --region "$REGION" > /dev/null

VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query "Vpcs[0].VpcId" --output text --region "$REGION")
SUBNET_JSON=$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" --query "Subnets[*].SubnetId" --output json --region "$REGION" | tr -d '\n\r ')
ECS_SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=reprojects-ecs-sg Name=vpc-id,Values="$VPC_ID" --query "SecurityGroups[0].GroupId" --output text --region "$REGION")

cat << JSON > infra/policies/eventbridge-pdf-target.json
[
  {
    "Id": "pdf-renderer-fargate-target",
    "Arn": "${CLUSTER_ARN}",
    "RoleArn": "arn:aws:iam::551897326491:role/EventBridgeECSRole",
    "EcsParameters": {
      "TaskDefinitionArn": "${TASK_DEF_ARN}",
      "TaskCount": 1,
      "LaunchType": "FARGATE",
      "NetworkConfiguration": {
        "awsvpcConfiguration": {
          "Subnets": ${SUBNET_JSON},
          "SecurityGroups": ["${ECS_SG}"],
          "AssignPublicIp": "ENABLED"
        }
      }
    }
  }
]
JSON

aws events put-targets --rule trigger-pdf-renderer --event-bus-name reprojects-events --targets file://infra/policies/eventbridge-pdf-target.json --region "$REGION" > /dev/null
echo "EventBridge bus 'reprojects-events' ready ($0/mo when idle)."
