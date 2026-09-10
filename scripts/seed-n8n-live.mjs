/**
 * Import clean live-* webhook workflows for all n8n catalog items.
 * Paths are unique (`live-crm-lead-capture`) so they don't collide with older stubs.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const container = process.env.N8N_CONTAINER || "company-automation-n8n-1";
const baseUrl = (process.env.N8N_BASE_URL || "http://localhost:5678").replace(/\/$/, "");
const outDir = join(root, "n8n", "workflows-live");
mkdirSync(outDir, { recursive: true });

const rows = [
  ["crm", "lead-capture", "Lead capture"],
  ["crm", "deal-stage-sync", "Deal stage sync"],
  ["crm", "account-enrich", "Account enrich"],
  ["crm", "stale-deal-nudge", "Stale deal nudge"],
  ["crm", "contact-dedupe", "Contact dedupe"],
  ["crm", "won-deal-handoff", "Won deal handoff"],
  ["crm", "lost-reason-log", "Lost reason log"],
  ["crm", "pipeline-snapshot", "Pipeline snapshot"],
  ["crm", "crm-backup", "CRM backup export"],
  ["email", "welcome-sequence", "Welcome sequence"],
  ["email", "inbox-triage", "Inbox triage"],
  ["email", "bounce-handler", "Bounce handler"],
  ["email", "digest-daily", "Daily digest"],
  ["email", "cold-outreach", "Cold outreach"],
  ["email", "reply-detect", "Reply detect"],
  ["email", "newsletter-send", "Newsletter send"],
  ["email", "email-to-ticket", "Email to ticket"],
  ["slack", "incident-alert", "Incident alert"],
  ["slack", "approval-button", "Approval buttons"],
  ["slack", "standup-prompt", "Standup prompt"],
  ["slack", "new-hire-announce", "New hire announce"],
  ["slack", "deal-won-celebrate", "Deal won celebrate"],
  ["slack", "oncall-rotate", "On-call rotate"],
  ["slack", "feedback-poll", "Feedback poll"],
  ["slack", "channel-archive", "Stale channel archive"],
  ["whatsapp", "order-status", "Order status"],
  ["whatsapp", "appointment-remind", "Appointment remind"],
  ["whatsapp", "support-handoff", "Support handoff"],
  ["whatsapp", "otp-delivery", "OTP delivery"],
  ["whatsapp", "broadcast-optin", "Broadcast (opt-in)"],
  ["whatsapp", "payment-link", "Payment link"],
  ["whatsapp", "feedback-request", "Feedback request"],
  ["whatsapp", "lead-qualify", "Lead qualify chat"],
];

function build(category, slug, name) {
  const masterId = `${category}-${slug}`;
  const path = `live-${category}-${slug}`;
  const ids = {
    webhook: randomUUID(),
    meta: randomUUID(),
    process: randomUUID(),
    respond: randomUUID(),
  };

  return {
    name: `Live | ${category.toUpperCase()} | ${name}`,
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path,
          responseMode: "responseNode",
          options: {},
        },
        id: ids.webhook,
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [0, 0],
        webhookId: randomUUID(),
      },
      {
        parameters: {
          jsCode: `const raw = $('Webhook').first().json || {};
const body = (raw.body && typeof raw.body === 'object' && !Array.isArray(raw.body))
  ? { ...raw, ...raw.body }
  : raw;
return [{
  json: {
    ok: true,
    engine: 'n8n',
    masterWorkflowId: '${masterId}',
    engineWorkflowRef: '${path}',
    category: '${category}',
    action: '${slug}',
    received: {
      name: body.name || null,
      email: body.email || null,
      company: body.company || null,
      to: body.to || body.phone || null,
      channel: body.channel || null,
      text: body.text || body.message || null,
      source: body.source || 'master',
    },
    integration: {
      provider: 'stub',
      status: 'accepted',
      note: 'Replace with real ${category} integration nodes',
      at: new Date().toISOString(),
    },
    message: 'Master ${category}/${slug} completed on n8n',
  }
}];`,
        },
        id: ids.process,
        name: "Process + stub integration",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [300, 0],
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: "={{ $json }}",
          options: {},
        },
        id: ids.respond,
        name: "Respond to Master",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [560, 0],
      },
    ],
    connections: {
      Webhook: {
        main: [[{ node: "Process + stub integration", type: "main", index: 0 }]],
      },
      "Process + stub integration": {
        main: [[{ node: "Respond to Master", type: "main", index: 0 }]],
      },
    },
    settings: { executionOrder: "v1" },
  };
}

for (const row of rows) {
  const wf = build(...row);
  writeFileSync(join(outDir, `${row[0]}-${row[1]}.json`), JSON.stringify(wf, null, 2));
}
console.log(`Wrote ${rows.length} live workflows`);

execSync(`docker exec ${container} mkdir -p /tmp/master-live`, { stdio: "inherit" });
execSync(`docker exec ${container} sh -c "rm -rf /tmp/master-live/*"`, { stdio: "inherit" });
execSync(`docker cp "${outDir}/." ${container}:/tmp/master-live/`, { stdio: "inherit" });
execSync(
  `docker exec -u node ${container} n8n import:workflow --input=/tmp/master-live --separate`,
  { stdio: "inherit" },
);
execSync(
  `docker exec -u node ${container} n8n export:workflow --all --output=/tmp/all-workflows.json`,
  { stdio: "inherit" },
);
execSync(
  `docker cp "${join(root, "scripts", "publish-n8n-inside.js")}" ${container}:/tmp/publish-n8n-inside.js`,
  { stdio: "inherit" },
);

writeFileSync(
  join(root, "scripts", "_publish-live-only.js"),
  `const w=require('/tmp/all-workflows.json');
const a=Array.isArray(w)?w:[w];
const {execSync}=require('child_process');
let ok=0, fail=0;
for (const x of a.filter(i => String(i.name||'').startsWith('Live |'))) {
  try {
    console.log('publish', x.id, x.name);
    execSync('n8n publish:workflow --id=' + x.id, { stdio: 'inherit' });
    ok++;
  } catch { fail++; }
}
console.log('PUBLISHED_LIVE ok=' + ok + ' fail=' + fail);
`,
);
execSync(
  `docker cp "${join(root, "scripts", "_publish-live-only.js")}" ${container}:/tmp/_publish-live-only.js`,
  { stdio: "inherit" },
);
execSync(`docker exec -u node ${container} node /tmp/_publish-live-only.js`, {
  stdio: "inherit",
});
execSync(`docker restart ${container}`, { stdio: "inherit" });
for (let i = 0; i < 40; i++) {
  try {
    if ((await fetch(`${baseUrl}/healthz`)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 2000));
}
await new Promise((r) => setTimeout(r, 6000));
console.log(`Test: POST ${baseUrl}/webhook/live-crm-lead-capture`);
