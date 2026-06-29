import { createDemoRecordsRouteHandlers } from "@/lib/demoRecordsRouteFactory";

const handlers = createDemoRecordsRouteHandlers({
  demoType: "invoice_follow_up",
  invalidRecordMessage:
    "Every invoice record must include a title of at least 3 characters.",
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
