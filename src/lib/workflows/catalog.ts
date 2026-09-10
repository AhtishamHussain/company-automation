import type { EngineId } from "@/lib/engines/types";
import { engineWorkflowRef } from "@/lib/engines/refs";

export type CategoryId =
  | "hr"
  | "recruitment"
  | "invoice"
  | "crm"
  | "email"
  | "slack"
  | "whatsapp"
  | "knowledge-base"
  | "document-parsing"
  | "meeting-summary"
  | "customer-support"
  | "proposal-generator";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  preferredEngine: EngineId;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  engine: EngineId;
  /** External id on the target engine (flow id, workflow id, task id, etc.) */
  engineWorkflowRef: string;
  trigger: "manual" | "webhook" | "schedule" | "event";
  tags: string[];
}

export const categories: Category[] = [
  {
    id: "hr",
    name: "HR",
    description: "Onboarding, leave, policies, employee lifecycle",
    preferredEngine: "temporal",
  },
  {
    id: "recruitment",
    name: "Recruitment",
    description: "Sourcing, screening, interviews, offers",
    preferredEngine: "activepieces",
  },
  {
    id: "invoice",
    name: "Invoice",
    description: "Billing, collections, reconciliation",
    preferredEngine: "kestra",
  },
  {
    id: "crm",
    name: "CRM",
    description: "Leads, deals, accounts, pipeline sync",
    preferredEngine: "n8n",
  },
  {
    id: "email",
    name: "Email",
    description: "Sequences, routing, digests",
    preferredEngine: "n8n",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Alerts, approvals, team ops",
    preferredEngine: "n8n",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Customer and ops messaging",
    preferredEngine: "n8n",
  },
  {
    id: "knowledge-base",
    name: "Knowledge Base",
    description: "Ingest, index, answer from docs",
    preferredEngine: "kestra",
  },
  {
    id: "document-parsing",
    name: "Document Parsing",
    description: "OCR, extract, classify, route",
    preferredEngine: "kestra",
  },
  {
    id: "meeting-summary",
    name: "Meeting Summary",
    description: "Transcript → notes → actions",
    preferredEngine: "trigger",
  },
  {
    id: "customer-support",
    name: "Customer Support",
    description: "Tickets, escalation, CSAT",
    preferredEngine: "activepieces",
  },
  {
    id: "proposal-generator",
    name: "Proposal Generator",
    description: "Draft, review, send proposals",
    preferredEngine: "trigger",
  },
];

type Seed = {
  category: CategoryId;
  engine: EngineId;
  items: Array<{ slug: string; name: string; description: string; trigger: Workflow["trigger"] }>;
};

const seeds: Seed[] = [
  {
    category: "hr",
    engine: "temporal",
    items: [
      { slug: "employee-onboarding", name: "Employee onboarding", description: "Multi-day hire checklist across IT, payroll, and manager tasks", trigger: "event" },
      { slug: "leave-approval", name: "Leave approval chain", description: "Manager → HR approval with SLA timers", trigger: "webhook" },
      { slug: "probation-review", name: "Probation review", description: "Schedule 30/60/90 day reviews and collect feedback", trigger: "schedule" },
      { slug: "offboarding", name: "Offboarding", description: "Revoke access, collect assets, exit interview", trigger: "event" },
      { slug: "policy-ack", name: "Policy acknowledgment", description: "Distribute policy updates and track signatures", trigger: "manual" },
      { slug: "payroll-change", name: "Payroll change request", description: "Durable approval for compensation changes", trigger: "webhook" },
      { slug: "equipment-request", name: "Equipment request", description: "Laptop/phone request with procurement steps", trigger: "manual" },
      { slug: "performance-cycle", name: "Performance cycle", description: "Kick off review cycles and reminders", trigger: "schedule" },
      { slug: "benefits-enrollment", name: "Benefits enrollment", description: "Open enrollment windows and confirmations", trigger: "schedule" },
    ],
  },
  {
    category: "recruitment",
    engine: "activepieces",
    items: [
      { slug: "job-post-sync", name: "Job post sync", description: "Publish openings to boards and career page", trigger: "manual" },
      { slug: "resume-intake", name: "Resume intake", description: "Parse inbound applications into ATS fields", trigger: "webhook" },
      { slug: "screening-score", name: "Screening score", description: "Score candidates against role criteria", trigger: "event" },
      { slug: "interview-schedule", name: "Interview schedule", description: "Coordinate interviewers and calendar invites", trigger: "manual" },
      { slug: "rejection-email", name: "Rejection email", description: "Send polite declines at stage gates", trigger: "event" },
      { slug: "offer-letter", name: "Offer letter", description: "Generate and send offer packets", trigger: "manual" },
      { slug: "referral-capture", name: "Referral capture", description: "Ingest employee referrals into pipeline", trigger: "webhook" },
      { slug: "sourcer-digest", name: "Sourcer digest", description: "Daily digest of new qualified candidates", trigger: "schedule" },
      { slug: "background-check", name: "Background check", description: "Trigger vendor checks and wait for result", trigger: "event" },
    ],
  },
  {
    category: "invoice",
    engine: "kestra",
    items: [
      { slug: "invoice-generate", name: "Generate invoices", description: "Batch create invoices from closed deals", trigger: "schedule" },
      { slug: "invoice-send", name: "Send invoices", description: "Email PDFs and track delivery", trigger: "schedule" },
      { slug: "payment-reconcile", name: "Payment reconciliation", description: "Match bank feeds to open invoices", trigger: "schedule" },
      { slug: "overdue-dunning", name: "Overdue dunning", description: "Escalating reminders for unpaid invoices", trigger: "schedule" },
      { slug: "tax-export", name: "Tax export", description: "Export period invoices for filing", trigger: "manual" },
      { slug: "credit-note", name: "Credit note flow", description: "Issue and sync credit notes", trigger: "webhook" },
      { slug: "vendor-bill-ingest", name: "Vendor bill ingest", description: "Parse vendor bills into AP", trigger: "event" },
      { slug: "fx-revalue", name: "FX revaluation", description: "Nightly FX revalue on open AR", trigger: "schedule" },
      { slug: "invoice-anomaly", name: "Invoice anomaly scan", description: "Flag duplicate or outlier invoices", trigger: "schedule" },
    ],
  },
  {
    category: "crm",
    engine: "n8n",
    items: [
      { slug: "lead-capture", name: "Lead capture", description: "Website form → CRM lead with enrichment", trigger: "webhook" },
      { slug: "deal-stage-sync", name: "Deal stage sync", description: "Keep CRM stages aligned across tools", trigger: "event" },
      { slug: "account-enrich", name: "Account enrich", description: "Enrich company records from firmographics", trigger: "event" },
      { slug: "stale-deal-nudge", name: "Stale deal nudge", description: "Alert owners on aging opportunities", trigger: "schedule" },
      { slug: "contact-dedupe", name: "Contact dedupe", description: "Merge duplicate contacts safely", trigger: "schedule" },
      { slug: "won-deal-handoff", name: "Won deal handoff", description: "Create onboarding tasks after close-won", trigger: "event" },
      { slug: "lost-reason-log", name: "Lost reason log", description: "Require and summarize loss reasons", trigger: "event" },
      { slug: "pipeline-snapshot", name: "Pipeline snapshot", description: "Daily pipeline metrics to Slack", trigger: "schedule" },
      { slug: "crm-backup", name: "CRM backup export", description: "Nightly CRM export to object storage", trigger: "schedule" },
    ],
  },
  {
    category: "email",
    engine: "n8n",
    items: [
      { slug: "welcome-sequence", name: "Welcome sequence", description: "Multi-step welcome emails for new users", trigger: "event" },
      { slug: "inbox-triage", name: "Inbox triage", description: "Label and route shared inbox mail", trigger: "event" },
      { slug: "bounce-handler", name: "Bounce handler", description: "Suppress bounced addresses in CRM", trigger: "webhook" },
      { slug: "digest-daily", name: "Daily digest", description: "Compile and send team digests", trigger: "schedule" },
      { slug: "cold-outreach", name: "Cold outreach", description: "Compliant sequenced outreach", trigger: "manual" },
      { slug: "reply-detect", name: "Reply detect", description: "Stop sequences on human reply", trigger: "event" },
      { slug: "newsletter-send", name: "Newsletter send", description: "Segment and send newsletters", trigger: "manual" },
      { slug: "email-to-ticket", name: "Email to ticket", description: "Convert support mail into tickets", trigger: "event" },
    ],
  },
  {
    category: "slack",
    engine: "n8n",
    items: [
      { slug: "incident-alert", name: "Incident alert", description: "Page channel on critical alerts", trigger: "webhook" },
      { slug: "approval-button", name: "Approval buttons", description: "Approve/reject via Slack interactions", trigger: "event" },
      { slug: "standup-prompt", name: "Standup prompt", description: "Daily standup reminders and collection", trigger: "schedule" },
      { slug: "new-hire-announce", name: "New hire announce", description: "Welcome message on start date", trigger: "schedule" },
      { slug: "deal-won-celebrate", name: "Deal won celebrate", description: "Post wins to sales channel", trigger: "event" },
      { slug: "oncall-rotate", name: "On-call rotate", description: "Update on-call group weekly", trigger: "schedule" },
      { slug: "feedback-poll", name: "Feedback poll", description: "Run lightweight Slack polls", trigger: "manual" },
      { slug: "channel-archive", name: "Stale channel archive", description: "Archive inactive project channels", trigger: "schedule" },
    ],
  },
  {
    category: "whatsapp",
    engine: "n8n",
    items: [
      { slug: "order-status", name: "Order status", description: "Send order status updates on WhatsApp", trigger: "event" },
      { slug: "appointment-remind", name: "Appointment remind", description: "Remind customers before appointments", trigger: "schedule" },
      { slug: "support-handoff", name: "Support handoff", description: "Route WhatsApp chats to agents", trigger: "webhook" },
      { slug: "otp-delivery", name: "OTP delivery", description: "Deliver verification codes", trigger: "webhook" },
      { slug: "broadcast-optin", name: "Broadcast (opt-in)", description: "Compliant broadcast to opted-in lists", trigger: "manual" },
      { slug: "payment-link", name: "Payment link", description: "Send invoice payment links", trigger: "event" },
      { slug: "feedback-request", name: "Feedback request", description: "Ask for CSAT after resolution", trigger: "event" },
      { slug: "lead-qualify", name: "Lead qualify chat", description: "Qualifying questions via WhatsApp", trigger: "webhook" },
    ],
  },
  {
    category: "knowledge-base",
    engine: "kestra",
    items: [
      { slug: "docs-ingest", name: "Docs ingest", description: "Ingest Drive/Notion docs into KB index", trigger: "schedule" },
      { slug: "chunk-embed", name: "Chunk & embed", description: "Chunk documents and write embeddings", trigger: "event" },
      { slug: "stale-article", name: "Stale article detect", description: "Flag outdated KB articles", trigger: "schedule" },
      { slug: "faq-publish", name: "FAQ publish", description: "Publish approved FAQs to help center", trigger: "manual" },
      { slug: "answer-draft", name: "Answer draft", description: "Draft answers from KB for agents", trigger: "webhook" },
      { slug: "access-sync", name: "Access sync", description: "Sync KB permissions with SSO groups", trigger: "schedule" },
      { slug: "multilingual-mirror", name: "Multilingual mirror", description: "Mirror key articles across locales", trigger: "event" },
      { slug: "kb-backup", name: "KB backup", description: "Snapshot KB content nightly", trigger: "schedule" },
    ],
  },
  {
    category: "document-parsing",
    engine: "kestra",
    items: [
      { slug: "ocr-pipeline", name: "OCR pipeline", description: "OCR scans into searchable text", trigger: "event" },
      { slug: "invoice-extract", name: "Invoice extract", description: "Extract line items from invoice PDFs", trigger: "event" },
      { slug: "contract-classify", name: "Contract classify", description: "Classify contracts by type and risk", trigger: "event" },
      { slug: "id-verify", name: "ID verify parse", description: "Parse ID documents for KYC fields", trigger: "webhook" },
      { slug: "receipt-expense", name: "Receipt to expense", description: "Turn receipts into expense entries", trigger: "event" },
      { slug: "form-digitize", name: "Form digitize", description: "Digitize paper forms into structured data", trigger: "manual" },
      { slug: "redact-pii", name: "Redact PII", description: "Detect and redact PII before storage", trigger: "event" },
      { slug: "batch-pdf-split", name: "Batch PDF split", description: "Split and route multi-doc PDFs", trigger: "schedule" },
    ],
  },
  {
    category: "meeting-summary",
    engine: "trigger",
    items: [
      { slug: "transcript-ingest", name: "Transcript ingest", description: "Pull transcripts from Zoom/Meet", trigger: "webhook" },
      { slug: "summary-generate", name: "Summary generate", description: "Create concise meeting summaries", trigger: "event" },
      { slug: "action-extract", name: "Action extract", description: "Extract owners and due dates", trigger: "event" },
      { slug: "crm-notes", name: "CRM notes sync", description: "Push summaries into CRM activities", trigger: "event" },
      { slug: "slack-recap", name: "Slack recap", description: "Post recap to project channel", trigger: "event" },
      { slug: "weekly-rollup", name: "Weekly rollup", description: "Roll meeting themes into weekly brief", trigger: "schedule" },
      { slug: "decision-log", name: "Decision log", description: "Append decisions to a living doc", trigger: "event" },
      { slug: "followup-email", name: "Follow-up email", description: "Draft follow-ups for attendees", trigger: "manual" },
    ],
  },
  {
    category: "customer-support",
    engine: "activepieces",
    items: [
      { slug: "ticket-create", name: "Ticket create", description: "Create tickets from multi-channel intake", trigger: "webhook" },
      { slug: "auto-tag", name: "Auto tag", description: "Tag tickets by intent and urgency", trigger: "event" },
      { slug: "sla-breach", name: "SLA breach alert", description: "Escalate tickets nearing SLA", trigger: "schedule" },
      { slug: "macro-suggest", name: "Macro suggest", description: "Suggest reply macros to agents", trigger: "event" },
      { slug: "csat-survey", name: "CSAT survey", description: "Send CSAT after ticket close", trigger: "event" },
      { slug: "refund-flow", name: "Refund flow", description: "Guided refund approval workflow", trigger: "manual" },
      { slug: "bug-escalate", name: "Bug escalate", description: "Open engineering issues from tickets", trigger: "manual" },
      { slug: "kb-deflect", name: "KB deflect", description: "Suggest KB articles before ticket", trigger: "webhook" },
    ],
  },
  {
    category: "proposal-generator",
    engine: "trigger",
    items: [
      { slug: "brief-intake", name: "Brief intake", description: "Collect RFP brief and requirements", trigger: "manual" },
      { slug: "draft-generate", name: "Draft generate", description: "Generate proposal draft from CRM + KB", trigger: "event" },
      { slug: "pricing-fill", name: "Pricing fill", description: "Fill pricing tables from catalog", trigger: "event" },
      { slug: "legal-review", name: "Legal review", description: "Route draft to legal checklist", trigger: "event" },
      { slug: "client-send", name: "Client send", description: "Send proposal with tracking link", trigger: "manual" },
      { slug: "view-alert", name: "View alert", description: "Notify AE when proposal is opened", trigger: "webhook" },
      { slug: "revision-loop", name: "Revision loop", description: "Incorporate feedback into next version", trigger: "event" },
      { slug: "win-loss-tag", name: "Win/loss tag", description: "Tag proposal outcome back to CRM", trigger: "event" },
    ],
  },
];

function buildWorkflows(): Workflow[] {
  const out: Workflow[] = [];
  for (const seed of seeds) {
    for (const item of seed.items) {
      out.push({
        id: `${seed.category}-${item.slug}`,
        name: item.name,
        description: item.description,
        category: seed.category,
        engine: seed.engine,
        engineWorkflowRef: engineWorkflowRef(seed.engine, seed.category, item.slug),
        trigger: item.trigger,
        tags: [seed.category, seed.engine, item.trigger],
      });
    }
  }

  if (out.length !== 100) {
    throw new Error(`Expected 100 workflows, got ${out.length}`);
  }
  return out;
}

export const workflows: Workflow[] = buildWorkflows();

export function getWorkflow(id: string): Workflow | undefined {
  return workflows.find((w) => w.id === id);
}

export function workflowsByCategory(category: CategoryId): Workflow[] {
  return workflows.filter((w) => w.category === category);
}

export function workflowsByEngine(engine: EngineId): Workflow[] {
  return workflows.filter((w) => w.engine === engine);
}
