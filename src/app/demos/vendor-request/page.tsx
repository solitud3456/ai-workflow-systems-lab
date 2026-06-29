import CompanyWorkflowDemo from "@/components/demo/CompanyWorkflowDemo";
import { vendorRequestModule } from "@/lib/companyWorkflowModules";

export default function VendorRequestPage() {
  return <CompanyWorkflowDemo config={vendorRequestModule} />;
}
