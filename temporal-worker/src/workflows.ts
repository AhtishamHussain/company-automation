/**
 * 35 named Temporal workflows — each is a durable stub with sleeps + activities.
 * Replace activity bodies with real HR/CRM/finance integrations later.
 */
import { proxyActivities, sleep } from "@temporalio/workflow";
import type * as activities from "./activities";
import { temporalWorkflows } from "./catalog";

const { markStarted, durableStep, markCompleted } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

async function runDurable(workflowType: string, input: Record<string, unknown> = {}) {
  await markStarted(workflowType, input);
  await durableStep(workflowType, "validate", input);
  await sleep("1 second");
  await durableStep(workflowType, "process", input);
  await sleep("1 second");
  await durableStep(workflowType, "finalize", input);
  return markCompleted(workflowType, input);
}

// --- HR ---
export async function hrEmployeeOnboarding(input: Record<string, unknown> = {}) {
  return runDurable("hrEmployeeOnboarding", input);
}
export async function hrLeaveApproval(input: Record<string, unknown> = {}) {
  return runDurable("hrLeaveApproval", input);
}
export async function hrOffboarding(input: Record<string, unknown> = {}) {
  return runDurable("hrOffboarding", input);
}
export async function hrProbationReview(input: Record<string, unknown> = {}) {
  return runDurable("hrProbationReview", input);
}
export async function hrPayrollChange(input: Record<string, unknown> = {}) {
  return runDurable("hrPayrollChange", input);
}
export async function hrEquipmentRequest(input: Record<string, unknown> = {}) {
  return runDurable("hrEquipmentRequest", input);
}
export async function hrPerformanceCycle(input: Record<string, unknown> = {}) {
  return runDurable("hrPerformanceCycle", input);
}
export async function hrBenefitsEnrollment(input: Record<string, unknown> = {}) {
  return runDurable("hrBenefitsEnrollment", input);
}
export async function hrPolicyAck(input: Record<string, unknown> = {}) {
  return runDurable("hrPolicyAck", input);
}
export async function hrAnniversaryBot(input: Record<string, unknown> = {}) {
  return runDurable("hrAnniversaryBot", input);
}

// --- Recruitment ---
export async function recInterviewSchedule(input: Record<string, unknown> = {}) {
  return runDurable("recInterviewSchedule", input);
}
export async function recBackgroundCheck(input: Record<string, unknown> = {}) {
  return runDurable("recBackgroundCheck", input);
}
export async function recOfferLetter(input: Record<string, unknown> = {}) {
  return runDurable("recOfferLetter", input);
}
export async function recRejectionDelay(input: Record<string, unknown> = {}) {
  return runDurable("recRejectionDelay", input);
}
export async function recReferralReward(input: Record<string, unknown> = {}) {
  return runDurable("recReferralReward", input);
}

// --- Finance ---
export async function finExpenseApproval(input: Record<string, unknown> = {}) {
  return runDurable("finExpenseApproval", input);
}
export async function finLatePaymentEscalation(input: Record<string, unknown> = {}) {
  return runDurable("finLatePaymentEscalation", input);
}
export async function finCreditNote(input: Record<string, unknown> = {}) {
  return runDurable("finCreditNote", input);
}
export async function finPaymentReconcile(input: Record<string, unknown> = {}) {
  return runDurable("finPaymentReconcile", input);
}
export async function finTaxExport(input: Record<string, unknown> = {}) {
  return runDurable("finTaxExport", input);
}

// --- CRM ---
export async function crmLeadNurture(input: Record<string, unknown> = {}) {
  return runDurable("crmLeadNurture", input);
}
export async function crmWonDealHandoff(input: Record<string, unknown> = {}) {
  return runDurable("crmWonDealHandoff", input);
}
export async function crmStaleDealNudge(input: Record<string, unknown> = {}) {
  return runDurable("crmStaleDealNudge", input);
}
export async function crmLostReason(input: Record<string, unknown> = {}) {
  return runDurable("crmLostReason", input);
}
export async function crmVipEscalation(input: Record<string, unknown> = {}) {
  return runDurable("crmVipEscalation", input);
}

// --- Support ---
export async function supEscalation(input: Record<string, unknown> = {}) {
  return runDurable("supEscalation", input);
}
export async function supRefund(input: Record<string, unknown> = {}) {
  return runDurable("supRefund", input);
}
export async function supSlaWatch(input: Record<string, unknown> = {}) {
  return runDurable("supSlaWatch", input);
}
export async function supBugEscalate(input: Record<string, unknown> = {}) {
  return runDurable("supBugEscalate", input);
}
export async function supCsatFollowup(input: Record<string, unknown> = {}) {
  return runDurable("supCsatFollowup", input);
}

// --- Ops ---
export async function opsContractTracker(input: Record<string, unknown> = {}) {
  return runDurable("opsContractTracker", input);
}
export async function opsHealthRemediation(input: Record<string, unknown> = {}) {
  return runDurable("opsHealthRemediation", input);
}
export async function opsBackupVerify(input: Record<string, unknown> = {}) {
  return runDurable("opsBackupVerify", input);
}
export async function opsWifiProvision(input: Record<string, unknown> = {}) {
  return runDurable("opsWifiProvision", input);
}
export async function opsInventoryReorder(input: Record<string, unknown> = {}) {
  return runDurable("opsInventoryReorder", input);
}

/** Ensure catalog stays aligned with exports */
export const registeredWorkflowCount = temporalWorkflows.length;
