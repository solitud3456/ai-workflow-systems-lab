import CompanyWorkflowDemo from "@/components/demo/CompanyWorkflowDemo";
import { invoiceFollowUpModule } from "@/lib/companyWorkflowModules";

export default function InvoiceFollowUpPage() {
  return <CompanyWorkflowDemo config={invoiceFollowUpModule} />;
}
