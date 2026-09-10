import { runOnEngine } from "@/lib/engines/registry";
import { demoModeEnabled, demoRun } from "@/lib/engines/demo";
import { getWorkflow } from "@/lib/workflows/catalog";
import { addRun } from "@/lib/runs/store";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const workflow = getWorkflow(id);
  if (!workflow) {
    return NextResponse.json({ ok: false, message: "Workflow not found" }, { status: 404 });
  }

  let payload: Record<string, unknown> = {};
  try {
    const body = (await request.json()) as { payload?: Record<string, unknown> };
    payload = body.payload ?? {};
  } catch {
    payload = {};
  }

  let result = await runOnEngine(workflow.engine, {
    workflowId: workflow.id,
    engineWorkflowRef: workflow.engineWorkflowRef,
    payload: {
      ...payload,
      _master: {
        workflowId: workflow.id,
        category: workflow.category,
        name: workflow.name,
      },
    },
  });

  let demo = false;
  if (!result.ok && demoModeEnabled()) {
    result = demoRun(workflow.engine, {
      workflowId: workflow.id,
      engineWorkflowRef: workflow.engineWorkflowRef,
      payload,
    }, result.message);
    demo = true;
  }

  const saved = addRun({
    workflowId: workflow.id,
    workflowName: workflow.name,
    category: workflow.category,
    engine: workflow.engine,
    ok: result.ok,
    message: result.message,
    runId: result.runId,
    externalUrl: result.externalUrl,
    demo,
    payload,
  });

  return NextResponse.json(
    { ...result, demo, masterRunId: saved.id, createdAt: saved.createdAt },
    { status: result.ok ? 200 : 502 },
  );
}
