import { BillingSuccessCard } from "@/components/billing/billing-success-card";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    continueTo?: string;
    plan?: string;
    intent?: string;
  }>;
}) {
  const { continueTo, plan, intent } = await searchParams;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#071116_0%,#05090c_100%)] px-6 py-20 text-white sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <BillingSuccessCard
          continueTo={continueTo ?? null}
          planId={plan ?? null}
          intent={intent ?? null}
        />
      </div>
    </main>
  );
}
