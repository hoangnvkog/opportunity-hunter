import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OpportunityDetail } from "@/components/OpportunityDetail";
import { findOpportunityByIdAction } from "@/actions/opportunities.actions";

interface OpportunityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityPageProps) {
  const { id } = await params;

  let opportunity;
  try {
    opportunity = await findOpportunityByIdAction(id);
  } catch (error) {
    if (error instanceof Error && error.message === "Opportunity not found") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <OpportunityDetail opportunity={opportunity} />
        </main>
      </div>
    </div>
  );
}
