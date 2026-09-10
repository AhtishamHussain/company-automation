export type EngineId =
  | "n8n"
  | "kestra"
  | "temporal"
  | "activepieces"
  | "trigger";

export type EngineStatus = "online" | "offline" | "degraded" | "unconfigured";

export interface EngineMeta {
  id: EngineId;
  name: string;
  tagline: string;
  bestFor: string[];
  defaultUrlEnv: string;
  docsUrl: string;
}

export interface EngineHealth {
  id: EngineId;
  status: EngineStatus;
  latencyMs?: number;
  message?: string;
  baseUrl?: string;
}

export interface RunWorkflowInput {
  workflowId: string;
  engineWorkflowRef: string;
  payload?: Record<string, unknown>;
}

export interface RunWorkflowResult {
  ok: boolean;
  engine: EngineId;
  runId?: string;
  message: string;
  externalUrl?: string;
}

export interface EngineAdapter {
  meta: EngineMeta;
  health(): Promise<EngineHealth>;
  run(input: RunWorkflowInput): Promise<RunWorkflowResult>;
}
