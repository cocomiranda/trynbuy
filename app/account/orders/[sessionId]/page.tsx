import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";
import { TrialActions } from "@/app/account/orders/[sessionId]/trial-actions";
import { TrialPhotoUploader } from "@/app/account/orders/[sessionId]/trial-photo-uploader";
import {
  formatOrderDate,
  getTrialDueLabel,
  getUserOrderById,
} from "@/lib/orders";
import { getShoeBySlug } from "@/lib/shoes";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTrialReturnRequest, listTrialPhotos } from "@/lib/trial-photos";

type OrderDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { sessionId } = await params;
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    redirect("/login");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
  }

  const { data: order } = await getUserOrderById(sessionId, user.id);

  if (!order) {
    notFound();
  }

  const isTrial = order.mode === "trial";
  const shoe = order.shoe_slug ? getShoeBySlug(order.shoe_slug) : undefined;
  const upgradeAmount =
    isTrial && order.status === "trial_active" && order.trial_fee_paid && shoe
      ? Math.max(shoe.keepPrice - order.trial_fee_paid, 0)
      : null;
  const beforePhotos =
    isTrial ? await listTrialPhotos({ orderId: sessionId, stage: "before", userId: user.id }) : [];
  const returnPhotos =
    isTrial ? await listTrialPhotos({ orderId: sessionId, stage: "return", userId: user.id }) : [];
  const returnRequest =
    isTrial ? await getTrialReturnRequest({ orderId: sessionId, userId: user.id }) : null;
  const dueLabel = getTrialDueLabel(order.trial_ends_at) ?? "Active";

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-5 pb-28 text-stone-900 sm:px-6 sm:py-8 lg:px-10 lg:pb-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <SiteNav current="account" />
        <Link
          href="/account"
          className="inline-flex w-fit rounded-full border border-stone-900/10 bg-white/80 px-4 py-2 text-sm text-stone-700 transition hover:bg-white"
        >
          Back to account
        </Link>

        <section className="rounded-[2rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_60px_-30px_rgba(41,37,36,0.2)] sm:rounded-[2.5rem] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
                {isTrial ? "Trial details" : "Purchase details"}
              </p>
              <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">
                {order.shoe_name || "Your order"}
              </h1>
            </div>
            <div className="inline-flex rounded-full bg-[#dff0ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1769e8]">
              {isTrial ? "Trial" : "Purchase"}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-stone-50 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                {isTrial ? "Trial fee paid" : "Amount paid"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-stone-950">
                {isTrial ? `$${order.trial_fee_paid}` : `$${order.buy_price}`}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                {isTrial ? "Reserved on" : "Purchased on"}
              </p>
              <p className="mt-2 text-lg font-medium text-stone-950">
                {formatOrderDate(order.created_at)}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                {isTrial ? "Current status" : "Order type"}
              </p>
              <p className="mt-2 text-lg font-medium text-stone-950">
                {isTrial
                  ? returnRequest || order.status === "trial_pending_inspection"
                    ? "Pending inspection"
                    : dueLabel
                  : order.status === "purchase_to_be_delivered"
                    ? "To be delivered"
                    : "Completed purchase"}
              </p>
            </div>
          </div>

          {isTrial ? (
            <>
              <TrialActions
                dueDate={formatOrderDate(order.trial_ends_at)}
                dueLabel={dueLabel}
                initialReturnRequested={Boolean(returnRequest)}
                returnPhotosCount={returnPhotos.length}
                sessionId={sessionId}
                upgradeAmount={upgradeAmount}
                upgradeHref={
                  upgradeAmount !== null && !returnRequest
                    ? `/checkout?shoe=${order.shoe_slug}&mode=upgrade&size=${encodeURIComponent(
                        order.size,
                      )}&trialSession=${order.id}`
                    : undefined
                }
              />

              <TrialPhotoUploader
                beforePhotos={beforePhotos}
                returnPhotos={returnPhotos}
                sessionId={sessionId}
              />
            </>
          ) : (
            <div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
              <h2 className="text-xl font-semibold text-stone-950">
                Purchase summary
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Your order is complete. You can use this view as a quick
                reference for the model, amount paid, and purchase date.
              </p>
            </div>
          )}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
