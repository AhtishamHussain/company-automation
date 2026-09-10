export interface DurableInput {
  source?: string;
  [key: string]: unknown;
}

export async function markStarted(workflowType: string, input: DurableInput): Promise<{ ok: true; at: string }> {
  console.log(`[activity] start ${workflowType}`, JSON.stringify(input).slice(0, 200));
  return { ok: true, at: new Date().toISOString() };
}

export async function durableStep(
  workflowType: string,
  step: string,
  input: DurableInput,
): Promise<{ ok: true; step: string }> {
  console.log(`[activity] ${workflowType} → ${step}`);
  return { ok: true, step };
}

export async function markCompleted(
  workflowType: string,
  input: DurableInput,
): Promise<{ ok: true; workflowType: string; message: string }> {
  console.log(`[activity] complete ${workflowType}`);
  return {
    ok: true,
    workflowType,
    message: `Temporal durable stub completed: ${workflowType}`,
  };
}
