import { activepiecesAdapter } from "./activepieces";
import { kestraAdapter } from "./kestra";
import { n8nAdapter } from "./n8n";
import { temporalAdapter } from "./temporal";
import { triggerAdapter } from "./trigger";
import type { EngineAdapter, EngineId, EngineMeta } from "./types";

const adapters: Record<EngineId, EngineAdapter> = {
  n8n: n8nAdapter,
  kestra: kestraAdapter,
  temporal: temporalAdapter,
  activepieces: activepiecesAdapter,
  trigger: triggerAdapter,
};

export function getEngine(id: EngineId): EngineAdapter {
  return adapters[id];
}

export function listEngines(): EngineMeta[] {
  return Object.values(adapters).map((a) => a.meta);
}

export async function healthAll() {
  return Promise.all(Object.values(adapters).map((a) => a.health()));
}

export async function runOnEngine(
  id: EngineId,
  input: Parameters<EngineAdapter["run"]>[0],
) {
  return adapters[id].run(input);
}
