# ActivePieces (Recruitment + Customer Support)

Master runs these 17 workflows against the **local webhook bridge** on port **8091** (no UI signup).

```bash
docker compose up -d ap-bridge
# or: npm run workers:ap
```

- Health: http://localhost:8091/health  
- Flows: http://localhost:8091/flows  

`.env`:

```
ACTIVEPIECES_BASE_URL=http://localhost:8091
ACTIVEPIECES_API_KEY=local
```

Optional: `docker compose up -d postgres-ap redis-ap activepieces` for the official UI at http://localhost:8081. Rebuild the same flows there later and point `ACTIVEPIECES_BASE_URL` at 8081.
