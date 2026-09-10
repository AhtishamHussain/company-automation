/**
 * Generate 10 Kestra master flows (Switch routers) from catalog/workflows-100.yaml
 * Usage: node scripts/generate-kestra-masters.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "kestra", "catalog", "workflows-100.yaml");
const outDir = join(root, "kestra", "masters");
mkdirSync(outDir, { recursive: true });

// Minimal YAML parse for our simple catalog structure
function parseCatalog(text) {
  const departments = [];
  let current = null;
  let inWorkflows = false;
  for (const line of text.split(/\r?\n/)) {
    const dept = line.match(/^\s+-\s+id:\s+(\d+)\s*$/);
    if (dept) {
      current = { id: Number(dept[1]), workflows: [] };
      departments.push(current);
      inWorkflows = false;
      continue;
    }
    if (!current) continue;
    const ns = line.match(/^\s+namespace:\s+(\S+)\s*$/);
    if (ns) current.namespace = ns[1];
    const master = line.match(/^\s+master:\s+(\S+)\s*$/);
    if (master) current.master = master[1];
    if (/^\s+workflows:\s*$/.test(line)) {
      inWorkflows = true;
      continue;
    }
    if (inWorkflows) {
      const wf = line.match(
        /^\s+-\s+\{\s*id:\s*(\d+),\s*key:\s*(\w+),\s*name:\s*(.+?),\s*trigger:\s*(\w+)\s*\}\s*$/,
      );
      if (wf) {
        current.workflows.push({
          id: Number(wf[1]),
          key: wf[2],
          name: wf[3].trim(),
          trigger: wf[4],
        });
      }
    }
  }
  return departments;
}

function branchTasks(wf, namespace) {
  const goals = {
    // Operations highlights from user brief
    daily_standup_aggregator: "Fetch standup data then post to Slack",
    e_sign_contract_tracker: "Track DocuSign/HelloSign webhook events",
    office_inventory_alerts: "Query inventory DB and email low-stock alerts",
    expense_approval_router: "Route expense by amount to manager API",
    system_health_check: "Ping URLs and switch on health status",
    social_media_multi_poster: "Parallel post to LinkedIn/X",
    feedback_sentiment_analyzer: "OpenAI sentiment + If branch",
    calendar_synchronizer: "Sync Google and Outlook calendars",
    guest_wifi_provisioner: "Provision guest Wi-Fi and email codes",
    data_backup_archiver: "Archive and upload weekly backup",
    // HR
    new_hire_onboarding: "Parallel provision Google/Slack/Jira",
    offboarding_deprovisioning: "Parallel revoke tokens and access",
    anniversary_birthday_bot: "Query DB and Slack celebrate",
    time_off_request_router: "If-route leave and update calendar",
    performance_review_scheduler: "Quarterly review email links",
    policy_update_tracker: "Email blast + track acknowledgments",
    referral_reward_tracker: "Payroll API referral reward",
    training_compliance_monitor: "EachSequential overdue trainings",
    equipment_provisioning: "Jira Service Desk ticket",
    org_chart_updater: "Refresh org chart UI from DB",
    // Recruitment
    applicant_auto_responder: "SendGrid/Mailgun auto-reply",
    resume_screening_ai: "PDF extract + OpenAI score",
    interview_booking_linker: "Calendly/Cal.com link",
    interview_feedback_collector: "Delay then SMS feedback request",
    offer_letter_generator: "PDF from template",
    background_check_trigger: "Checkr/Sterling API",
    rejection_email_delayer: "Delay 48h then reject email",
    talent_pool_tagging: "OpenAI tags + DB write",
    job_board_multi_poster: "Parallel job board posts",
    salary_benchmarking: "Salary API sync",
    // Finance
    email_invoice_extractor: "Fetch mail + write invoice files",
    invoice_duplication_checker: "DB dupe If check",
    po_matching_verification: "Switch on PO match",
    erp_ledger_logger: "QuickBooks/Xero post",
    late_payment_escalator: "Friday late payment Slack/email",
    early_bird_discount_alert: "Scan terms with OpenAI",
    tax_compliance_validator: "VAT/Tax ID validation",
    multi_currency_converter: "FX conversion",
    payment_confirmation_sender: "Stripe/bank webhook confirm",
    audit_trail_archiver: "S3 audit archive",
    // CRM
    lead_scoring_engine: "Switch score on lead attributes",
    stale_lead_restarter: "Daily stale lead nudge",
    win_loss_alert_bot: "Slack win/loss alert",
    contact_enrichment_pipeline: "Clearbit/ZoomInfo enrich",
    lost_deal_surveyor: "Deploy lost-deal survey",
    drip_campaign_enroller: "HubSpot/Marketo enroll",
    duplicate_account_merger: "Weekly CRM merge",
    vip_client_flag: "If deal size → VIP alert",
    sales_rep_round_robin: "Assign lead to next rep",
    weekly_activity_reporting_bot: "Friday activity summary",
  };

  const goal = goals[wf.key] || wf.name;
  // Core-only stub that always imports; replace with real plugins later
  return `      ${wf.key}:
        - id: log_${wf.key}
          type: io.kestra.plugin.core.log.Log
          message: |
            [{{ inputs.workflow_key }}] ${wf.id}. ${wf.name}
            Goal: ${goal}
            Namespace: ${namespace}
            Payload: {{ inputs.payload }}
        - id: done_${wf.key}
          type: io.kestra.plugin.core.debug.Return
          format: "OK ${wf.key} — replace this stub with jdbc/openai/http/pdf plugins"`;
}

function renderMaster(dept) {
  const keys = dept.workflows.map((w) => w.key);
  const cases = dept.workflows.map((w) => branchTasks(w, dept.namespace)).join("\n");

  return `id: ${dept.master}
namespace: ${dept.namespace}
description: |
  Master template for ${dept.namespace} (workflows ${dept.workflows[0].id}–${dept.workflows.at(-1).id}).
  Pass inputs.workflow_key to select the variation. Replace stub HTTP/Log with jdbc/openai/pdf/fs plugins.
labels:
  architecture: modular-master
  department: "${dept.id}"
  count: "${dept.workflows.length}"

inputs:
  - id: workflow_key
    type: SELECT
    required: true
    values:
${keys.map((k) => `      - ${k}`).join("\n")}
    description: Which of the 10 department workflows to run
  - id: payload
    type: JSON
    defaults: {}
    description: Dynamic fields for the selected workflow (ids, urls, amounts, etc.)
  - id: callback_url
    type: STRING
    defaults: "https://httpbin.org/post"
    description: Stub integration endpoint (replace with Slack/CRM/ERP URLs)
  - id: dry_run
    type: BOOLEAN
    defaults: true

tasks:
  - id: route
    type: io.kestra.plugin.core.flow.Switch
    value: "{{ inputs.workflow_key }}"
    cases:
${cases}
    defaults:
      - id: unknown_key
        type: io.kestra.plugin.core.log.Log
        level: ERROR
        message: "Unknown workflow_key={{ inputs.workflow_key }}"

triggers: []
`;
}

const raw = readFileSync(catalogPath, "utf8");
const departments = parseCatalog(raw);
if (departments.length !== 10) {
  console.error(`Expected 10 departments, got ${departments.length}`);
  process.exit(1);
}

let total = 0;
for (const dept of departments) {
  if (dept.workflows.length !== 10) {
    console.error(`${dept.namespace} has ${dept.workflows.length} workflows`);
    process.exit(1);
  }
  total += dept.workflows.length;
  const file = join(outDir, `${dept.namespace}.yml`);
  writeFileSync(file, renderMaster(dept), "utf8");
  console.log(`Wrote ${file} (${dept.workflows.length} keys)`);
}

console.log(`\nGenerated ${departments.length} masters covering ${total} workflows`);
console.log("Import: kestra/masters/*.yml → Kestra UI");
