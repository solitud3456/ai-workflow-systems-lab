import {
  createDemoRecordEvent,
  updateDemoRecordAnalysis,
} from "@/lib/demoRecordsApi";
import {
  generateRuleBasedAnalysis,
  type DemoRecordForAnalysis,
} from "@/lib/ruleBasedAnalysis";

export async function autoAnalyzeDemoRecord(record: DemoRecordForAnalysis) {
  const { analysis, analysisApproved } = generateRuleBasedAnalysis(record);
  const { data, error } = await updateDemoRecordAnalysis(
    record.demo_type,
    record.id,
    {
      analysis,
      analysis_approved: analysisApproved,
    },
  );

  if (error) {
    throw new Error(`Supabase analysis update failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Record not found for analysis update.");
  }

  await createDemoRecordEvent({
    demo_record_id: record.id,
    demo_type: record.demo_type,
    action: "record_auto_analyzed",
    title: record.title,
    details: {
      analysisApproved,
      analysisFields: Object.keys(analysis),
      source: "rule_based_analysis",
    },
  });

  return {
    record: data,
    analysis,
    analysisApproved,
  };
}
