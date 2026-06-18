import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
export { AppLayout };