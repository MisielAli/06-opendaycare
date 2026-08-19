import { requireStaff } from "@/app/lib/auth";
import { getKids, getRooms, kidRecordToKid } from "@/app/lib/kids";
import { KidsPageContent } from "@/components/kids/KidsPageContent";

export default async function KidsPage() {
  await requireStaff("/kids");

  const [rooms, kidRecords] = await Promise.all([getRooms(), getKids()]);

  return (
    <KidsPageContent rooms={rooms} kids={kidRecords.map(kidRecordToKid)} />
  );
}
