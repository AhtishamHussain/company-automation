/**
 * Debug: POST one master and print status + body.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2] || join(root, "kestra", "masters", "company.operations.yml");
const yaml = readFileSync(file, "utf8");
const base = process.env.KESTRA_BASE_URL || "http://localhost:8080";
const user = process.env.KESTRA_USERNAME || "admin@master.local";
const pass = process.env.KESTRA_PASSWORD || "MasterKestra1";
const auth = Buffer.from(`${user}:${pass}`).toString("base64");

const urls = [
  `${base}/api/v1/main/flows`,
  `${base}/api/v1/flows`,
];

for (const url of urls) {
  console.log("\nPOST", url);
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-yaml",
        Authorization: `Basic ${auth}`,
      },
      body: yaml,
      signal: controller.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    console.log("STATUS", res.status);
    console.log(text.slice(0, 2000));
  } catch (err) {
    clearTimeout(t);
    console.log("ERR", err instanceof Error ? err.message : err);
  }
}
