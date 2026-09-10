# Trigger.dev (Meeting Summary + Proposal Generator)

Master runs these 16 tasks against the **local task bridge** on port **8092**.

```bash
docker compose up -d trigger-bridge
# or: npm run workers:trigger
```

- Health: http://localhost:8092/health  
- Tasks: http://localhost:8092/tasks  

`.env`:

```
TRIGGER_API_URL=http://localhost:8092
TRIGGER_SECRET_KEY=local
TRIGGER_PROJECT_REF=master
OPENAI_API_KEY=          # optional — live summary/draft if set
```

To use Trigger.dev Cloud later: create a project at https://cloud.trigger.dev, deploy tasks, and replace `TRIGGER_*` env vars.
