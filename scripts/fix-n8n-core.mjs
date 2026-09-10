/**
 * Quick fix: regenerate + import + publish only CRM lead-capture style workflows
 * with includeOtherFields, unique paths. Full seed still: npm run seed:n8n
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
const outDir = join(root, "n8n", "workflows-fix");
mkdirSync(outDir, { recursive: true });

function build(category, slug, name, intent) {
  const masterId = `${category}-${slug}`;
  const path = `master-${category}-${slug}`;
  const ids = Object.fromEntries(
    ["webhook", "meta", "normalize", "stub", "result", "respond"].map((k) => [k, randomUUID()]),
  );

  return {
    name: `Master Fix | ${category.toUpperCase()} | ${name}`,
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
          assignments: {
            assignments: [
              { id: randomUUID(), name: "masterWorkflowId", value: masterId, type: "string" },
              { id: randomUUID(), name: "engineWorkflowRef", value: path, type: "string" },
              { id: randomUUID(), name: "category", value: category, type: "string" },
            ],
          },
          options: { includeOtherFields: true },
        },
        id: ids.meta,
        name: "Master metadata",
        type: "n8n-nodes-base.set",
        typeVersion: 3.4,
        position: [240, 0],
      },
      {
        parameters: {
          jsCode: `const raw = $input.first().json || {};
const body = (raw.body && typeof raw.body === 'object' && !Array.isArray(raw.body))
  ? { ...raw, ...raw.body }
  : raw;
const lead = {
  name: body.name || body.fullName || 'Unknown',
  email: body.email || null,
  company: body.company || body.account || null,
  source: body.source || 'master',
};
return [{
  json: {
    ...body,
    masterWorkflowId: '${masterId}',
    category: '${category}',
    action: '${slug}',
    intent: ${JSON.stringify(intent)},
    lead,
    ok: true,
    integration: { provider: 'stub', status: 'accepted', at: new Date().toISOString() },
    message: 'Master ${category}/${slug} completed',
  }
}];`,
        },
        id: ids.normalize,
        name: "Process payload",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [500, 0],
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
        position: [760, 0],
      },
    ],
    connections: {
      Webhook: { main: [[{ node: "Master metadata", type: "main", index: 0 }]] },
      "Master metadata": { main: [[{ node: "Process payload", type: "main", index: 0 }]] },
      "Process payload": { main: [[{ node: "Respond to Master", type: "main", index: 0 }]] },
    },
    settings: { executionOrder: "v1" },
  };
}

const targets = [
  ["crm", "lead-capture", "Lead capture", "Create CRM lead"],
  ["crm", "deal-stage-sync", "Deal stage sync", "Sync deal stage"],
  ["slack", "incident-alert", "Incident alert", "Critical Slack alert"],
  ["email", "welcome-sequence", "Welcome sequence", "Welcome email"],
  ["whatsapp", "order-status", "Order status", "Order status message"],
];

for (const t of targets) {
  const wf = build(...t);
  writeFileSync(join(outDir, `${t[0]}-${t[1]}.json`), JSON.stringify(wf, null, 2));
}

execSync(`docker exec ${container} mkdir -p /tmp/master-fix`, { stdio: "inherit" });
execSync(`docker exec ${container} sh -c "rm -rf /tmp/master-fix/*"`, { stdio: "inherit" });
execSync(`docker cp "${outDir}/." ${container}:/tmp/master-fix/`, { stdio: "inherit" });
execSync(
  `docker exec -u node ${container} n8n import:workflow --input=/tmp/master-fix --separate`,
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
// Publish only Master Fix workflows
execSync(
  `docker exec -u node ${container} node -e "const w=require('/tmp/all-workflows.json');const a=Array.isArray(w)?w:[w];const {execSync}=require('child_process');for (const x of a.filter(i=>String(i.name||'').startsWith('Master Fix'))){console.log('publish',x.id,x.name);execSync('n8n publish:workflow --id='+x.id,{stdio:'inherit'});}"`,
  { stdio: "inherit" },
);
execSync(`docker restart ${container}`, { stdio: "inherit" });
console.log("Waiting for n8n...");
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch(`${baseUrl}/healthz`);
    if (res.ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 2000));
}
await new Promise((r) => setTimeout(r, 5000));
console.log("Fixed workflows published. Test:");
console.log(`  POST ${baseUrl}/webhook/master-crm-lead-capture`);
