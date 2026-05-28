import { getClientPortalData } from "@/actions/client-portal";
import { ClientPortalView } from "@/components/client-portal/client-portal-view";

export default async function ClientPortalPage() {
  const data = await getClientPortalData();
  return <ClientPortalView {...data} />;
}
