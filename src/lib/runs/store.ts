import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { EngineId } from "@/lib/engines/types";
import type { CategoryId } from "@/lib/workflows/catalog";

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  category: CategoryId;
  engine: EngineId;
  ok: boolean;
  message: string;
  runId?: string;
  externalUrl?: string;
  demo: boolean;
  payload?: Record<string, unknown>;
  createdAt: string;
}

const dataDir = join(process.cwd(), ".data");
const runsFile = join(dataDir, "runs.json");

function ensure() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(runsFile)) writeFileSync(runsFile, "[]", "utf8");
}

function readAll(): WorkflowRun[] {
  ensure();
  try {
    return JSON.parse(readFileSync(runsFile, "utf8")) as WorkflowRun[];
  } catch {
    return [];
  }
}

function writeAll(runs: WorkflowRun[]) {
  ensure();
  writeFileSync(runsFile, JSON.stringify(runs.slice(0, 500), null, 2), "utf8");
}

export function listRuns(limit = 50): WorkflowRun[] {
  return readAll().slice(0, limit);
}

export function listRunsByCategory(category: CategoryId, limit = 30): WorkflowRun[] {
  return readAll()
    .filter((r) => r.category === category)
    .slice(0, limit);
}

export function addRun(run: Omit<WorkflowRun, "id" | "createdAt">): WorkflowRun {
  const entry: WorkflowRun = {
    ...run,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.unshift(entry);
  writeAll(all);
  return entry;
}
