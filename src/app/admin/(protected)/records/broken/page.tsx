import { getRecordsBroken } from "@/lib/data";
import { AdminRecordsBrokenClient } from "@/components/admin/AdminRecordsBroken";

export default async function AdminRecordsBrokenPage() {
  const records = await getRecordsBroken();
  return <AdminRecordsBrokenClient records={records} />;
}
