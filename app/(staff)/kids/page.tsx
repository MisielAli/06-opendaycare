import { requireStaff } from "@/app/lib/auth";
import { KidsPageContent } from "@/components/kids/KidsPageContent";

export default async function KidsPage() {
  await requireStaff("/kids");

  return <KidsPageContent />;
}
