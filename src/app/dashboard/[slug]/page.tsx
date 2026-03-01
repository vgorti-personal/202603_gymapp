import { DashboardClient } from "@/components/dashboard/dashboard-client";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Params }) {
  const { slug } = await params;
  return <DashboardClient slug={slug} />;
}
