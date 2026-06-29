import {
  insertDemoRecord,
  loadDemoRecords,
  type DemoRecordInsert,
} from "@/lib/demoRecordsApi";
import { runAutomationEngine } from "@/lib/automationEngine";
import { createAutomationActivityEvent } from "@/lib/taskActivity";

const simulationSource = "Company day simulation";

type SimulationRecord = {
  demoType: string;
  title: string;
  status: string;
  rawInput: Record<string, unknown>;
};

const simulationRecords: SimulationRecord[] = [
  {
    demoType: "support_ticket",
    title: "Refund request from Priya Raman",
    status: "New",
    rawInput: {
      customerName: "Priya Raman",
      channel: "Email",
      issueType: "Billing",
      message:
        "This is unacceptable. I was charged twice and need a refund today. I am angry because billing has not answered my complaint.",
      priority: "High",
      receivedDate: "2026-06-29",
      status: "New",
    },
  },
  {
    demoType: "invoice_follow_up",
    title: "Atlas Design overdue invoice INV-2088",
    status: "New",
    rawInput: {
      clientName: "Atlas Design",
      invoiceNumber: "INV-2088",
      amount: "4200",
      dueDate: "2026-06-10",
      paymentStatus: "Unpaid",
      message:
        "Invoice INV-2088 is overdue. The client asked for the payment link but has not confirmed when payment will be sent.",
      source: simulationSource,
      status: "New",
    },
  },
  {
    demoType: "meeting_actions",
    title: "Operations handoff meeting",
    status: "New",
    rawInput: {
      meetingTitle: "Operations handoff meeting",
      meetingDate: "2026-06-29",
      attendees: "Operations, Finance, Support",
      notes:
        "Action: send updated SLA report to the support lead. Follow up with finance on overdue invoice list. Assign owner for vendor quote review. Team agreed to review escalations every morning.",
      source: simulationSource,
      status: "New",
    },
  },
  {
    demoType: "it_request",
    title: "Finance admin access request",
    status: "New",
    rawInput: {
      requesterName: "Jordan Lee",
      department: "Finance",
      requestType: "Account access",
      requestText:
        "Jordan needs admin access to the expense reporting system before month-end close. The request may involve payment data and needs manager approval.",
      priority: "High",
      neededByDate: "2026-07-01",
      source: simulationSource,
      status: "New",
    },
  },
  {
    demoType: "vendor_request",
    title: "Apex Supplies laptop quote",
    status: "New",
    rawInput: {
      vendorName: "Apex Supplies",
      requestType: "Quote",
      message:
        "Vendor sent a quote for replacement laptops and asked for approval this week. Price is 6800 but payment terms are not included.",
      quotedAmount: "6800",
      deliveryDate: "",
      source: simulationSource,
      status: "New",
    },
  },
  {
    demoType: "lead_follow_up",
    title: "Brightline Cafe urgent availability lead",
    status: "New",
    rawInput: {
      name: "Brightline Cafe",
      source: "Website",
      message:
        "Urgent request. We need price and availability today for a booking next week. Please reply ASAP with schedule options.",
      followUpDate: "2026-06-29",
      status: "New",
    },
  },
  {
    demoType: "recruitment_assistant",
    title: "Nina Patel operations coordinator candidate",
    status: "New",
    rawInput: {
      name: "Nina Patel",
      role: "Operations Coordinator",
      source: "Referral",
      applicationDate: "2026-06-29",
      applicationText:
        "Candidate has 5 years of operations experience, managed vendor schedules, led process cleanup work, and supported customer-facing teams.",
      status: "New",
    },
  },
  {
    demoType: "document_intake",
    title: "Office relocation request note",
    status: "New",
    rawInput: {
      title: "Office relocation request note",
      type: "Service request",
      source: simulationSource,
      receivedDate: "2026-06-29",
      content:
        "Please review the office relocation request. Need to update the equipment list, send vendor requirements, confirm space needs, and assign a reviewer.",
      status: "New",
    },
  },
];

function mapSimulationRecord(record: SimulationRecord): DemoRecordInsert {
  return {
    demo_type: record.demoType,
    title: record.title,
    status: record.status,
    source: simulationSource,
    raw_input: JSON.stringify({
      ...record.rawInput,
      source: record.rawInput.source ?? simulationSource,
      simulationSource,
    }),
    internal_notes: null,
    analysis: null,
    analysis_approved: false,
  };
}

async function recordAlreadyExists(record: SimulationRecord) {
  const { data, error } = await loadDemoRecords(record.demoType);

  if (error) {
    throw new Error(
      `Supabase ${record.demoType} duplicate check failed: ${error.message}`,
    );
  }

  return (data ?? []).some(
    (item) => item.title === record.title && item.source === simulationSource,
  );
}

export async function runCompanyDaySimulation() {
  let recordsCreated = 0;
  let recordsSkipped = 0;

  for (const record of simulationRecords) {
    if (await recordAlreadyExists(record)) {
      recordsSkipped += 1;
      continue;
    }

    const { error } = await insertDemoRecord(mapSimulationRecord(record));

    if (error) {
      throw new Error(`Supabase simulation insert failed: ${error.message}`);
    }

    recordsCreated += 1;
  }

  const automation = await runAutomationEngine();
  const responseBody = {
    ok: true,
    runType: "company_day_simulation" as const,
    recordsCreated,
    recordsSkipped,
    automation: {
      recordsScanned: automation.recordsScanned,
      recordsAutoAnalyzed: automation.recordsAutoAnalyzed,
      recordsUpdated: automation.recordsUpdated,
      tasksCreated: automation.tasksCreated,
      tasksUpdated: automation.tasksUpdated,
      duplicatesSkipped: automation.duplicatesSkipped,
    },
  };

  await createAutomationActivityEvent({
    action: "company_day_simulation_run",
    title: "Company day simulation",
    details: responseBody,
  });

  return responseBody;
}
