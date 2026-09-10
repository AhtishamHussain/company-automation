/**
 * Trigger.dev-compatible local task runner.
 * Meeting Summary (8) + Proposal Generator (8) = 16 Master workflows.
 */
import http from "node:http";

const port = Number(process.env.PORT || 8092);
const openaiKey = process.env.OPENAI_API_KEY || "";

const tasks = [
  "meeting-summary-transcript-ingest",
  "meeting-summary-summary-generate",
  "meeting-summary-action-extract",
  "meeting-summary-crm-notes",
  "meeting-summary-slack-recap",
  "meeting-summary-weekly-rollup",
  "meeting-summary-decision-log",
  "meeting-summary-followup-email",
  "proposal-generator-brief-intake",
  "proposal-generator-draft-generate",
  "proposal-generator-pricing-fill",
  "proposal-generator-legal-review",
  "proposal-generator-client-send",
  "proposal-generator-view-alert",
  "proposal-generator-revision-loop",
  "proposal-generator-win-loss-tag",
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

async function maybeLlm(taskId, payload) {
  const text =
    String(payload.transcript || payload.brief || payload.text || payload.message || "").slice(
      0,
      4000,
    );
  if (!openaiKey || !text) return null;
  if (!taskId.includes("summary-generate") && !taskId.includes("draft-generate")) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: taskId.includes("draft")
              ? "Draft a short professional proposal from the brief."
              : "Summarize the meeting and list action items.",
          },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function runTask(id, payload) {
  const llm = await maybeLlm(id, payload);
  return {
    id: `trg_${Date.now()}`,
    ok: true,
    engine: "trigger",
    taskId: id,
    output: {
      stub: !llm,
      llm: llm || undefined,
      note: llm
        ? "Generated with OpenAI"
        : "Stub runner — add OPENAI_API_KEY for live summaries/drafts",
      at: new Date().toISOString(),
    },
    payload,
    message: `Trigger.dev bridge completed ${id}`,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);

  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/v1/whoami")) {
    json(res, 200, {
      ok: true,
      engine: "trigger",
      project: "master",
      tasks: tasks.length,
      openai: Boolean(openaiKey),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/tasks") {
    json(res, 200, { count: tasks.length, tasks });
    return;
  }

  const hit = url.pathname.match(/^\/api\/v1\/tasks\/([^/]+)\/trigger$/);
  if (req.method === "POST" && hit) {
    const id = decodeURIComponent(hit[1]);
    if (!tasks.includes(id)) {
      json(res, 404, { ok: false, message: `Unknown task ${id}` });
      return;
    }
    const body = await readBody(req);
    const payload = body.payload && typeof body.payload === "object" ? body.payload : body;
    json(res, 200, await runTask(id, payload));
    return;
  }

  json(res, 404, { ok: false, message: "Not found" });
});

server.listen(port, () => {
  console.log(`Trigger.dev bridge on :${port} (${tasks.length} tasks)`);
});
