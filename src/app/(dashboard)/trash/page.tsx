import { getTrashItems } from "@/actions/trash";
import { TrashView } from "@/components/trash/trash-view";

export default async function TrashPage() {
  const items = await getTrashItems();
  return <TrashView initialItems={items} />;
}
