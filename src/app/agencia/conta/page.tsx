import { Suspense } from "react";
import { AccountView } from "@/components/account/account-view";
import { PageHeader } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeletons";
import { requireRole } from "@/lib/auth";

export default function AgencyAccountPage() {
  return (
    <>
      <PageHeader eyebrow="Minha conta" title="Minha conta" subtitle="Seus dados de acesso e sua senha." />
      <Suspense fallback={<ListSkeleton rows={2} />}>
        <Account />
      </Suspense>
    </>
  );
}

async function Account() {
  return <AccountView user={await requireRole("agency")} />;
}
