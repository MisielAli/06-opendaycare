import { requireStaff } from "@/app/lib/auth";
import { getKids, kidRecordToKid } from "@/app/lib/kids";
import { NewPostModal } from "@/components/feed/NewPostModal";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { StaffProvider } from "@/components/staff/StaffProvider";

export default async function StaffLayout({ children }: LayoutProps<"/">) {
  const identity = await requireStaff("/");
  const kidRecords = await getKids();

  return (
    <StaffProvider kids={kidRecords.map(kidRecordToKid)}>
      <div className="flex min-h-screen bg-background">
        <Sidebar identity={identity} />
        <main className="h-screen min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <NewPostModal />
    </StaffProvider>
  );
}
