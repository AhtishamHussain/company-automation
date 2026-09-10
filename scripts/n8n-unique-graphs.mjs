/**
 * Unique n8n graphs per catalog workflow (no SaaS credentials).
 * Always: Webhook (path live-*) → …domain steps… → pack JSON → Respond to Master
 */
import { randomUUID } from "node:crypto";

function id() {
  return randomUUID();
}

function n(name, type, typeVersion, position, parameters, extra = {}) {
  return { parameters, id: id(), name, type, typeVersion, position, ...extra };
}

function webhook(path) {
  return n(
    "Webhook",
    "n8n-nodes-base.webhook",
    2,
    [0, 240],
    { httpMethod: "POST", path, responseMode: "responseNode", options: {} },
    { webhookId: id() },
  );
}

function respond(position) {
  return n("Respond to Master", "n8n-nodes-base.respondToWebhook", 1.1, position, {
    respondWith: "json",
    responseBody: "={{ $json }}",
    options: {},
  });
}

function code(name, jsCode, position) {
  return n(name, "n8n-nodes-base.code", 2, position, { jsCode });
}

function setNode(name, fields, position) {
  return n(name, "n8n-nodes-base.set", 3.4, position, {
    assignments: {
      assignments: fields.map((f) => ({
        id: id(),
        name: f.name,
        value: f.value,
        type: f.type || "string",
      })),
    },
    options: { includeOtherFields: true },
  });
}

function ifEmpty(name, leftExpr, position) {
  return n(name, "n8n-nodes-base.if", 2.2, position, {
    conditions: {
      options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
      conditions: [
        {
          id: id(),
          leftValue: leftExpr,
          rightValue: "",
          operator: { type: "string", operation: "notEmpty", singleValue: true },
        },
      ],
      combinator: "and",
    },
    options: {},
  });
}

function mergeAppend(name, position) {
  return n(name, "n8n-nodes-base.merge", 3.1, position, { mode: "append" });
}

function unwrap(label, position) {
  return code(
    label,
    `const raw = $input.first().json || {};
const body = (raw.body && typeof raw.body === 'object' && !Array.isArray(raw.body))
  ? { ...raw, ...raw.body } : raw;
return [{ json: { ...raw, ...body } }];`,
    position,
  );
}

function pack(ctx, note, position) {
  return code(
    `Finish ${ctx.slug}`,
    `const j = $input.first().json || {};
return [{ json: {
  ok: true,
  engine: 'n8n',
  masterWorkflowId: '${ctx.masterId}',
  engineWorkflowRef: '${ctx.path}',
  category: '${ctx.category}',
  action: '${ctx.slug}',
  message: 'Master ${ctx.category}/${ctx.slug} completed on n8n',
  detail: j,
  integration: { provider: '${ctx.category}-flow', status: 'accepted', note: ${JSON.stringify(note)}, at: new Date().toISOString() }
}}];`,
    position,
  );
}

function conn(from, to, outIndex = 0, inIndex = 0) {
  return { from, to, outIndex, inIndex };
}

function assemble(nodes, links) {
  const connections = {};
  for (const l of links) {
    if (!connections[l.from]) connections[l.from] = { main: [] };
    const mains = connections[l.from].main;
    while (mains.length <= l.outIndex) mains.push([]);
    mains[l.outIndex].push({ node: l.to, type: "main", index: l.inIndex || 0 });
  }
  return { nodes, connections, settings: { executionOrder: "v1" } };
}

function flow(ctx, middle, links, respondPos = [1400, 240]) {
  const wh = webhook(ctx.path);
  const rs = respond(respondPos);
  const nodes = [wh, ...middle, rs];
  return {
    name: `Live | ${ctx.category.toUpperCase()} | ${ctx.name}`,
    ...assemble(nodes, links),
  };
}

/** IF true/false then merge then pack */
function ifFlow(ctx, unwrapName, ifName, leftExpr, yesName, noName, yesVal, noVal, note) {
  const u = unwrap(unwrapName, [260, 240]);
  const iff = ifEmpty(ifName, leftExpr, [520, 240]);
  const yes = setNode(yesName, yesVal, [780, 80]);
  const no = setNode(noName, noVal, [780, 400]);
  const join = mergeAppend("Join paths", [1040, 240]);
  const p = pack(ctx, note, [1280, 240]);
  return flow(
    ctx,
    [u, iff, yes, no, join, p],
    [
      conn("Webhook", unwrapName),
      conn(unwrapName, ifName),
      conn(ifName, yesName, 0),
      conn(ifName, noName, 1),
      conn(yesName, "Join paths", 0, 0),
      conn(noName, "Join paths", 0, 1),
      conn("Join paths", p.name),
      conn(p.name, "Respond to Master"),
    ],
  );
}

function lineFlow(ctx, steps, note) {
  const nodes = [];
  const links = [conn("Webhook", steps[0].name)];
  let prev = "Webhook";
  for (let i = 0; i < steps.length; i++) {
    nodes.push(steps[i]);
    if (i > 0) links.push(conn(prev, steps[i].name));
    prev = steps[i].name;
  }
  const p = pack(ctx, note, [260 + steps.length * 260, 240]);
  nodes.push(p);
  links.push(conn(prev, p.name), conn(p.name, "Respond to Master"));
  return flow(ctx, nodes, links, [520 + steps.length * 260, 240]);
}

function graphs(ctx) {
  const k = `${ctx.category}-${ctx.slug}`;

  const table = {
    "crm-lead-capture": () =>
      ifFlow(
        ctx,
        "Read website form",
        "Email present?",
        "={{ $json.email }}",
        "Create CRM lead",
        "Queue for sales assist",
        [
          { name: "crmAction", value: "create_lead" },
          { name: "stage", value: "new" },
        ],
        [{ name: "crmAction", value: "manual_review" }],
        "Website form → create or review lead",
      ),
    "crm-deal-stage-sync": () =>
      lineFlow(
        ctx,
        [
          unwrap("Read deal payload", [260, 80]),
          code(
            "Map pipeline stages",
            `const j=$input.first().json||{};
const stage=String(j.stage||j.dealStage||'unknown');
const map={new:'qualified',qualified:'proposal',proposal:'negotiation',won:'closed-won',lost:'closed-lost'};
return [{json:{...j, fromStage:stage, toStage:map[stage]||stage, synced:true}}];`,
            [540, 80],
          ),
          setNode("Write stage to CRM stub", [{ name: "crmObject", value: "deal" }], [820, 80]),
          code(
            "Confirm both systems",
            `const j=$input.first().json||{}; return [{json:{...j, systems:['crm','billing'], okSync:true}}];`,
            [1100, 80],
          ),
        ],
        "Keep CRM stages aligned across tools",
      ),
    "crm-account-enrich": () =>
      lineFlow(
        ctx,
        [
          unwrap("Read account", [260, 400]),
          setNode(
            "Pull company domain",
            [{ name: "domain", value: "={{ $json.company || $json.email || 'unknown' }}" }],
            [540, 400],
          ),
          code(
            "Firmographic stub",
            `const j=$input.first().json||{};
return [{json:{...j, industry:'software', employees:50, enricher:'stub-clearbit'}}];`,
            [820, 400],
          ),
          setNode("Score account", [{ name: "fitScore", value: "72", type: "number" }], [1100, 400]),
        ],
        "Enrich company record from firmographics",
      ),
    "crm-stale-deal-nudge": () =>
      ifFlow(
        ctx,
        "Read opportunity",
        "Aging deal?",
        "={{ $json.company }}",
        "Nudge owner",
        "Skip healthy deal",
        [
          { name: "nudge", value: "true" },
          { name: "channel", value: "owner-email" },
        ],
        [{ name: "nudge", value: "false" }],
        "Alert owners on aging opportunities",
      ),
    "crm-contact-dedupe": () =>
      lineFlow(
        ctx,
        [
          unwrap("Load contacts batch", [260, 560]),
          code(
            "Normalize names",
            `const j=$input.first().json||{};
const name=String(j.name||'').toLowerCase().trim();
return [{json:{...j, normName:name, fingerprint:name+'|'+(j.email||'')}}];`,
            [540, 560],
          ),
          code(
            "Find duplicate keys",
            `const j=$input.first().json||{};
return [{json:{...j, duplicate: Boolean(j.email), mergePolicy:'keep-oldest'}}];`,
            [820, 560],
          ),
          setNode("Safe merge stub", [{ name: "merged", value: "queued" }], [1100, 560]),
        ],
        "Merge duplicate contacts safely",
      ),
    "crm-won-deal-handoff": () =>
      lineFlow(
        ctx,
        [
          unwrap("Read closed-won", [260, 20]),
          setNode("Mark deal won", [{ name: "stage", value: "won" }], [500, 20]),
          code(
            "Create onboarding tasks",
            `const j=$input.first().json||{};
return [{json:{...j, tasks:['kickoff','billing','it-access']}}];`,
            [760, 20],
          ),
          setNode("Hand to CS", [{ name: "queue", value: "onboarding" }], [1040, 20]),
        ],
        "Create onboarding tasks after close-won",
      ),
    "crm-lost-reason-log": () =>
      ifFlow(
        ctx,
        "Read lost deal",
        "Reason filled?",
        "={{ $json.text }}",
        "Store loss reason",
        "Require reason",
        [{ name: "logged", value: "true" }],
        [{ name: "logged", value: "blocked" }],
        "Require and summarize loss reasons",
      ),
    "crm-pipeline-snapshot": () =>
      lineFlow(
        ctx,
        [
          unwrap("Read snapshot request", [260, 160]),
          code(
            "Tally pipeline",
            `const j=$input.first().json||{};
return [{json:{...j, open:12, won:3, lost:2, coverage:1.4}}];`,
            [540, 160],
          ),
          setNode("Format metrics", [{ name: "report", value: "daily-pipeline" }], [820, 160]),
          code(
            "Attach to digest",
            `const j=$input.first().json||{}; return [{json:{...j, delivered:'metrics-stub'}}];`,
            [1100, 160],
          ),
        ],
        "Daily pipeline metrics snapshot",
      ),
    "crm-crm-backup": () =>
      lineFlow(
        ctx,
        [
          unwrap("Start backup job", [260, 320]),
          code(
            "Export contacts",
            `return [{json:{...($input.first().json||{}), tables:['contacts','deals']}}];`,
            [540, 320],
          ),
          code(
            "Serialize JSON",
            `const j=$input.first().json||{}; return [{json:{...j, bytes:2048, format:'json'}}];`,
            [820, 320],
          ),
          setNode("Store archive stub", [{ name: "location", value: "s3://crm-backup/stub" }], [1100, 320]),
        ],
        "Nightly CRM export to object storage",
      ),

    "email-welcome-sequence": () =>
      lineFlow(
        ctx,
        [
          unwrap("New user event", [260, 100]),
          setNode("Email 1 · Welcome", [{ name: "template", value: "welcome-1" }], [520, 40]),
          setNode("Email 2 · Product tour", [{ name: "template", value: "welcome-2" }], [780, 100]),
          setNode("Email 3 · Ask invite", [{ name: "template", value: "welcome-3" }], [1040, 160]),
        ],
        "Multi-step welcome emails (Gmail node later)",
      ),
    "email-inbox-triage": () =>
      ifFlow(
        ctx,
        "Read inbound mail",
        "Looks like support?",
        "={{ $json.subject }}",
        "Label Support",
        "Label General",
        [{ name: "mailboxLabel", value: "support" }],
        [{ name: "mailboxLabel", value: "general" }],
        "Label and route shared inbox mail",
      ),
    "email-bounce-handler": () =>
      lineFlow(
        ctx,
        [
          unwrap("Bounce webhook", [260, 480]),
          code(
            "Parse DSN",
            `const j=$input.first().json||{}; return [{json:{...j, bounceType: j.text?'hard':'soft'}}];`,
            [540, 480],
          ),
          setNode("Suppress address", [{ name: "suppressed", value: "true" }], [820, 480]),
          setNode("Update CRM email status", [{ name: "crmEmail", value: "invalid" }], [1100, 480]),
        ],
        "Suppress bounced addresses in CRM",
      ),
    "email-digest-daily": () =>
      lineFlow(
        ctx,
        [
          unwrap("Digest trigger", [260, 200]),
          code(
            "Collect sections",
            `const j=$input.first().json||{}; return [{json:{...j, sections:['hr','sales','ops']}}];`,
            [500, 120],
          ),
          code(
            "Render HTML stub",
            `const j=$input.first().json||{}; return [{json:{...j, html:'<h1>Daily digest</h1>'}}];`,
            [760, 200],
          ),
          setNode("Send digest stub", [{ name: "to", value: "={{ $json.email || 'team@company' }}" }], [1040, 280]),
        ],
        "Compile and send team digests",
      ),
    "email-cold-outreach": () =>
      lineFlow(
        ctx,
        [
          unwrap("Sequence start", [260, 0]),
          setNode("Check suppression list", [{ name: "allowed", value: "true" }], [520, 0]),
          setNode("Personalize first touch", [{ name: "template", value: "cold-1" }], [780, 80]),
          setNode("Schedule follow-up", [{ name: "day", value: "3" }], [1040, 0]),
        ],
        "Compliant sequenced outreach",
      ),
    "email-reply-detect": () =>
      ifFlow(
        ctx,
        "Read mailbox event",
        "Human reply?",
        "={{ $json.text }}",
        "Stop sequence",
        "Keep sequence",
        [{ name: "sequence", value: "stopped" }],
        [{ name: "sequence", value: "running" }],
        "Stop sequences on human reply",
      ),
    "email-newsletter-send": () =>
      lineFlow(
        ctx,
        [
          unwrap("Campaign payload", [260, 360]),
          code(
            "Load segment",
            `const j=$input.first().json||{}; return [{json:{...j, recipients:120, segment:'active'}}];`,
            [540, 360],
          ),
          setNode("Render newsletter", [{ name: "template", value: "newsletter" }], [820, 300]),
          setNode("Send batch stub", [{ name: "provider", value: "gmail-or-resend" }], [1100, 360]),
        ],
        "Segment and send newsletters",
      ),
    "email-email-to-ticket": () =>
      lineFlow(
        ctx,
        [
          unwrap("Support mailbox", [260, 520]),
          code(
            "Extract ticket fields",
            `const j=$input.first().json||{};
return [{json:{...j, ticketTitle:j.subject||j.name||'New ticket', priority:'normal'}}];`,
            [540, 520],
          ),
          setNode("Open ticket stub", [{ name: "ticketId", value: "T-1001" }], [820, 520]),
          setNode("Ack sender", [{ name: "autoReply", value: "received" }], [1100, 520]),
        ],
        "Convert support mail into tickets",
      ),

    "slack-incident-alert": () =>
      ifFlow(
        ctx,
        "Read alert payload",
        "Severity critical?",
        "={{ $json.severity }}",
        "Page #incidents",
        "Log to #ops",
        [{ name: "page", value: "true" }],
        [{ name: "page", value: "false" }],
        "Page channel on critical alerts (Slack node later)",
      ),
    "slack-approval-button": () =>
      ifFlow(
        ctx,
        "Read interaction",
        "Approved?",
        "={{ $json.text }}",
        "Apply approval",
        "Record rejection",
        [{ name: "decision", value: "approve" }],
        [{ name: "decision", value: "reject" }],
        "Approve/reject via Slack interactions",
      ),
    "slack-standup-prompt": () =>
      lineFlow(
        ctx,
        [
          unwrap("Standup schedule", [260, 240]),
          setNode("Build prompt", [{ name: "question", value: "What did you ship?" }], [520, 180]),
          setNode("Post to channel stub", [{ name: "channel", value: "#standup" }], [780, 240]),
          code(
            "Collect replies stub",
            `const j=$input.first().json||{}; return [{json:{...j, collected:0}}];`,
            [1040, 300],
          ),
        ],
        "Daily standup reminders and collection",
      ),
    "slack-new-hire-announce": () =>
      lineFlow(
        ctx,
        [
          unwrap("Hire record", [260, 60]),
          setNode("Compose welcome", [{ name: "text", value: "Please welcome our new teammate" }], [540, 60]),
          setNode("Post #general stub", [{ name: "channel", value: "#general" }], [820, 140]),
          setNode("Invite to teams", [{ name: "groups", value: "eng,people" }], [1100, 60]),
        ],
        "Welcome message on start date",
      ),
    "slack-deal-won-celebrate": () =>
      lineFlow(
        ctx,
        [
          unwrap("Won deal event", [260, 440]),
          code(
            "Format celebration",
            `const j=$input.first().json||{}; return [{json:{...j, banner:'🎉 Deal won '+ (j.company||'')}}];`,
            [540, 440],
          ),
          setNode("Post #sales stub", [{ name: "channel", value: "#sales" }], [820, 440]),
          setNode("Add emoji reactions", [{ name: "reactions", value: "tada,fire" }], [1100, 440]),
        ],
        "Post wins to sales channel",
      ),
    "slack-oncall-rotate": () =>
      lineFlow(
        ctx,
        [
          unwrap("Rotation tick", [260, 280]),
          code(
            "Compute next on-call",
            `const roster=['alex','sam','riley'];
const j=$input.first().json||{};
return [{json:{...j, oncall: roster[new Date().getDay()%3]}}];`,
            [540, 280],
          ),
          setNode("Update @oncall group", [{ name: "group", value: "oncall" }], [820, 200]),
          setNode("Announce rotation", [{ name: "channel", value: "#oncall" }], [1100, 280]),
        ],
        "Update on-call group weekly",
      ),
    "slack-feedback-poll": () =>
      lineFlow(
        ctx,
        [
          unwrap("Poll request", [260, 120]),
          setNode("Build poll blocks", [{ name: "options", value: "yes,no,later" }], [540, 120]),
          setNode("Post poll stub", [{ name: "channel", value: "#feedback" }], [820, 200]),
          code(
            "Tally stub",
            `return [{json:{...($input.first().json||{}), votes:0}}];`,
            [1100, 120],
          ),
        ],
        "Run lightweight Slack polls",
      ),
    "slack-channel-archive": () =>
      ifFlow(
        ctx,
        "Scan channels",
        "Inactive?",
        "={{ $json.channel }}",
        "Archive channel stub",
        "Keep channel",
        [{ name: "archive", value: "true" }],
        [{ name: "archive", value: "false" }],
        "Archive inactive project channels",
      ),

    "whatsapp-order-status": () =>
      lineFlow(
        ctx,
        [
          unwrap("Order event", [260, 40]),
          code(
            "Pick template",
            `const j=$input.first().json||{};
const status=j.stage||j.status||'processing';
return [{json:{...j, waTemplate:'order_'+status}}];`,
            [540, 40],
          ),
          setNode("Fill template vars", [{ name: "orderId", value: "={{ $json.company || 'ORD-1' }}" }], [820, 120]),
          setNode("Send WhatsApp stub", [{ name: "provider", value: "whatsapp-cloud" }], [1100, 40]),
        ],
        "Send order status updates on WhatsApp",
      ),
    "whatsapp-appointment-remind": () =>
      lineFlow(
        ctx,
        [
          unwrap("Calendar due", [260, 200]),
          setNode("When is appointment", [{ name: "hoursAhead", value: "24" }], [540, 200]),
          code(
            "Build reminder text",
            `const j=$input.first().json||{}; return [{json:{...j, body:'Reminder: appointment tomorrow'}}];`,
            [820, 120],
          ),
          setNode("Send reminder stub", [{ name: "to", value: "={{ $json.to || $json.phone }}" }], [1100, 200]),
        ],
        "Remind customers before appointments",
      ),
    "whatsapp-support-handoff": () =>
      ifFlow(
        ctx,
        "Read WhatsApp chat",
        "Needs human?",
        "={{ $json.text }}",
        "Route to agent",
        "Bot can continue",
        [{ name: "queue", value: "agents" }],
        [{ name: "queue", value: "bot" }],
        "Route WhatsApp chats to agents",
      ),
    "whatsapp-otp-delivery": () =>
      lineFlow(
        ctx,
        [
          unwrap("OTP request", [260, 360]),
          code(
            "Generate code stub",
            `const j=$input.first().json||{};
return [{json:{...j, otp: String(100000+Math.floor(Math.random()*900000))}}];`,
            [540, 360],
          ),
          setNode("Use OTP template", [{ name: "template", value: "otp_verify" }], [820, 360]),
          setNode("Send OTP stub", [{ name: "channel", value: "whatsapp" }], [1100, 440]),
        ],
        "Deliver verification codes",
      ),
    "whatsapp-broadcast-optin": () =>
      lineFlow(
        ctx,
        [
          unwrap("Broadcast job", [260, 500]),
          code(
            "Filter opted-in",
            `const j=$input.first().json||{}; return [{json:{...j, audience:80, skipped:5}}];`,
            [540, 500],
          ),
          setNode("Pick campaign template", [{ name: "template", value: "broadcast_optin" }], [820, 420]),
          setNode("Send compliant blast stub", [{ name: "policy", value: "opt-in-only" }], [1100, 500]),
        ],
        "Compliant broadcast to opted-in lists",
      ),
    "whatsapp-payment-link": () =>
      lineFlow(
        ctx,
        [
          unwrap("Invoice event", [260, 80]),
          setNode("Build payment URL stub", [{ name: "link", value: "https://pay.example/stub" }], [540, 80]),
          setNode("Attach to template", [{ name: "template", value: "payment_link" }], [820, 160]),
          setNode("Send on WhatsApp stub", [{ name: "provider", value: "whatsapp-cloud" }], [1100, 80]),
        ],
        "Send invoice payment links",
      ),
    "whatsapp-feedback-request": () =>
      lineFlow(
        ctx,
        [
          unwrap("Ticket closed", [260, 260]),
          setNode("Wait window stub", [{ name: "minutes", value: "30" }], [540, 260]),
          setNode("CSAT template", [{ name: "template", value: "csat_1to5" }], [820, 180]),
          setNode("Ask on WhatsApp stub", [{ name: "to", value: "={{ $json.to }}" }], [1100, 260]),
        ],
        "Ask for CSAT after resolution",
      ),
    "whatsapp-lead-qualify": () =>
      lineFlow(
        ctx,
        [
          unwrap("Inbound WhatsApp", [260, 420]),
          code(
            "Ask qualifying questions",
            `const j=$input.first().json||{};
return [{json:{...j, questions:['budget','timeline','authority']}}];`,
            [540, 420],
          ),
          setNode("Score answers stub", [{ name: "score", value: "60" }], [820, 500]),
          setNode("Push to CRM stub", [{ name: "crm", value: "lead" }], [1100, 420]),
        ],
        "Qualifying questions via WhatsApp",
      ),
  };

  const fn = table[k];
  if (!fn) throw new Error(`No unique graph for ${k}`);
  return fn();
}

export function buildUnique(category, slug, name) {
  return graphs({
    category,
    slug,
    name,
    masterId: `${category}-${slug}`,
    path: `live-${category}-${slug}`,
  });
}
