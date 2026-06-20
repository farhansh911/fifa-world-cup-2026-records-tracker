import { getRecordsCreated } from "@/lib/data";
import { AdminRecordsCreatedClient } from "@/components/admin/AdminRecordsCreated";

export default async function AdminRecordsNewPage() {
  const records = await getRecordsCreated();
  return <AdminRecordsCreatedClient records={records} />;
}
