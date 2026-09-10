# Master — Company Automation

Control plane for **100 company workflows** across **12 domains**, routed to five engines:

**n8n** · **Kestra** · **Temporal** · **ActivePieces** · **Trigger.dev**

Master does not replace those tools. It catalogs workflows, runs them from one app, and shows health. The visual node chart (boxes and arrows) is in **n8n**; Kestra and Temporal have their own UIs.

In-app setup: http://localhost:3000/setup  
Longer notes: [GUIDE.md](./GUIDE.md)

---

## Domains (100 workflows)

| Domain | Engine | Count |
|--------|--------|------:|
| HR | Temporal | 9 |
| Recruitment | ActivePieces bridge | 9 |
| Invoice | Kestra | 9 |
| CRM | n8n | 9 |
| Email | n8n | 8 |
| Slack | n8n | 8 |
| WhatsApp | n8n | 8 |
| Knowledge Base | Kestra | 8 |
| Document Parsing | Kestra | 8 |
| Meeting Summary | Trigger.dev bridge | 8 |
| Customer Support | ActivePieces bridge | 8 |
| Proposal Generator | Trigger.dev bridge | 8 |
| **Total** | | **100** |

---

## Quick start

```powershell
cd company-automation
Copy-Item .env.example .env
npm install
docker compose up -d n8n postgres-kestra kestra postgres-temporal temporal temporal-ui
npm run seed:kestra
npm run seed:n8n
npm run workers:ap
npm run workers:trigger
```

In two extra terminals:

```powershell
cd temporal-worker
npm install
npm run worker
```

```powershell
cd temporal-worker
npm run bridge
```

Then:

```powershell
npm run dev
```

| What | URL |
|------|-----|
| Master landing | http://localhost:3000 |
| Operations console | http://localhost:3000/app |
| Workflow catalog | http://localhost:3000/workflows |
| Engine health | http://localhost:3000/engines |
| n8n (visual workflows) | http://localhost:5678 |
| Kestra | http://localhost:8080 (admin@master.local / MasterKestra1) |
| Temporal UI | http://localhost:8088 |
| ActivePieces bridge | http://localhost:8091/flows |
| Trigger.dev bridge | http://localhost:8092/tasks |

**How to use it:** open a desk on `/app` → click **Run**. To see the attached-apps chart, open the matching **Live \|** workflow in n8n.

---

## Repo layout

```text
src/                 Master Next.js app (catalog, desks, engine adapters)
n8n/                 Seeded n8n workflow JSON (CRM, Email, Slack, WhatsApp)
kestra/              Kestra masters (Invoice, KB, Docs + extras)
temporal-worker/     Temporal workflows + HTTP bridge :8099
workers/ap-bridge    Recruitment + Support webhooks :8091
workers/trigger-bridge  Meeting + Proposal tasks :8092
scripts/             Seed / generate helpers
docker-compose.yml   Local engines
.env.example         Secret names only — copy to .env, never commit .env
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Master UI |
| `npm run seed:n8n` | Import Live n8n webhooks |
| `npm run seed:kestra` | Import Kestra masters |
| `npm run generate:kestra` | Regenerate Kestra YAML |
| `npm run workers:ap` | ActivePieces-compatible bridge |
| `npm run workers:trigger` | Trigger.dev-compatible bridge |

---

## Secrets

Copy `.env.example` → `.env`. **Do not commit `.env` or paste tokens in git.**

Until WhatsApp / Gmail / Slack tokens are set, n8n workflows still run and return stub “accepted” payloads. Add keys later to send for real.

---

## License

Private / internal use unless you add a license file.
