export type WorkflowFieldType = "text" | "textarea" | "select" | "date" | "number";

export type WorkflowFieldConfig = {
  name: string;
  label: string;
  type: WorkflowFieldType;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
  rows?: number;
};

export type WorkflowRecord = {
  id: number;
  status: string;
  analysis?: Record<string, unknown>;
  analysisApproved: boolean;
  [key: string]: unknown;
};

export type WorkflowOutputConfig = {
  title: string;
  field: string;
  buttonLabel: string;
};

export type CompanyWorkflowModuleConfig = {
  key: string;
  demoType: string;
  title: string;
  eyebrow: string;
  description: string;
  route: string;
  apiRoute: string;
  storageKey: string;
  recordNoun: string;
  recordPlural: string;
  createButtonLabel: string;
  titleField: string;
  sourceField: string;
  internalNotesField: string;
  primaryTextField: string;
  statuses: readonly string[];
  fields: readonly WorkflowFieldConfig[];
  detailFields: readonly { label: string; field: string }[];
  listMetaFields: readonly string[];
  initialRecords: WorkflowRecord[];
  sampleAnalysis: Record<string, unknown>;
  promptRole: string;
  promptRules: string;
  jsonShape: Record<string, unknown>;
  output?: WorkflowOutputConfig;
};

export const invoiceFollowUpModule: CompanyWorkflowModuleConfig = {
  key: "invoice",
  demoType: "invoice_follow_up",
  title: "Invoice Follow-up Assistant",
  eyebrow: "Demo",
  description:
    "A manual-AI workflow demo for turning invoice context into payment risk, next actions, and reviewed reminder drafts.",
  route: "/demos/invoice-follow-up",
  apiRoute: "/api/invoice-records",
  storageKey: "ai-workflow-systems-lab-invoices",
  recordNoun: "invoice",
  recordPlural: "invoices",
  createButtonLabel: "Create invoice record",
  titleField: "clientName",
  sourceField: "source",
  internalNotesField: "internalNotes",
  primaryTextField: "message",
  statuses: ["New", "Due soon", "Overdue", "Follow-up", "Paid", "Closed"],
  fields: [
    {
      name: "clientName",
      label: "Client name",
      type: "text",
      required: true,
      placeholder: "Example: Northstar Studio",
    },
    {
      name: "invoiceNumber",
      label: "Invoice number",
      type: "text",
      required: true,
      placeholder: "INV-1042",
    },
    {
      name: "amount",
      label: "Amount",
      type: "number",
      required: true,
      placeholder: "2500",
    },
    {
      name: "dueDate",
      label: "Due date",
      type: "date",
      required: true,
    },
    {
      name: "paymentStatus",
      label: "Payment status",
      type: "select",
      options: ["Unpaid", "Partially paid", "Paid", "Disputed"],
      required: true,
    },
    {
      name: "source",
      label: "Source",
      type: "text",
      placeholder: "Email, accounting export, CRM note...",
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      required: true,
      rows: 5,
      placeholder: "Paste the invoice context or client message...",
    },
    {
      name: "internalNotes",
      label: "Internal notes",
      type: "textarea",
      rows: 4,
      placeholder: "Payment history, account owner, or follow-up context...",
    },
  ],
  detailFields: [
    { label: "Invoice number", field: "invoiceNumber" },
    { label: "Amount", field: "amount" },
    { label: "Due date", field: "dueDate" },
    { label: "Payment status", field: "paymentStatus" },
    { label: "Source", field: "source" },
  ],
  listMetaFields: ["invoiceNumber", "paymentStatus"],
  initialRecords: [
    {
      id: 1,
      clientName: "Northstar Studio",
      invoiceNumber: "INV-1042",
      amount: "2500",
      dueDate: "2026-07-03",
      paymentStatus: "Unpaid",
      message:
        "Invoice INV-1042 is due soon. The client asked for payment details last week but has not confirmed when payment will be sent.",
      source: "Accounting note",
      internalNotes: "Sample invoice record. Check if the payment link was sent.",
      status: "New",
      analysisApproved: false,
    },
  ],
  sampleAnalysis: {
    summary:
      "The client has an unpaid invoice due soon and may need a clear payment reminder with payment details.",
    paymentRisk: "medium",
    urgency: "medium",
    missingInformation: ["Confirmed payment method", "Current client contact"],
    nextAction:
      "Send a polite reminder with invoice number, amount, due date, and payment instructions.",
    suggestedReminder:
      "Hi, just following up on invoice INV-1042 for 2500 due on July 3. Please let me know if you need the payment link resent or if there is anything blocking payment.",
    escalationNeeded: false,
  },
  promptRole:
    "You are helping review an invoice follow-up record for a human finance/admin user.",
  promptRules:
    "Use only the provided record. Do not invent payment history, legal conclusions, or account facts.",
  jsonShape: {
    summary: "short summary",
    paymentRisk: "low | medium | high",
    urgency: "low | medium | high",
    missingInformation: ["..."],
    nextAction: "specific next action",
    suggestedReminder: "short payment follow-up message",
    escalationNeeded: true,
  },
  output: {
    title: "Suggested reminder",
    field: "suggestedReminder",
    buttonLabel: "Copy reminder",
  },
};

export const meetingActionsModule: CompanyWorkflowModuleConfig = {
  key: "meeting",
  demoType: "meeting_actions",
  title: "Meeting Action Assistant",
  eyebrow: "Demo",
  description:
    "A manual-AI workflow demo for turning meeting notes into decisions, action items, and reviewed follow-up tasks.",
  route: "/demos/meeting-actions",
  apiRoute: "/api/meeting-records",
  storageKey: "ai-workflow-systems-lab-meeting-actions",
  recordNoun: "meeting",
  recordPlural: "meetings",
  createButtonLabel: "Create meeting record",
  titleField: "meetingTitle",
  sourceField: "source",
  internalNotesField: "internalNotes",
  primaryTextField: "notes",
  statuses: ["New", "Needs review", "Actions created", "Follow-up", "Closed"],
  fields: [
    {
      name: "meetingTitle",
      label: "Meeting title",
      type: "text",
      required: true,
      placeholder: "Example: Weekly operations sync",
    },
    {
      name: "meetingDate",
      label: "Meeting date",
      type: "date",
      required: true,
    },
    {
      name: "attendees",
      label: "Attendees",
      type: "text",
      placeholder: "Names, teams, or roles",
    },
    {
      name: "source",
      label: "Source",
      type: "text",
      placeholder: "Transcript, notes doc, calendar note...",
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      required: true,
      rows: 7,
      placeholder: "Paste meeting notes, transcript snippets, or decisions...",
    },
    {
      name: "internalNotes",
      label: "Internal notes",
      type: "textarea",
      rows: 4,
      placeholder: "Follow-up context, team notes, or review questions...",
    },
  ],
  detailFields: [
    { label: "Meeting date", field: "meetingDate" },
    { label: "Attendees", field: "attendees" },
    { label: "Source", field: "source" },
  ],
  listMetaFields: ["meetingDate", "attendees"],
  initialRecords: [
    {
      id: 1,
      meetingTitle: "Weekly operations sync",
      meetingDate: "2026-06-26",
      attendees: "Ops, Finance, Support",
      notes:
        "Team agreed to clean up overdue invoice reminders and assign support escalations daily. Finance needs a short report by next Friday.",
      source: "Meeting notes",
      internalNotes: "Sample meeting record. Confirm owners before creating tasks.",
      status: "New",
      analysisApproved: false,
    },
  ],
  sampleAnalysis: {
    summary:
      "The meeting produced follow-up work around invoice reminders, support escalations, and a finance report.",
    decisions: [
      "Daily support escalation review will be tracked.",
      "Finance wants a short report by next Friday.",
    ],
    actionItems: [
      {
        task: "Create overdue invoice reminder list",
        owner: "Finance",
        deadline: "2026-07-03",
      },
      {
        task: "Review support escalations each morning",
        owner: "Support lead",
        deadline: "",
      },
    ],
    missingInformation: ["Named owner for the final finance report"],
    nextAction: "Confirm owners and create follow-up tasks.",
    riskNote: "Some owners are team-level placeholders and should be confirmed.",
  },
  promptRole:
    "You are helping turn meeting notes into structured follow-up for human review.",
  promptRules:
    "Use only the provided notes. Do not invent decisions, owners, deadlines, or commitments.",
  jsonShape: {
    summary: "short summary",
    decisions: ["..."],
    actionItems: [
      {
        task: "action item",
        owner: "person or team",
        deadline: "date or empty",
      },
    ],
    missingInformation: ["..."],
    nextAction: "specific next action",
    riskNote: "what needs attention",
  },
  output: {
    title: "Action items",
    field: "actionItems",
    buttonLabel: "Copy action items",
  },
};

export const itRequestModule: CompanyWorkflowModuleConfig = {
  key: "it",
  demoType: "it_request",
  title: "IT Request Assistant",
  eyebrow: "Demo",
  description:
    "A manual-AI workflow demo for turning internal IT requests into approval checks, next actions, and task checklists.",
  route: "/demos/it-request",
  apiRoute: "/api/it-request-records",
  storageKey: "ai-workflow-systems-lab-it-requests",
  recordNoun: "IT request",
  recordPlural: "IT requests",
  createButtonLabel: "Create IT request",
  titleField: "requesterName",
  sourceField: "source",
  internalNotesField: "internalNotes",
  primaryTextField: "requestText",
  statuses: ["New", "Needs approval", "In progress", "Blocked", "Done", "Closed"],
  fields: [
    {
      name: "requesterName",
      label: "Requester name",
      type: "text",
      required: true,
      placeholder: "Example: Jordan Lee",
    },
    {
      name: "department",
      label: "Department",
      type: "text",
      placeholder: "Finance, Sales, Operations...",
    },
    {
      name: "requestType",
      label: "Request type",
      type: "select",
      required: true,
      options: ["Account access", "Hardware", "Software", "Security", "Bug", "Other"],
    },
    {
      name: "priority",
      label: "Priority",
      type: "select",
      required: true,
      options: ["Low", "Normal", "High"],
    },
    {
      name: "neededByDate",
      label: "Needed by date",
      type: "date",
    },
    {
      name: "source",
      label: "Source",
      type: "text",
      placeholder: "Help desk note, email, Slack request...",
    },
    {
      name: "requestText",
      label: "Request text",
      type: "textarea",
      required: true,
      rows: 6,
      placeholder: "Paste the IT request details...",
    },
    {
      name: "internalNotes",
      label: "Internal notes",
      type: "textarea",
      rows: 4,
      placeholder: "Approver, asset tag, policy context, or technical notes...",
    },
  ],
  detailFields: [
    { label: "Department", field: "department" },
    { label: "Request type", field: "requestType" },
    { label: "Priority", field: "priority" },
    { label: "Needed by", field: "neededByDate" },
    { label: "Source", field: "source" },
  ],
  listMetaFields: ["requestType", "priority"],
  initialRecords: [
    {
      id: 1,
      requesterName: "Jordan Lee",
      department: "Finance",
      requestType: "Account access",
      requestText:
        "Jordan needs access to the expense reporting system before month-end close. The request does not include manager approval yet.",
      priority: "High",
      neededByDate: "2026-07-01",
      source: "Help desk note",
      internalNotes: "Sample IT request. Confirm manager approval.",
      status: "New",
      analysisApproved: false,
    },
  ],
  sampleAnalysis: {
    summary:
      "The requester needs finance system access before month-end, but approval details are missing.",
    requestType: "account access",
    urgency: "high",
    securityRisk: "medium",
    approvalNeeded: true,
    missingInformation: ["Manager approval", "Exact permission level"],
    nextAction:
      "Request manager approval and confirm the permission level before provisioning access.",
    internalChecklist: [
      "Confirm manager approval",
      "Verify requested permission level",
      "Create access ticket for provisioning",
    ],
  },
  promptRole:
    "You are helping triage an internal IT request for human review.",
  promptRules:
    "Use only the provided request. Do not invent approvals, access rights, security facts, or implementation steps.",
  jsonShape: {
    summary: "short summary",
    requestType: "account access | hardware | software | security | bug | other",
    urgency: "low | medium | high",
    securityRisk: "low | medium | high",
    approvalNeeded: true,
    missingInformation: ["..."],
    nextAction: "specific next action",
    internalChecklist: ["..."],
  },
  output: {
    title: "Internal checklist",
    field: "internalChecklist",
    buttonLabel: "Copy checklist",
  },
};

export const vendorRequestModule: CompanyWorkflowModuleConfig = {
  key: "vendor",
  demoType: "vendor_request",
  title: "Vendor Request Assistant",
  eyebrow: "Demo",
  description:
    "A manual-AI workflow demo for turning vendor messages into request summaries, risk signals, and reviewed replies.",
  route: "/demos/vendor-request",
  apiRoute: "/api/vendor-records",
  storageKey: "ai-workflow-systems-lab-vendor-requests",
  recordNoun: "vendor request",
  recordPlural: "vendor requests",
  createButtonLabel: "Create vendor request",
  titleField: "vendorName",
  sourceField: "source",
  internalNotesField: "internalNotes",
  primaryTextField: "message",
  statuses: ["New", "Waiting info", "Under review", "Approved", "Rejected", "Closed"],
  fields: [
    {
      name: "vendorName",
      label: "Vendor name",
      type: "text",
      required: true,
      placeholder: "Example: Apex Supplies",
    },
    {
      name: "requestType",
      label: "Request type",
      type: "select",
      required: true,
      options: ["Quote", "Delivery update", "Contract", "Issue", "Other"],
    },
    {
      name: "quotedAmount",
      label: "Quoted amount",
      type: "number",
      placeholder: "4800",
    },
    {
      name: "deliveryDate",
      label: "Delivery date",
      type: "date",
    },
    {
      name: "source",
      label: "Source",
      type: "text",
      placeholder: "Email, procurement note, vendor portal...",
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      required: true,
      rows: 6,
      placeholder: "Paste the vendor message or request details...",
    },
    {
      name: "internalNotes",
      label: "Internal notes",
      type: "textarea",
      rows: 4,
      placeholder: "Procurement context, budget, approvals, or questions...",
    },
  ],
  detailFields: [
    { label: "Request type", field: "requestType" },
    { label: "Quoted amount", field: "quotedAmount" },
    { label: "Delivery date", field: "deliveryDate" },
    { label: "Source", field: "source" },
  ],
  listMetaFields: ["requestType", "quotedAmount"],
  initialRecords: [
    {
      id: 1,
      vendorName: "Apex Supplies",
      requestType: "Quote",
      message:
        "Vendor sent a quote for replacement office equipment and asked for approval this week. Delivery date is mentioned as flexible but no final terms are attached.",
      quotedAmount: "4800",
      deliveryDate: "",
      source: "Procurement email",
      internalNotes: "Sample vendor request. Confirm budget owner and terms.",
      status: "New",
      analysisApproved: false,
    },
  ],
  sampleAnalysis: {
    summary:
      "The vendor provided a quote that needs review before approval because terms and delivery details are incomplete.",
    requestType: "quote",
    riskLevel: "medium",
    missingInformation: ["Final delivery date", "Complete terms", "Budget owner approval"],
    priceOrTermsMentioned: true,
    nextAction:
      "Ask the vendor to confirm final delivery timing and attach complete terms before internal approval.",
    suggestedReply:
      "Thanks for sending the quote. Before we review it for approval, could you confirm the final delivery timeline and send the complete terms for this order?",
    decisionNeeded: true,
  },
  promptRole:
    "You are helping review a vendor request for a human procurement/admin user.",
  promptRules:
    "Use only the provided request. Do not invent contract terms, pricing, approval status, or vendor commitments.",
  jsonShape: {
    summary: "short summary",
    requestType: "quote | delivery update | contract | issue | other",
    riskLevel: "low | medium | high",
    missingInformation: ["..."],
    priceOrTermsMentioned: true,
    nextAction: "specific next action",
    suggestedReply: "short vendor reply",
    decisionNeeded: true,
  },
  output: {
    title: "Suggested vendor reply",
    field: "suggestedReply",
    buttonLabel: "Copy vendor reply",
  },
};

export const companyWorkflowModules = [
  invoiceFollowUpModule,
  meetingActionsModule,
  itRequestModule,
  vendorRequestModule,
] as const;
