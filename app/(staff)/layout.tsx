import { Sidebar } from "@/components/sidebar/Sidebar";

export default function StaffLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
