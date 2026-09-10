const { readFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");

const raw = readFileSync("/tmp/all-workflows.json", "utf8");
const data = JSON.parse(raw);
const arr = Array.isArray(data) ? data : [data];
console.log("COUNT=" + arr.length);

let ok = 0;
let fail = 0;
for (const wf of arr) {
  try {
    execSync(`n8n publish:workflow --id=${wf.id}`, { stdio: "inherit" });
    ok += 1;
  } catch (err) {
    fail += 1;
    console.error("FAIL", wf.id, wf.name);
  }
}
console.log(`PUBLISHED ok=${ok} fail=${fail}`);
writeFileSync("/tmp/publish-summary.txt", `ok=${ok} fail=${fail}\n`);
