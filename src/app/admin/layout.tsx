import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
}