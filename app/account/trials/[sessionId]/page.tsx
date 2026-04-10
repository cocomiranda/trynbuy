import { redirect } from "next/navigation";

type LegacyTrialDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function LegacyTrialDetailPage({
  params,
}: LegacyTrialDetailPageProps) {
  const { sessionId } = await params;

  redirect(`/account/orders/${sessionId}`);
}
