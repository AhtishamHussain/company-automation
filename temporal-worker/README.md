# Temporal worker — 35 durable Master workflows

## Start Temporal

```bash
docker compose up -d postgres-temporal temporal temporal-ui
```

- Temporal gRPC: `localhost:7233`
- UI: http://localhost:8088

## Install & run

```bash
cd temporal-worker
npm install
npm run worker    # terminal 1 — polls task queue master-durable
npm run bridge    # terminal 2 — HTTP API on :8099
```

## HTTP bridge

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Worker bridge health |
| GET | `/workflows` | List 35 workflow types |
| POST | `/workflows/start` | Start one `{ workflowType, workflowId?, args? }` |
| POST | `/workflows/start-all-smoke` | Start all 35 (demo) |

Example:

```bash
curl -X POST http://localhost:8099/workflows/start -H "Content-Type: application/json" -d "{\"workflowType\":\"hrEmployeeOnboarding\",\"args\":[{\"employeeId\":\"e-1\"}]}"
```

## Master `.env`

```
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_UI_URL=http://localhost:8088
TEMPORAL_BRIDGE_URL=http://localhost:8099
```

## Categories (35)

HR 10 · Recruitment 5 · Finance 5 · CRM 5 · Support 5 · Ops 5
