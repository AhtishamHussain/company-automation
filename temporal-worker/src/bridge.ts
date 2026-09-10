import http from "node:http";
import { Connection, Client } from "@temporalio/client";
import { temporalWorkflows } from "./catalog";
import * as workflows from "./workflows";

const port = Number(process.env.TEMPORAL_BRIDGE_PORT || 8099);
const address = process.env.TEMPORAL_ADDRESS || "localhost:7233";
const namespace = process.env.TEMPORAL_NAMESPACE || "default";
const taskQueue = process.env.TEMPORAL_TASK_QUEUE || "master-durable";

const workflowFns = workflows as unknown as Record<
  string,
  ((input?: Record<string, unknown>) => Promise<unknown>) | number
>;

function getWorkflowFn(name: string) {
  const fn = workflowFns[name];
  return typeof fn === "function" ? fn : undefined;
}

async function main() {
  const connection = await Connection.connect({ address });
  const client = new Client({ connection, namespace });

  const server = http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      if (req.method === "GET" && req.url === "/health") {
        res.end(JSON.stringify({ ok: true, workflows: temporalWorkflows.length, taskQueue }));
        return;
      }

      if (req.method === "GET" && req.url === "/workflows") {
        res.end(JSON.stringify({ count: temporalWorkflows.length, workflows: temporalWorkflows }));
        return;
      }

      if (req.method === "POST" && req.url === "/workflows/start") {
        const body = await readJson(req);
        const workflowType = String(body.workflowType || body.type || "");
        const fn = getWorkflowFn(workflowType);
        if (!fn) {
          res.statusCode = 404;
          res.end(JSON.stringify({ ok: false, message: `Unknown workflowType: ${workflowType}` }));
          return;
        }
        const workflowId =
          String(body.workflowId || `${workflowType}-${Date.now()}`).slice(0, 200);
        const args = Array.isArray(body.args) ? body.args : [body.payload || body.args || {}];
        const handle = await client.workflow.start(fn, {
          taskQueue,
          workflowId,
          args: args as [Record<string, unknown>],
        });
        res.end(
          JSON.stringify({
            ok: true,
            workflowId: handle.workflowId,
            runId: handle.firstExecutionRunId,
            workflowType,
          }),
        );
        return;
      }

      if (req.method === "POST" && req.url === "/workflows/start-all-smoke") {
        // Start all 35 with tiny payloads (for demo)
        const started = [];
        for (const def of temporalWorkflows) {
          const fn = getWorkflowFn(def.type);
          if (!fn) continue;
          const workflowId = `smoke-${def.type}-${Date.now()}`;
          const handle = await client.workflow.start(fn, {
            taskQueue,
            workflowId,
            args: [{ source: "smoke-all", category: def.category }],
          });
          started.push({ type: def.type, workflowId: handle.workflowId, runId: handle.firstExecutionRunId });
          // small stagger
          await new Promise((r) => setTimeout(r, 50));
        }
        res.end(JSON.stringify({ ok: true, count: started.length, started }));
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, message: "Not found" }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, message: err instanceof Error ? err.message : "error" }));
    }
  });

  server.listen(port, () => {
    console.log(`Temporal HTTP bridge on :${port} → ${address} (${temporalWorkflows.length} workflows)`);
  });
}

function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
