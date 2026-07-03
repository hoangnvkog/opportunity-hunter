export const dynamic = "force-dynamic";

import { AppLayout } from "@/components/layout/AppLayout";
import { ValidatedOpportunitiesTable } from "@/components/validation/validated-opportunities-table";
import { getUser } from "@/lib/auth/server";

export default async function ValidatedDashboardPage() {
  const user = await getUser();

  return (
    <AppLayout>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Validated Opportunities</h1>
        <p className="text-muted-foreground mt-1">
          Opportunities with validation score ≥ 70 are considered worth building.
        </p>
      </div>

      <ValidatedOpportunitiesTable userId={user?.id || null} />
    </AppLayout>
  );
}