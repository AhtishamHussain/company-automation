/**
 * Minimal Temporal HTTP bridge + employee onboarding workflow stub.
 *
 * Setup:
 *   1. docker compose up -d postgres-temporal temporal temporal-ui
 *   2. cd temporal-worker && npm install && npm run start
 *   3. Set TEMPORAL_BRIDGE_URL=http://localhost:8099 in Master .env
 */

import { createServer } from "node:http";
import { Connection, Client, NativeConnection, Worker } from "@temporalio/worker";
import { proxyActivities, sleep } from "@temporalio/workflow";

// ---- activities (loaded by worker) ----
export async function notifyHr(employeeId: string) {
  console.log(`[activity] notify HR for ${employeeId}`);
  return { notified: true, employeeId };
}

export async function provisionAccounts(employeeId: string) {
  console.log(`[activity] provision accounts for ${employeeId}`);
  return { provisioned: true, employeeId };
}

// ---- workflow (string reference from Master) ----
const acts = proxyActivities({
  startToCloseTimeout: "1 minute",
});

export async function EmployeeOnboardingWorkflow(input: {
  employeeId?: string;
  name?: string;
}) {
  const employeeId = input.employeeId || `emp-${Date.now()}`;
  await acts.notifyHr(employeeId);
  await sleep("2 seconds");
  await acts.provisionAccounts(employeeId);
  return { ok: true, employeeId, stage: "complete" };
}

// This file is documentation + reference. Use the split files below for a real worker:
// See package.json scripts and src/ in this folder when you scaffold with npm.
console.log("See temporal-worker/README.md — run the TypeScript worker package.");
