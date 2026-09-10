# Kestra — 100 Company Workflows (Modular Architecture)

Build **100 workflows** with **10 Master Flow Templates** (one per department).  
Each master uses `inputs.workflow_key` + `Switch` / `If` — not 100 unique YAML files.

## Architecture

```text
kestra/
  ARCHITECTURE.md          ← this file
  catalog/workflows-100.yaml
  masters/
    company.operations.yml   # 1–10
    company.hr.yml           # 11–20
    company.recruitment.yml  # 21–30
    company.finance.yml      # 31–40
    company.crm.yml          # 41–50
    company.email.yml        # 51–60
    company.slack.yml        # 61–70
    company.whatsapp.yml     # 71–80
    company.knowledge.yml    # 81–90 extras
    company.support.yml      # 91–100 extras
    company.invoice.yml      # Master Invoice (9)
    company.kb.yml           # Master Knowledge Base (8)
    company.docs.yml         # Master Document Parsing (8)
  runners/                   # thin optional per-workflow entrypoints
```

### How one department works

1. Call master flow with `workflow_key` (e.g. `daily_standup_aggregator`).
2. Master `Switch` routes to that branch.
3. Shared inputs (`payload`, URLs, ids) are passed via `{{ inputs.* }}`.

```yaml
inputs:
  - id: workflow_key
    type: SELECT
    values: [daily_standup_aggregator, e_sign_contract_tracker, ...]
  - id: payload
    type: JSON
    defaults: {}
```

## Prerequisites — plugins

Install / enable before production wiring:

| Package | Used for |
|---------|----------|
| `io.kestra.plugin.core` | Http, Flow (Switch/If/Parallel), Log, Schedule, Webhook |
| `io.kestra.plugin.fs` | Archive / Upload (S3, VFS) |
| `io.kestra.plugin.jdbc` | PostgreSQL / MySQL queries |
| `io.kestra.plugin.openai` | ChatCompletion (AI screening, sentiment) |
| PDF plugins (community / enterprise) | ExtractText, GenerateFromTemplate |

**Vanilla `kestra/kestra:latest` already includes core.**  
Masters in this repo use **core + Log stubs** so they import cleanly; replace stub tasks with jdbc/openai/pdf/fs when plugins are installed.

## Namespaces (10 departments)

| # | Namespace | Workflows | Focus |
|---|-----------|-----------|--------|
| 1 | `company.operations` | 1–10 | Standups, e-sign, inventory, expenses, health, social, feedback, calendar, Wi‑Fi, backup |
| 2 | `company.hr` | 11–20 | Onboarding, offboarding, leave, reviews, policy, referral, training, equipment, org chart |
| 3 | `company.recruitment` | 21–30 | Auto-respond, AI screen, booking, feedback, offer, background, rejection, talent pool, job boards |
| 4 | `company.finance` | 31–40 | Invoice extract, dupe check, PO match, ERP, late pay, tax, FX, payment confirm, audit |
| 5 | `company.crm` | 41–50 | Lead score, stale leads, win/loss, enrich, drip, merge, VIP, round-robin, reporting |
| 6 | `company.email` | 51–60 | Sequences, triage, bounce, digest, outreach, newsletter, tickets |
| 7 | `company.slack` | 61–70 | Incidents, approvals, standup, wins, on-call, polls, archive |
| 8 | `company.whatsapp` | 71–80 | Orders, appointments, support, OTP, broadcast, payments, CSAT |
| 9 | `company.knowledge` | 81–90 | KB ingest, OCR, meeting summary, redact, FAQ |
| 10 | `company.support` | 91–100 | Tickets, SLA, macros, CSAT, refunds, proposals |

Full matrix: [`catalog/workflows-100.yaml`](./catalog/workflows-100.yaml)

## Quick start

```bash
docker compose up -d postgres-kestra kestra
npm run seed:kestra
```

UI: http://localhost:8080  

Login: `admin@master.local` / `MasterKestra1`

### Execute a variation

```http
POST /api/v1/executions/company.operations/master
Content-Type: multipart/form-data

workflow_key=daily_standup_aggregator
payload={"channel":"#standup"}
```

Or from Master app once `KESTRA_BASE_URL` is set — refs look like:

`company.operations/master` + input `workflow_key`.

## Mapping to Master (Next.js)

| Master domain | Kestra master |
|---------------|---------------|
| (ops extras) | `company.operations/master` |
| HR | `company.hr/master` |
| Recruitment | `company.recruitment/master` |
| Invoice | `company.invoice/master` |
| Knowledge Base | `company.kb/master` |
| Document Parsing | `company.docs/master` |
| Email (extra) | `company.email/master` |
| Slack (extra) | `company.slack/master` |
| WhatsApp (extra) | `company.whatsapp/master` |

## Status

- [x] Architecture + catalog (100)
- [x] 10 master YAML templates (Switch routers)
- [ ] Install jdbc / openai / pdf / fs plugins in your Kestra image
- [ ] Replace stub Log tasks with real plugin tasks per branch
- [ ] Point Master adapters at `namespace/master` + `workflow_key`
