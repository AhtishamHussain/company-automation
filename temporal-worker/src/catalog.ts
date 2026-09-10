export type TemporalWorkflowDef = {
  type: string;
  name: string;
  category: string;
  description: string;
};

/** 35 durable Temporal workflow types for Master */
export const temporalWorkflows: TemporalWorkflowDef[] = [
  // HR (10)
  { type: "hrEmployeeOnboarding", name: "Employee onboarding", category: "hr", description: "Multi-day hire checklist with durable waits" },
  { type: "hrLeaveApproval", name: "Leave approval chain", category: "hr", description: "Manager → HR approval with SLA timers" },
  { type: "hrOffboarding", name: "Offboarding", category: "hr", description: "Revoke access and collect assets over days" },
  { type: "hrProbationReview", name: "Probation review", category: "hr", description: "30/60/90 day review timers" },
  { type: "hrPayrollChange", name: "Payroll change request", category: "hr", description: "Durable compensation approval" },
  { type: "hrEquipmentRequest", name: "Equipment request", category: "hr", description: "Procurement with human approval signal" },
  { type: "hrPerformanceCycle", name: "Performance cycle", category: "hr", description: "Review cycle reminders" },
  { type: "hrBenefitsEnrollment", name: "Benefits enrollment", category: "hr", description: "Open enrollment window waits" },
  { type: "hrPolicyAck", name: "Policy acknowledgment", category: "hr", description: "Track signatures with reminders" },
  { type: "hrAnniversaryBot", name: "Anniversary / birthday", category: "hr", description: "Scheduled celebrate + wait confirm" },
  // Recruitment durable (5)
  { type: "recInterviewSchedule", name: "Interview schedule", category: "recruitment", description: "Coordinate interviewers with retries" },
  { type: "recBackgroundCheck", name: "Background check", category: "recruitment", description: "Wait for vendor result" },
  { type: "recOfferLetter", name: "Offer letter", category: "recruitment", description: "Generate, send, wait accept/decline" },
  { type: "recRejectionDelay", name: "Rejection email delayer", category: "recruitment", description: "Wait 48h then send" },
  { type: "recReferralReward", name: "Referral reward", category: "recruitment", description: "Track hire → payroll payout" },
  // Finance durable (5)
  { type: "finExpenseApproval", name: "Expense approval", category: "finance", description: "Amount-based approval chain" },
  { type: "finLatePaymentEscalation", name: "Late payment escalation", category: "finance", description: "Weekly escalate unpaid invoices" },
  { type: "finCreditNote", name: "Credit note flow", category: "finance", description: "Approval + ERP sync waits" },
  { type: "finPaymentReconcile", name: "Payment reconciliation", category: "finance", description: "Retry until bank feed matches" },
  { type: "finTaxExport", name: "Tax export", category: "finance", description: "Period close durable export" },
  // CRM durable (5)
  { type: "crmLeadNurture", name: "Lead nurture", category: "crm", description: "Multi-week nurture with retries" },
  { type: "crmWonDealHandoff", name: "Won deal handoff", category: "crm", description: "Handoff to onboarding chain" },
  { type: "crmStaleDealNudge", name: "Stale deal nudge", category: "crm", description: "Periodic owner nudges" },
  { type: "crmLostReason", name: "Lost reason log", category: "crm", description: "Require reason before close" },
  { type: "crmVipEscalation", name: "VIP client flag", category: "crm", description: "Escalate large deals" },
  // Support durable (5)
  { type: "supEscalation", name: "Support escalation", category: "support", description: "Human-in-the-loop escalation" },
  { type: "supRefund", name: "Refund flow", category: "support", description: "Refund approval with waits" },
  { type: "supSlaWatch", name: "SLA breach watch", category: "support", description: "Timer until SLA edge" },
  { type: "supBugEscalate", name: "Bug escalate", category: "support", description: "Open eng issue and wait" },
  { type: "supCsatFollowup", name: "CSAT follow-up", category: "support", description: "Delay then survey" },
  // Ops durable (5)
  { type: "opsContractTracker", name: "E-sign contract tracker", category: "operations", description: "Wait for DocuSign webhook signal" },
  { type: "opsHealthRemediation", name: "System health remediation", category: "operations", description: "Retry remediations on failure" },
  { type: "opsBackupVerify", name: "Backup verify", category: "operations", description: "Archive then verify checksum" },
  { type: "opsWifiProvision", name: "Guest Wi-Fi provision", category: "operations", description: "Provision + confirm delivery" },
  { type: "opsInventoryReorder", name: "Inventory reorder", category: "operations", description: "Alert then wait PO approval" },
];

if (temporalWorkflows.length !== 35) {
  throw new Error(`Expected 35 Temporal workflows, got ${temporalWorkflows.length}`);
}
