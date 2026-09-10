import type { EngineId, RunWorkflowInput, RunWorkflowResult } from "@/lib/engines/types";

/** When true (default), Master records a local demo run if the engine is not configured. */
export function demoModeEnabled() {
  return process.env.MASTER_DEMO_MODE !== "0" && process.env.MASTER_DEMO_MODE !== "false";
}

export function demoRun(
  engine: EngineId,
  input: RunWorkflowInput,
  reason: string,
): RunWorkflowResult {
  const runId = `demo-${engine}-${Date.now()}`;
  return {
    ok: true,
    engine,
    runId,
    message: `Demo run recorded on Master (${reason}). Wire ${engine} credentials to execute for real.`,
    externalUrl: undefined,
  };
}
