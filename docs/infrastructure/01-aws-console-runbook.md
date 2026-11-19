# AWS Infrastructure Runbook (`ap-south-2` / Hyderabad)

## Traffic & Event Flow
- **Synchronous REST:** `Client -> HTTP API Gateway (reprojects-gateway) -> VPC Link -> Internal ALB (reprojects-internal-alb) -> ECS Fargate (core-services:3000 | admin-services:3002) -> MongoDB Atlas`
- **Asynchronous PDF:** `core-services -> EventBridge Bus (reprojects-events, DetailType: GeneratePdfRequested) -> ECS RunTask (reprojects-pdf-renderer) -> Exit 0`

## Stage 1: Security Group (`reprojects-ecs-sg`)
- **Console:** EC2 > Security Groups > Create security group
- **Config:** Name `reprojects-ecs-sg`, VPC: Default VPC
- **Inbound Rules (Edit after creation):** Custom TCP ports `80`, `3000`, `3002` -> Source: `reprojects-ecs-sg` (self)
- **Outbound Rules:** All traffic -> `0.0.0.0/0`
- **Gate Check:** Confirm 3 self-referencing inbound rules exist and no `0.0.0.0/0` inbound rules are open.

## Stage 2: Target Groups & Internal ALB
- **Target Group 1:** IP addresses | `reprojects-core-tg` | `HTTP:3000` | Health check: `/health`
- **Target Group 2:** IP addresses | `reprojects-admin-tg` | `HTTP:3002` | Health check: `/`
- **ALB:** `reprojects-internal-alb` | Scheme: `Internal` | All 3 AZs (`ap-south-2a/b/c`) | SG: `reprojects-ecs-sg`
- **Listeners:** `HTTP:80 -> reprojects-core-tg`, `HTTP:3002 -> reprojects-admin-tg`
- **Gate Check:** ALB State transitions from `Provisioning` to `Active`.

## Stage 3: ECS Cluster & Fargate Services
- **Cluster:** `reprojects-prod` | Infrastructure: `AWS Fargate (serverless)`
- **Service 1:** `core-services` | Task: `reprojects-core-services` | Desired: `1` | Public IP: `ON` | ALB Listener `80 -> reprojects-core-tg`
- **Service 2:** `admin-services` | Task: `reprojects-admin-services` | Desired: `1` | Public IP: `ON` | ALB Listener `3002 -> reprojects-admin-tg`
- **Gate Check:** Both tasks reach `RUNNING` and both Target Groups report `Healthy`.

## Stage 4: VPC Link & HTTP API Gateway
- **VPC Link:** HTTP API type | `reprojects-vpclink` | All 3 AZs | SG: `reprojects-ecs-sg` (Wait until `Available`)
- **API:** HTTP API `reprojects-gateway`
- **Routes & Integrations:**
  - `ANY /{proxy+}` -> Private resource -> `reprojects-internal-alb` (`HTTP 80`) via `reprojects-vpclink`
  - `ANY /admin/{proxy+}` -> Private resource -> `reprojects-internal-alb` (`HTTP 3002`) via `reprojects-vpclink`
- **Gate Check:** `curl -s https://<api-id>.execute-api.ap-south-2.amazonaws.com/health` returns `{"status":"ok","dbConnected":true}`.

## Stage 5: EventBridge On-Demand PDF Pipeline
- **Event Bus:** `reprojects-events`
- **Rule:** `trigger-pdf-renderer` | Pattern: `{"source":["reprojects.core"],"detail-type":["GeneratePdfRequested"]}`
- **Target:** ECS Task `reprojects-pdf-renderer` in `reprojects-prod` | FARGATE | All 3 AZs | SG `reprojects-ecs-sg` | Public IP `ENABLED` | Role `EventBridgeECSRole`
- **Input Transformer:** Map `{"detail":"$.detail"}` to `{"containerOverrides":[{"name":"pdf-renderer","environment":[{"name":"EVENT_PAYLOAD","value":<detail>}]}]}`
- **Gate Check:** Send test event in console; verify one-off `pdf-renderer` task boots, logs payload, and exits `0`.

## Reverse-Dependency Teardown ($0.00/hr Reset)
1. ECS Services (`core-services`, `admin-services`) -> Set desired count `0` and delete services.
2. API Gateway (`reprojects-gateway`) -> Delete API, then delete VPC Link (`reprojects-vpclink`).
3. EC2 Load Balancer (`reprojects-internal-alb`) -> Delete ALB, then delete Target Groups (`reprojects-core-tg`, `reprojects-admin-tg`).
4. EventBridge -> Delete rule `trigger-pdf-renderer`, then delete bus `reprojects-events`.
5. Security Group -> Delete `reprojects-ecs-sg` (only succeeds after ENIs from steps 1–3 detach).
