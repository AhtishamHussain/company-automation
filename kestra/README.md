# Kestra (100 modular workflows)

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full design.

## One-line summary

**10 master YAML files** × **10 Switch branches** = **100 workflows**  
(not 100 separate flow files).

## Generate / refresh masters

```bash
npm run generate:kestra
```

Outputs: `kestra/masters/company.*.yml`

## Start Kestra

```bash
docker compose up -d postgres-kestra kestra
```

UI: http://localhost:8080

## Import

1. Open Kestra → Flows  
2. Import each file in `masters/`  
3. Execute `company.operations` / `master` with:

| Input | Example |
|-------|---------|
| `workflow_key` | `daily_standup_aggregator` |
| `payload` | `{"channel":"#standup"}` |

## Plugins (later)

Core works out of the box. For production branches add:

- `io.kestra.plugin.jdbc`
- `io.kestra.plugin.openai`
- `io.kestra.plugin.fs`
- PDF extract/generate plugin

## Catalog

[`catalog/workflows-100.yaml`](./catalog/workflows-100.yaml) — full 1–100 matrix matching your department brief (ops, HR, recruitment, finance, CRM) plus email/slack/whatsapp/knowledge/support.
