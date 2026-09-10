/**
 * Generate Kestra masters that match Master's 100-workflow catalog:
 * Invoice, Knowledge Base, Document Parsing.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "kestra", "masters");
mkdirSync(outDir, { recursive: true });

const domains = [
  {
    ns: "company.invoice",
    file: "company.invoice.yml",
    label: "Invoice",
    items: [
      ["invoice_generate", "Generate invoices"],
      ["invoice_send", "Send invoices"],
      ["payment_reconcile", "Payment reconciliation"],
      ["overdue_dunning", "Overdue dunning"],
      ["tax_export", "Tax export"],
      ["credit_note", "Credit note flow"],
      ["vendor_bill_ingest", "Vendor bill ingest"],
      ["fx_revalue", "FX revaluation"],
      ["invoice_anomaly", "Invoice anomaly scan"],
    ],
  },
  {
    ns: "company.kb",
    file: "company.kb.yml",
    label: "Knowledge Base",
    items: [
      ["docs_ingest", "Docs ingest"],
      ["chunk_embed", "Chunk and embed"],
      ["stale_article", "Stale article detect"],
      ["faq_publish", "FAQ publish"],
      ["answer_draft", "Answer draft"],
      ["access_sync", "Access sync"],
      ["multilingual_mirror", "Multilingual mirror"],
      ["kb_backup", "KB backup"],
    ],
  },
  {
    ns: "company.docs",
    file: "company.docs.yml",
    label: "Document Parsing",
    items: [
      ["ocr_pipeline", "OCR pipeline"],
      ["invoice_extract", "Invoice extract"],
      ["contract_classify", "Contract classify"],
      ["id_verify", "ID verify parse"],
      ["receipt_expense", "Receipt to expense"],
      ["form_digitize", "Form digitize"],
      ["redact_pii", "Redact PII"],
      ["batch_pdf_split", "Batch PDF split"],
    ],
  },
];

function yaml(domain) {
  const keys = domain.items.map(([k]) => k);
  const cases = domain.items
    .map(
      ([key, name]) => `      ${key}:
        - id: log_${key}
          type: io.kestra.plugin.core.log.Log
          message: |
            [{{ inputs.workflow_key }}] ${name}
            Namespace: ${domain.ns}
            Payload: {{ inputs.payload }}
        - id: done_${key}
          type: io.kestra.plugin.core.debug.Return
          format: "OK ${key} — Master ${domain.label}"`,
    )
    .join("\n");

  return `id: master
namespace: ${domain.ns}
description: |
  Master catalog domain: ${domain.label} (${domain.items.length} workflows).
  Execute with inputs.workflow_key matching the catalog slug (underscores).
labels:
  architecture: master-catalog
  domain: "${domain.label}"
  count: "${domain.items.length}"

inputs:
  - id: workflow_key
    type: SELECT
    required: true
    values:
${keys.map((k) => `      - ${k}`).join("\n")}
    description: Which Master workflow to run
  - id: payload
    type: JSON
    defaults: {}
  - id: callback_url
    type: STRING
    defaults: "https://httpbin.org/post"
  - id: dry_run
    type: BOOLEAN
    defaults: true

tasks:
  - id: route
    type: io.kestra.plugin.core.flow.Switch
    value: "{{ inputs.workflow_key }}"
    cases:
${cases}
    defaults:
      - id: unknown_key
        type: io.kestra.plugin.core.log.Log
        level: ERROR
        message: "Unknown workflow_key={{ inputs.workflow_key }}"

triggers: []
`;
}

for (const d of domains) {
  writeFileSync(join(outDir, d.file), yaml(d));
  console.log(`Wrote ${d.file} (${d.items.length})`);
}
