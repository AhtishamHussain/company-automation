/**
 * ActivePieces-compatible local webhook runner.
 * Recruitment (9) + Customer Support (8) = 17 Master workflows.
 * Real ActivePieces UI can replace this later; same webhook paths.
 */
import http from "node:http";

const port = Number(process.env.PORT || 8091);

const flows = [
  "recruitment-job-post-sync",
  "recruitment-resume-intake",
  "recruitment-screening-score",
  "recruitment-interview-schedule",
  "recruitment-rejection-email",
  "recruitment-offer-letter",
  "recruitment-referral-capture",
  "recruitment-sourcer-digest",
  "recruitment-background-check",
  "customer-support-ticket-create",
  "customer-support-auto-tag",
  "customer-support-sla-breach",
  "customer-support-macro-suggest",
  "customer-support-csat-survey",
  "customer-support-refund-flow",
  "customer-support-bug-escalate",
  "customer-support-kb-deflect",
];

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function runFlow(id, payload) {
  const [category, ...rest] = id.split("-");
  const action = rest.join("-");
  return {
    ok: true,
    engine: "activepieces",
    flowId: id,
    category: category === "customer" ? "customer-support" : category,
    action,
    integration: {
      provider: "activepieces-bridge",
      status: "accepted",
      note: "Stub runner — swap for ActivePieces cloud/self-host when ready",
      at: new Date().toISOString(),
    },
    received: payload,
    message: `ActivePieces bridge completed ${id}`,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);

  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/v1/flags")) {
    json(res, 200, { ok: true, engine: "activepieces", flows: flows.length });
    return;
  }

  if (req.method === "GET" && url.pathname === "/flows") {
    json(res, 200, { count: flows.length, flows });
    return;
  }

  const hook = url.pathname.match(/^\/api\/v1\/webhooks\/([^/]+)$/);
  if (req.method === "POST" && hook) {
    const id = decodeURIComponent(hook[1]);
    if (!flows.includes(id)) {
      json(res, 404, { ok: false, message: `Unknown flow ${id}` });
      return;
    }
    const payload = await readBody(req);
    json(res, 200, runFlow(id, payload));
    return;
  }

  json(res, 404, { ok: false, message: "Not found" });
});

server.listen(port, () => {
  console.log(`ActivePieces bridge on :${port} (${flows.length} flows)`);
});
