/**
 * Import clean live-* webhook workflows for all n8n catalog items.
 * Paths are unique (`live-crm-lead-capture`) so they don't collide with older stubs.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { buildUnique } from "./n8n-unique-graphs.mjs";

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
  return buildUnique(category, slug, name);
}

const built = rows.map((row) => {
  const wf = build(...row);
  const file = `${row[0]}-${row[1]}.json`;
  writeFileSync(join(outDir, file), JSON.stringify(wf, null, 2));
  return { file, wf };
});
console.log(`Wrote ${rows.length} unique live workflows`);

if (process.env.N8N_JSON_ONLY === "1") {
  process.exit(0);
}

execSync(`docker exec ${container} mkdir -p /tmp/master-live`, { stdio: "inherit" });
try {
  execSync(
    `docker exec -u node ${container} n8n export:workflow --all --output=/tmp/all-workflows.json`,
    { stdio: "inherit" },
  );
  execSync(
    `docker cp ${container}:/tmp/all-workflows.json "${join(root, "scripts", "_n8n-existing.json")}"`,
    { stdio: "inherit" },
  );
  const existing = JSON.parse(readFileSync(join(root, "scripts", "_n8n-existing.json"), "utf8"));
  const arr = Array.isArray(existing) ? existing : [existing];
  const byName = new Map();
  for (const w of arr) {
    if (w?.name && w?.id && !byName.has(w.name)) byName.set(w.name, w.id);
  }
  const importDir = join(root, "n8n", ".import-live");
  mkdirSync(importDir, { recursive: true });
  for (const item of built) {
    const stamped = { ...item.wf };
    const id = byName.get(item.wf.name);
    if (id) stamped.id = id;
    writeFileSync(join(importDir, item.file), JSON.stringify(stamped, null, 2));
  }
  console.log(`Reused ${[...byName.keys()].filter((n) => n.startsWith("Live |")).length} existing Live ids`);
  execSync(`docker exec ${container} sh -c "rm -rf /tmp/master-live/*"`, { stdio: "inherit" });
  execSync(`docker cp "${importDir}/." ${container}:/tmp/master-live/`, { stdio: "inherit" });
} catch (err) {
  console.warn("Could not stamp existing n8n ids (import may duplicate):", err.message);
  execSync(`docker exec ${container} sh -c "rm -rf /tmp/master-live/*"`, { stdio: "inherit" });
  execSync(`docker cp "${outDir}/." ${container}:/tmp/master-live/`, { stdio: "inherit" });
}
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
