import CompanyWorkflowDemo from "@/components/demo/CompanyWorkflowDemo";
import { meetingActionsModule } from "@/lib/companyWorkflowModules";

export default function MeetingActionsPage() {
  return <CompanyWorkflowDemo config={meetingActionsModule} />;
}
