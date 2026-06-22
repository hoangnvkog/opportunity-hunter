import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth/auth.service";
import { SavedOpportunitiesService } from "@/services/saved-opportunities/saved-opportunities.service";
import { SavedOpportunitiesList } from "@/components/saved/saved-opportunities-list";
import { AppLayout } from "@/components/layout/AppLayout";

export default async function SavedPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const service = await SavedOpportunitiesService.create();
  const savedOpportunities = await service.getSavedOpportunities(user.id);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Saved Opportunities</h1>
        <SavedOpportunitiesList opportunities={savedOpportunities} />
      </div>
    </AppLayout>
  );
}
