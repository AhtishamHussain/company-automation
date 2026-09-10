/**
 * Generate fuller Master n8n workflows and import them.
 *
 * Usage:
 *   $env:N8N_IMPORT_VIA_DOCKER="1"; node scripts/seed-n8n.mjs
 *
 * Every workflow has a Webhook path `master/<category>/<slug>` so Master can Run it
 * without an API key. Extra nodes implement real domain logic (stubs call httpbin).
 */

import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "n8n", "workflows");

const n8nWorkflows = [
  ["crm", "lead-capture", "Lead capture", "Create CRM lead from inbound form payload"],
  ["crm", "deal-stage-sync", "Deal stage sync", "Sync deal stage across CRM tools"],
  ["crm", "account-enrich", "Account enrich", "Enrich company fields from payload"],
  ["crm", "stale-deal-nudge", "Stale deal nudge", "Flag aging deals for owners"],
  ["crm", "contact-dedupe", "Contact dedupe", "Detect duplicate contacts"],
  ["crm", "won-deal-handoff", "Won deal handoff", "Hand closed-won deal to onboarding"],
  ["crm", "lost-reason-log", "Lost reason log", "Require and store loss reason"],
  ["crm", "pipeline-snapshot", "Pipeline snapshot", "Summarize pipeline metrics"],
  ["crm", "crm-backup", "CRM backup export", "Export CRM snapshot payload"],
  ["email", "welcome-sequence", "Welcome sequence", "Build welcome email steps"],
  ["email", "inbox-triage", "Inbox triage", "Label and route inbound mail"],
  ["email", "bounce-handler", "Bounce handler", "Suppress bounced addresses"],
  ["email", "digest-daily", "Daily digest", "Compile digest sections"],
  ["email", "cold-outreach", "Cold outreach", "Prepare outreach sequence"],
  ["email", "reply-detect", "Reply detect", "Stop sequence on human reply"],
  ["email", "newsletter-send", "Newsletter send", "Segment and prepare newsletter"],
  ["email", "email-to-ticket", "Email to ticket", "Convert mail into support ticket"],
  ["slack", "incident-alert", "Incident alert", "Format critical alert for Slack"],
  ["slack", "approval-button", "Approval buttons", "Build approve/reject payload"],
  ["slack", "standup-prompt", "Standup prompt", "Prepare standup reminder"],
  ["slack", "new-hire-announce", "New hire announce", "Compose new-hire welcome"],
  ["slack", "deal-won-celebrate", "Deal won celebrate", "Post win celebration"],
  ["slack", "oncall-rotate", "On-call rotate", "Compute next on-call"],
  ["slack", "feedback-poll", "Feedback poll", "Build Slack poll message"],
  ["slack", "channel-archive", "Stale channel archive", "Mark inactive channel"],
  ["whatsapp", "order-status", "Order status", "Build order status message"],
  ["whatsapp", "appointment-remind", "Appointment remind", "Build appointment reminder"],
  ["whatsapp", "support-handoff", "Support handoff", "Route chat to agent queue"],
  ["whatsapp", "otp-delivery", "OTP delivery", "Prepare OTP message"],
  ["whatsapp", "broadcast-optin", "Broadcast (opt-in)", "Prepare opt-in broadcast"],
  ["whatsapp", "payment-link", "Payment link", "Send payment link message"],
  ["whatsapp", "feedback-request", "Feedback request", "Ask CSAT on WhatsApp"],
  ["whatsapp", "lead-qualify", "Lead qualify chat", "Run qualifying questions"],
];

function domainCode(category, slug, intent) {
  const common = `
const raw = items[0].json || {};
const body = (raw.body && typeof raw.body === 'object' && !Array.isArray(raw.body))
  ? { ...raw, ...raw.body }
  : raw;
const meta = {
  masterWorkflowId: '${category}-${slug}',
  category: '${category}',
  intent: ${JSON.stringify(intent)},
  receivedAt: new Date().toISOString(),
};
`;

  if (category === "crm") {
    return `${common}
const lead = {
  name: body.name || body.fullName || 'Unknown lead',
  email: body.email || null,
  company: body.company || body.account || null,
  source: body.source || 'master',
  stage: body.stage || ( '${slug}' === 'won-deal-handoff' ? 'won' : 'new' ),
};
const valid = Boolean(lead.email || lead.company || body.dealId || body.source === 'master-app' || body.source === 'master-test');
return [{ json: { ...meta, valid, lead, action: '${slug}', next: valid ? 'sync_crm' : 'reject' } }];`;
  }

  if (category === "email") {
    return `${common}
const email = {
  to: body.to || body.email || null,
  subject: body.subject || '[Master] ${intent}',
  template: '${slug}',
  tags: body.tags || ['master', '${category}'],
};
const valid = Boolean(email.to) || '${slug}' === 'digest-daily' || '${slug}' === 'inbox-triage' || body.source === 'master-app';
return [{ json: { ...meta, valid, email, action: '${slug}', next: valid ? 'send_or_route' : 'reject' } }];`;
  }

  if (category === "slack") {
    return `${common}
const slack = {
  channel: body.channel || '#ops',
  text: body.text || body.message || '[Master] ${intent}',
  severity: body.severity || ('${slug}' === 'incident-alert' ? 'critical' : 'info'),
};
return [{ json: { ...meta, valid: true, slack, action: '${slug}', next: 'post_slack' } }];`;
  }

  return `${common}
const wa = {
  to: body.to || body.phone || null,
  template: '${slug}',
  text: body.text || body.message || '[Master] ${intent}',
  locale: body.locale || 'en',
};
const valid = Boolean(wa.to) || '${slug}' === 'broadcast-optin' || body.source === 'master-app';
return [{ json: { ...meta, valid, wa, action: '${slug}', next: valid ? 'send_whatsapp' : 'reject' } }];`;
}

function buildWorkflow([category, slug, name, intent]) {
  const masterId = `${category}-${slug}`;
  const webhookPath = `master-${category}-${slug}`;
  const ref = webhookPath;
  const ids = {
    webhook: randomUUID(),
    meta: randomUUID(),
    normalize: randomUUID(),
    ifValid: randomUUID(),
    http: randomUUID(),
    reject: randomUUID(),
    result: randomUUID(),
    respond: randomUUID(),
  };

  return {
    name: `Master | ${category.toUpperCase()} | ${name}`,
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: webhookPath,
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
          assignments: {
            assignments: [
              { id: randomUUID(), name: "masterWorkflowId", value: masterId, type: "string" },
              { id: randomUUID(), name: "engineWorkflowRef", value: ref, type: "string" },
              { id: randomUUID(), name: "category", value: category, type: "string" },
              { id: randomUUID(), name: "source", value: "master", type: "string" },
            ],
          },
          options: {
            includeOtherFields: true,
          },
        },
        id: ids.meta,
        name: "Master metadata",
        type: "n8n-nodes-base.set",
        typeVersion: 3.4,
        position: [240, 0],
      },
      {
        parameters: {
          jsCode: domainCode(category, slug, intent),
        },
        id: ids.normalize,
        name: "Normalize & validate",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [480, 0],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
            conditions: [
              {
                id: randomUUID(),
                leftValue: "={{ $json.next }}",
                rightValue: "reject",
                operator: { type: "string", operation: "notEquals" },
              },
            ],
            combinator: "and",
          },
          options: {},
        },
        id: ids.ifValid,
        name: "Valid payload?",
        type: "n8n-nodes-base.if",
        typeVersion: 2.2,
        position: [720, 0],
      },
      {
        parameters: {
          jsCode: `// Integration stub — replace with Slack / Gmail / WhatsApp / CRM node
const input = items[0].json;
return [{
  json: {
    ...input,
    integration: {
      provider: 'stub',
      status: 'accepted',
      note: 'Replace this Code node with the real ${category} integration',
      forwardedAt: new Date().toISOString(),
    },
  },
}];`,
        },
        id: ids.http,
        name: "Call integration stub",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [980, -80],
        notes: `Replace with real ${category.toUpperCase()} API / Slack / Email / WhatsApp node`,
        notesInFlow: true,
      },
      {
        parameters: {
          assignments: {
            assignments: [
              { id: randomUUID(), name: "ok", value: false, type: "boolean" },
              {
                id: randomUUID(),
                name: "error",
                value: "Invalid payload — missing required fields",
                type: "string",
              },
              { id: randomUUID(), name: "masterWorkflowId", value: masterId, type: "string" },
            ],
          },
          options: {},
        },
        id: ids.reject,
        name: "Reject invalid",
        type: "n8n-nodes-base.set",
        typeVersion: 3.4,
        position: [980, 120],
      },
      {
        parameters: {
          jsCode: `const j = items[0].json;
return [{
  json: {
    ok: j.ok === false ? false : true,
    engine: 'n8n',
    masterWorkflowId: j.masterWorkflowId || '${masterId}',
    category: '${category}',
    action: '${slug}',
    integrationStub: Boolean(j.integration),
    result: j.lead || j.email || j.slack || j.wa || j.integration || j,
    message: j.ok === false ? (j.error || 'rejected') : 'Master ${category}/${slug} completed',
  }
}];`,
        },
        id: ids.result,
        name: "Build response",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [1220, 0],
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
        position: [1460, 0],
      },
    ],
    connections: {
      Webhook: {
        main: [[{ node: "Master metadata", type: "main", index: 0 }]],
      },
      "Master metadata": {
        main: [[{ node: "Normalize & validate", type: "main", index: 0 }]],
      },
      "Normalize & validate": {
        main: [[{ node: "Valid payload?", type: "main", index: 0 }]],
      },
      "Valid payload?": {
        main: [
          [{ node: "Call integration stub", type: "main", index: 0 }],
          [{ node: "Reject invalid", type: "main", index: 0 }],
        ],
      },
      "Call integration stub": {
        main: [[{ node: "Build response", type: "main", index: 0 }]],
      },
      "Reject invalid": {
        main: [[{ node: "Build response", type: "main", index: 0 }]],
      },
      "Build response": {
        main: [[{ node: "Respond to Master", type: "main", index: 0 }]],
      },
    },
    settings: { executionOrder: "v1" },
    meta: {
      templateCredsSetupCompleted: true,
      masterWorkflowId: masterId,
      engineWorkflowRef: ref,
    },
  };
}

mkdirSync(outDir, { recursive: true });
for (const f of ["_all.json"]) {
  try {
    rmSync(join(outDir, f));
  } catch {
    /* ignore */
  }
}

const generated = n8nWorkflows.map((row) => {
  const wf = buildWorkflow(row);
  const file = join(outDir, `${row[0]}-${row[1]}.json`);
  writeFileSync(file, JSON.stringify(wf, null, 2));
  return { file, wf, id: `${row[0]}-${row[1]}`, ref: `master/${row[0]}/${row[1]}` };
});

writeFileSync(join(outDir, "_all.json"), JSON.stringify(generated.map((g) => g.wf), null, 2));
console.log(`Wrote ${generated.length} workflows (8 nodes each) → ${outDir}`);

const baseUrl = (process.env.N8N_BASE_URL || "http://localhost:5678").replace(/\/$/, "");
const apiKey = process.env.N8N_API_KEY;
const viaDocker = process.env.N8N_IMPORT_VIA_DOCKER === "1";
const container = process.env.N8N_CONTAINER || "company-automation-n8n-1";

async function waitForN8n(label = "n8n") {
  for (let i = 0; i < 40; i++) {
    try {
      const running = execSync(`docker inspect -f "{{.State.Running}}" ${container}`, {
        encoding: "utf8",
      }).trim();
      if (running === "true") {
        const res = await fetch(`${baseUrl}/healthz`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          console.log(`${label} ready`);
          return;
        }
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label} did not become ready`);
}

async function clearOldMasterWorkflows() {
  const tmp = join(root, ".data", "n8n-db");
  mkdirSync(tmp, { recursive: true });
  try {
    execSync(`docker stop ${container}`, { stdio: "inherit" });
    execSync(`docker cp ${container}:/home/node/.n8n/database.sqlite "${join(tmp, "database.sqlite")}"`, {
      stdio: "inherit",
    });
    execSync(
      `docker run --rm -v "${tmp}:/data" keinos/sqlite3 sqlite3 /data/database.sqlite "DELETE FROM workflow_entity WHERE name LIKE 'Master · %';"`,
      { stdio: "inherit" },
    );
    execSync(`docker cp "${join(tmp, "database.sqlite")}" ${container}:/home/node/.n8n/database.sqlite`, {
      stdio: "inherit",
    });
    execSync(`docker start ${container}`, { stdio: "inherit" });
    await waitForN8n("n8n after clear");
    console.log("Cleared old Master workflows.");
  } catch (err) {
    console.log(
      "Could not clear old workflows (ok if first run):",
      err instanceof Error ? err.message : err,
    );
    try {
      execSync(`docker start ${container}`, { stdio: "inherit" });
      await waitForN8n("n8n recovery");
    } catch {
      /* ignore */
    }
  }
}

function dockerExec(cmd, opts = {}) {
  const full = `docker exec ${container} ${cmd}`;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      return execSync(full, { stdio: "inherit", ...opts });
    } catch (err) {
      if (attempt === 8) throw err;
      console.log(`docker exec retry ${attempt}/8...`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2500);
    }
  }
}

async function importViaDocker() {
  // Never rewrite sqlite from the host — it breaks volume permissions/WAL.
  await waitForN8n("n8n before import");
  await new Promise((r) => setTimeout(r, 3000));

  dockerExec(`mkdir -p /tmp/master-workflows`);
  dockerExec(`sh -c "rm -rf /tmp/master-workflows/*"`);
  execSync(`docker cp "${outDir}/." ${container}:/tmp/master-workflows/`, { stdio: "inherit" });
  try {
    dockerExec(`rm -f /tmp/master-workflows/_all.json`);
  } catch {
    /* ignore */
  }

  execSync(
    `docker exec -u node ${container} n8n import:workflow --input=/tmp/master-workflows --separate`,
    { stdio: "inherit" },
  );

  // Publish each workflow (required for production webhooks on modern n8n)
  const publishScript = join(root, "scripts", "publish-n8n-inside.js");
  execSync(
    `docker exec -u node ${container} n8n export:workflow --all --output=/tmp/all-workflows.json`,
    { stdio: "inherit" },
  );
  execSync(`docker cp "${publishScript}" ${container}:/tmp/publish-n8n-inside.js`, {
    stdio: "inherit",
  });
  execSync(`docker exec -u node ${container} node /tmp/publish-n8n-inside.js`, {
    stdio: "inherit",
  });
  console.log("Published workflows (webhooks live after restart).");

  execSync(`docker restart ${container}`, { stdio: "inherit" });
  await waitForN8n("n8n after activate");
  await new Promise((r) => setTimeout(r, 8000));
  console.log(`Open n8n: ${baseUrl}`);
}

async function importViaApi() {
  if (!apiKey) {
    console.log("\nNo N8N_API_KEY — files written only.");
    console.log('Set N8N_IMPORT_VIA_DOCKER=1 to import+activate via Docker.');
    return;
  }
  let created = 0;
  for (const g of generated) {
    const res = await fetch(`${baseUrl}/api/v1/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
      body: JSON.stringify({
        name: g.wf.name,
        nodes: g.wf.nodes,
        connections: g.wf.connections,
        settings: g.wf.settings,
      }),
    });
    if (!res.ok) {
      console.warn(`Failed ${g.id}: ${res.status} ${await res.text()}`);
      continue;
    }
    const data = await res.json();
    const id = data.data?.id || data.id;
    if (id) {
      await fetch(`${baseUrl}/api/v1/workflows/${id}/activate`, {
        method: "POST",
        headers: { "X-N8N-API-KEY": apiKey },
      });
    }
    created += 1;
    process.stdout.write(".");
  }
  console.log(`\nAPI import: ${created} workflows`);
}

if (viaDocker) {
  await importViaDocker();
} else {
  await importViaApi();
}

console.log("\nMaster Run URL pattern:");
console.log(`  POST ${baseUrl}/webhook/master-<category>-<slug>`);
console.log("Example:");
console.log(`  POST ${baseUrl}/webhook/master-crm-lead-capture`);
