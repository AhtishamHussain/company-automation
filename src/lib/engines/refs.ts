import type { EngineId } from "./types";

/** Temporal workflow function names in temporal-worker/src/workflows.ts */
const temporalBySlug: Record<string, string> = {
  "employee-onboarding": "hrEmployeeOnboarding",
  "leave-approval": "hrLeaveApproval",
  "probation-review": "hrProbationReview",
  offboarding: "hrOffboarding",
  "policy-ack": "hrPolicyAck",
  "payroll-change": "hrPayrollChange",
  "equipment-request": "hrEquipmentRequest",
  "performance-cycle": "hrPerformanceCycle",
  "benefits-enrollment": "hrBenefitsEnrollment",
};

const kestraNamespace: Record<string, string> = {
  invoice: "company.invoice",
  "knowledge-base": "company.kb",
  "document-parsing": "company.docs",
};

export function engineWorkflowRef(engine: EngineId, category: string, slug: string): string {
  if (engine === "n8n") return `live-${category}-${slug}`;
  if (engine === "kestra") {
    const ns = kestraNamespace[category] ?? `company.${category}`;
    return `${ns}/master#${slug.replace(/-/g, "_")}`;
  }
  if (engine === "temporal") return temporalBySlug[slug] ?? slug;
  if (engine === "activepieces") return `${category}-${slug}`;
  if (engine === "trigger") return `${category}-${slug}`;
  return `${category}-${slug}`;
}
