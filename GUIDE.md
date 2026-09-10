# Master — Company Automation (100 workflows)

**Master** → **n8n** · **Kestra** · **Temporal** · **ActivePieces** · **Trigger.dev**

In-app guide: http://localhost:3000/setup

---

## What is done

| Piece | Status |
|------|--------|
| Master Next.js app | 12 domain desks, run history, engines health |
| 100 workflows catalogued | `src/lib/workflows/catalog.ts` |
| n8n | 33 Live webhooks (CRM, Email, Slack, WhatsApp) |
| Kestra | Invoice + KB + Docs masters (plus 10 extra department masters) |
| Temporal | 9 HR workflows via worker + HTTP bridge `:8099` |
| ActivePieces | Local bridge `:8091` — Recruitment + Support (17) |
| Trigger.dev | Local bridge `:8092` — Meeting + Proposals (16) |

Live Slack / Gmail / WhatsApp **sending** still needs tokens in `.env`. Until then those n8n workflows return stub “accepted” payloads.

---

## Start everything

```powershell
cd C:\Users\shami\Projects\company-automation
Copy-Item .env.example .env -ErrorAction SilentlyContinue
docker compose up -d n8n postgres-kestra kestra postgres-temporal temporal temporal-ui ap-bridge trigger-bridge
npm run generate:kestra:domains
npm run seed:kestra
npm run seed:n8n
cd temporal-worker; npm install; npm run worker   # terminal A
cd temporal-worker; npm run bridge                # terminal B
cd ..
npm run dev
```

| What | URL |
|------|-----|
| Master | http://localhost:3000 |
| App console | http://localhost:3000/app |
| n8n | http://localhost:5678 |
| Kestra | http://localhost:8080 (`admin@master.local` / `MasterKestra1`) |
| Temporal UI | http://localhost:8088 |
| AP bridge | http://localhost:8091/flows |
| Trigger bridge | http://localhost:8092/tasks |

---

## Domain → engine

| Domain | Engine | Count |
|--------|--------|-------|
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

## Credentials (optional, for real send)

Put in `.env` only — never GitHub:

- WhatsApp Cloud API: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`
- Gmail: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_USER` + one Connect click in n8n
- Slack (if you use it): `SLACK_BOT_TOKEN`
- OpenAI: `OPENAI_API_KEY` (Trigger bridge uses it for summaries/drafts)

Without these, **Run still hits the engines** (stubs), not demo mode, as long as Docker + Temporal worker/bridge are up.
