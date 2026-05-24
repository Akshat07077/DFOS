import { getClients } from "@/actions/clients";
import { getProfiles } from "@/services/dashboard";
import { ClientsView } from "@/components/clients/clients-view";

export default async function ClientsPage() {
  const [clients, profiles] = await Promise.all([getClients(), getProfiles()]);
  return <ClientsView clients={clients} profiles={profiles} />;
}
