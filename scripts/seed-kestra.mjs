/**
 * Import kestra/masters/*.yml into a local Kestra instance.
 *
 * Usage:
 *   node scripts/seed-kestra.mjs
 *
 * Env:
 *   KESTRA_BASE_URL  default http://localhost:8080
 *   KESTRA_API_TOKEN optional Bearer token
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mastersDir = join(root, "kestra", "masters");
const baseUrl = (process.env.KESTRA_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const token = process.env.KESTRA_API_TOKEN;
const basicUser = process.env.KESTRA_USERNAME || "admin@master.local";
const basicPass = process.env.KESTRA_PASSWORD || "MasterKestra1";

function headers(extra = {}) {
  const h = { ...extra };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  } else {
    h.Authorization = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString("base64")}`;
  }
  return h;
}

async function tryCreate(yaml) {
  const createUrl = `${baseUrl}/api/v1/main/flows`;
  const res = await fetch(createUrl, {
    method: "POST",
    headers: headers({ "Content-Type": "application/x-yaml" }),
    body: yaml,
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (res.ok) return { ok: true, url: createUrl, text };

  const idMatch = yaml.match(/^id:\s*(\S+)/m);
  const nsMatch = yaml.match(/^namespace:\s*(\S+)/m);
  if (
    idMatch &&
    nsMatch &&
    (res.status === 409 ||
      res.status === 422 ||
      text.toLowerCase().includes("already exists"))
  ) {
    const putUrl = `${baseUrl}/api/v1/main/flows/${encodeURIComponent(nsMatch[1])}/${encodeURIComponent(idMatch[1])}`;
    const put = await fetch(putUrl, {
      method: "PUT",
      headers: headers({ "Content-Type": "application/x-yaml" }),
      body: yaml,
      signal: AbortSignal.timeout(60000),
    });
    const putText = await put.text();
    if (put.ok) return { ok: true, url: putUrl, text: putText, updated: true };
    return { ok: false, error: `PUT ${put.status} ${putText.slice(0, 400)}` };
  }

  return { ok: false, error: `POST ${res.status} ${text.slice(0, 400)}` };
}

async function executeSmoke() {
  const form = new FormData();
  form.set("workflow_key", "daily_standup_aggregator");
  form.set("payload", JSON.stringify({ channel: "#standup", source: "seed-kestra" }));
  form.set("dry_run", "true");

  const url = `${baseUrl}/api/v1/main/executions/company.operations/master`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (res.ok) {
    console.log(`Smoke execution OK via ${url}`);
    console.log(text.slice(0, 400));
    return true;
  }
  console.log(`Smoke failed ${res.status}: ${text.slice(0, 400)}`);
  return false;
}

const files = readdirSync(mastersDir).filter((f) => f.endsWith(".yml")).sort();
console.log(`Importing ${files.length} masters into ${baseUrl}`);

let ok = 0;
let fail = 0;
for (const file of files) {
  const yaml = readFileSync(join(mastersDir, file), "utf8");
  const result = await tryCreate(yaml);
  if (result.ok) {
    ok += 1;
    console.log(`✓ ${file}${result.updated ? " (updated)" : ""}`);
  } else {
    fail += 1;
    console.error(`✗ ${file}: ${result.error}`);
  }
}

console.log(`\nImported ok=${ok} fail=${fail}`);
if (ok > 0) {
  console.log("\nRunning smoke: company.operations/master → daily_standup_aggregator");
  await executeSmoke();
}
console.log(`\nOpen Kestra: ${baseUrl}`);
