export type StepStatus = "done" | "in_progress" | "next" | "later";

export interface ImplStep {
  id: string;
  phase: number;
  title: string;
  status: StepStatus;
  summary: string;
  how: string[];
  urls?: Array<{ label: string; href: string }>;
  doneWhen: string;
}

/**
 * Living checklist for the Master company-automation build.
 * Update `status` as you complete each step.
 */
export const implementationSteps: ImplStep[] = [
  {
    id: "repo",
    phase: 1,
    title: "Create Master repo (Next.js control plane)",
    status: "done",
    summary: "Repo at company-automation with landing, catalog, engines, APIs.",
    how: [
      "Repo already created in this project folder",
      "Stack: Next.js 16 + TypeScript + Tailwind",
      "Run: npm run dev → http://localhost:3000",
    ],
    urls: [{ label: "Master app", href: "http://localhost:3000" }],
    doneWhen: "Landing page loads and shows Master brand + 100 workflows.",
  },
  {
    id: "catalog",
    phase: 1,
    title: "Define 100 workflows across 12 domains",
    status: "done",
    summary: "Catalog maps each workflow to the best engine.",
    how: [
      "Source of truth: src/lib/workflows/catalog.ts",
      "Domains: HR, Recruitment, Invoice, CRM, Email, Slack, WhatsApp, Knowledge Base, Document Parsing, Meeting Summary, Customer Support, Proposal Generator",
      "Each item has engine + engineWorkflowRef for routing",
    ],
    urls: [{ label: "Workflow catalog", href: "/workflows" }],
    doneWhen: "Catalog shows exactly 100 workflows.",
  },
  {
    id: "adapters",
    phase: 1,
    title: "Build engine adapters (n8n, Kestra, Temporal, ActivePieces, Trigger.dev)",
    status: "done",
    summary: "Master talks to each engine through a common adapter interface.",
    how: [
      "Adapters live in src/lib/engines/",
      "Health: GET /api/engines",
      "Run: POST /api/workflows/:id/run",
      "Copy .env.example → .env and fill URLs/keys as you connect each engine",
    ],
    urls: [{ label: "Engines page", href: "/engines" }],
    doneWhen: "Engines page lists all 5 backends with status.",
  },
  {
    id: "app-console",
    phase: 2,
    title: "Company Automation app console (where workflows are used)",
    status: "done",
    summary: "Domain workspaces (HR, CRM, …) to run workflows in context.",
    how: [
      "Open /app for the operations console",
      "Open /app/hr, /app/crm, etc. for domain desks",
      "Run buttons call Master API and write to run history",
    ],
    urls: [
      { label: "App console", href: "/app" },
      { label: "CRM desk", href: "/app/crm" },
    ],
    doneWhen: "You can open a domain and run a workflow from the desk UI.",
  },
  {
    id: "n8n-seed",
    phase: 2,
    title: "Seed n8n workflows (CRM / Email / Slack / WhatsApp)",
    status: "done",
    summary: "33 Live | workflows with unique webhook paths, published and active.",
    how: [
      "docker compose up -d n8n",
      "npm run seed:n8n  (unique Live graphs + import/publish)",
      "Open n8n → look for Live | CRM | Lead capture",
      "Webhook path: /webhook/live-crm-lead-capture",
    ],
    urls: [{ label: "n8n", href: "http://localhost:5678" }],
    doneWhen: "Live | workflows appear in n8n and are Active.",
  },
  {
    id: "n8n-connect",
    phase: 2,
    title: "Connect Master → n8n (live Run via webhooks)",
    status: "done",
    summary: "Master Run hits n8n webhooks for real (demo:false).",
    how: [
      "N8N_BASE_URL=http://localhost:5678 in .env",
      "Open /app/crm → Run Lead capture",
      "Check n8n → Executions for the run",
    ],
    urls: [
      { label: "CRM desk", href: "/app/crm" },
      { label: "Engines", href: "/engines" },
    ],
    doneWhen: "Run from Master returns demo:false and n8n shows an execution.",
  },
  {
    id: "kestra-seed",
    phase: 3,
    title: "Start Kestra + import 10 masters (100 workflows)",
    status: "done",
    summary: "10 masters imported; smoke execution company.operations/master succeeded.",
    how: [
      "docker compose up -d postgres-kestra kestra",
      "Login: admin@master.local / MasterKestra1",
      "npm run generate:kestra && npm run seed:kestra",
      "UI: http://localhost:8080 → Flows → company.* / master",
      "Execute with workflow_key e.g. daily_standup_aggregator",
    ],
    urls: [
      { label: "Kestra UI", href: "http://localhost:8080" },
      { label: "Architecture", href: "/setup" },
    ],
    doneWhen: "All 10 masters visible; one Switch branch execution succeeds.",
  },
  {
    id: "temporal-seed",
    phase: 3,
    title: "Start Temporal + 35 durable workflows",
    status: "done",
    summary: "35 named Temporal workflows running via worker + HTTP bridge :8099.",
    how: [
      "docker compose up -d postgres-temporal temporal temporal-ui",
      "cd temporal-worker && npm install && npm run worker  (terminal 1)",
      "cd temporal-worker && npm run bridge  (terminal 2)",
      "UI: http://localhost:8088 — see smoke-* workflows",
      "POST http://localhost:8099/workflows/start-all-smoke to re-run all 35",
    ],
    urls: [
      { label: "Temporal UI", href: "http://localhost:8088" },
      { label: "Bridge health", href: "http://localhost:8099/health" },
    ],
    doneWhen: "35 workflows visible/completed in Temporal UI.",
  },
  {
    id: "activepieces-seed",
    phase: 3,
    title: "Start ActivePieces bridge (Recruitment / Support)",
    status: "done",
    summary: "Local webhook runner on :8091 for all 17 Recruitment + Support workflows.",
    how: [
      "docker compose up -d ap-bridge",
      "Or: npm run workers:ap",
      "Health: http://localhost:8091/health",
      "ACTIVEPIECES_BASE_URL=http://localhost:8091",
    ],
    urls: [{ label: "AP bridge flows", href: "http://localhost:8091/flows" }],
    doneWhen: "Run from /app/recruitment returns demo:false.",
  },
  {
    id: "trigger-seed",
    phase: 3,
    title: "Start Trigger.dev bridge (Meeting Summary + Proposals)",
    status: "done",
    summary: "Local task runner on :8092 for all 16 Meeting + Proposal workflows.",
    how: [
      "docker compose up -d trigger-bridge",
      "Or: npm run workers:trigger",
      "Optional OPENAI_API_KEY for live summaries/drafts",
      "TRIGGER_API_URL=http://localhost:8092",
    ],
    urls: [{ label: "Trigger bridge tasks", href: "http://localhost:8092/tasks" }],
    doneWhen: "Run from /app/meeting-summary returns demo:false.",
  },
  {
    id: "real-integrations",
    phase: 4,
    title: "Wire real SaaS (Slack, Email, WhatsApp, CRM, Invoice)",
    status: "later",
    summary: "Replace stubs with production credentials and nodes.",
    how: [
      "n8n: connect Gmail, WhatsApp Cloud, CRM; Slack optional",
      "Kestra: connect object storage + invoice PDF pipeline (Stirling-PDF optional)",
      "Temporal: add human-approval signals (email / WhatsApp)",
      "Test each domain desk end-to-end with real payloads",
    ],
    doneWhen: "At least one live path per domain works without demo mode.",
  },
  {
    id: "production",
    phase: 4,
    title: "Deploy Master + engines (GitOps / Harbor / K8s)",
    status: "later",
    summary: "Ship like your other digitalm.cloud projects.",
    how: [
      "Add Dockerfile + k8s manifests under projects/master in personal_remote",
      "ArgoCD Application + ingress master.digitalm.cloud",
      "Secrets via SealedSecrets / ExternalSecrets — never commit .env",
      "Health checks on /api/engines in monitoring",
    ],
    doneWhen: "Public HTTPS URL serves Master and engines are reachable privately.",
  },
];

export function stepsByStatus(status: StepStatus) {
  return implementationSteps.filter((s) => s.status === status);
}
