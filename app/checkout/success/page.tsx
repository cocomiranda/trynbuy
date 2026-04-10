import Link from "next/link";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";
import { createOrderEvent, finalizePaidOrder, getUserOrderById } from "@/lib/orders";
import { getShoeBySlug } from "@/lib/shoes";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SuccessPageProps = {
  searchParams?: Promise<{
    days?: string;
    mode?: string;
    orderId?: string;
    session_id?: string;
    shoe?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const shoe = resolvedSearchParams?.shoe
    ? getShoeBySlug(resolvedSearchParams.shoe)
    : undefined;
  const mode = resolvedSearchParams?.mode;
  const days = Number(resolvedSearchParams?.days);
  const orderId = resolvedSearchParams?.orderId;
  const sessionId = resolvedSearchParams?.session_id;
  const selectedDays = days === 3 || days === 5 ? days : 5;
  const isTrial = mode === "trial";
  const isUpgrade = mode === "upgrade";

  if (getSupabaseConfig().isConfigured && orderId && sessionId) {
    try {
      const supabase = await getSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: order } = await getUserOrderById(orderId, user.id);

        if (order?.status === "checkout_pending") {
          const stripe = getStripeClient();
          const session = await stripe.checkout.sessions.retrieve(sessionId);

          if (session.payment_status === "paid") {
            const paymentIntentId =
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id;
            const email =
              session.customer_details?.email ?? session.customer_email ?? null;

            if (mode === "trial") {
              const trialStartDate =
                typeof order.metadata?.deliveryDate === "string"
                  ? new Date(`${order.metadata.deliveryDate}T00:00:00Z`)
                  : new Date(session.created * 1000);
              const safeTrialStartDate = Number.isNaN(trialStartDate.getTime())
                ? new Date(session.created * 1000)
                : trialStartDate;
              const trialStartedAt = safeTrialStartDate.toISOString();
              const trialEndsAt = new Date(
                safeTrialStartDate.getTime() +
                  (order.trial_days ?? selectedDays) * 24 * 60 * 60 * 1000,
              ).toISOString();
              const trialFeePaid = (session.amount_total ?? 0) / 100;

              await finalizePaidOrder({
                deliveryStatus: "delivered",
                inspectionStatus: "not_started",
                orderId,
                paymentIntentId,
                remainingBuyAmount: Math.max(order.buy_price - trialFeePaid, 0),
                status: "trial_active",
                stripeCheckoutSessionId: session.id,
                stripeCustomerEmail: email,
                trialEndsAt,
                trialFeePaid,
                trialStartedAt,
                userId: user.id,
              });

              await createOrderEvent({
                orderId,
                payload: {
                  checkoutSessionId: session.id,
                  source: "success_page_fallback",
                },
                type: "trial_activated",
                userId: user.id,
              });
            } else if (mode === "upgrade") {
              await finalizePaidOrder({
                deliveryStatus: "delivered",
                inspectionStatus: "not_required",
                orderId,
                paymentIntentId,
                remainingBuyAmount: 0,
                status: "trial_converted_to_purchase",
                stripeCheckoutSessionId: session.id,
                stripeCustomerEmail: email,
                trialEndsAt: order.trial_ends_at,
                trialFeePaid: order.trial_fee_paid,
                trialStartedAt: order.trial_started_at,
                userId: user.id,
              });

              await createOrderEvent({
                orderId,
                payload: {
                  checkoutSessionId: session.id,
                  source: "success_page_fallback",
                },
                type: "trial_upgraded",
                userId: user.id,
              });
            } else {
              await finalizePaidOrder({
                deliveryStatus: "pending",
                inspectionStatus: "not_required",
                orderId,
                paymentIntentId,
                remainingBuyAmount: 0,
                status: "purchase_to_be_delivered",
                stripeCheckoutSessionId: session.id,
                stripeCustomerEmail: email,
                userId: user.id,
              });

              await createOrderEvent({
                orderId,
                payload: {
                  checkoutSessionId: session.id,
                  source: "success_page_fallback",
                },
                type: "purchase_paid",
                userId: user.id,
              });
            }
          }
        }
      }
    } catch {
      // If the webhook already handled the update or retrieval fails, keep the success
      // page usable and let the webhook remain the primary source of truth.
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-5 pb-28 text-stone-900 sm:px-6 sm:py-8 lg:px-10 lg:pb-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <SiteNav current="account" />
        <section className="rounded-[2rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_60px_-30px_rgba(41,37,36,0.2)] sm:rounded-[2.5rem] sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
            {isTrial
              ? "Trial reserved"
              : isUpgrade
                ? "Purchase completed"
                : "Payment received"}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">
            {isTrial
              ? "Your trial is confirmed"
              : isUpgrade
                ? "You kept the pair"
                : "Your order is confirmed"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
            {isTrial
              ? shoe
                ? `Your ${selectedDays}-day ${shoe.name} trial was booked in Stripe test mode.`
                : `Your ${selectedDays}-day trial was booked in Stripe test mode.`
              : isUpgrade
                ? shoe
                  ? `Your remaining balance for ${shoe.name} was paid in Stripe test mode.`
                  : "Your remaining balance was paid in Stripe test mode."
              : shoe
                ? `Your ${shoe.name} purchase went through in Stripe test mode.`
                : "Your purchase went through in Stripe test mode."}
          </p>
          {isTrial ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
              The trial fee was charged. The guarantee hold is still not
              automated yet.
            </p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700"
            >
              Go to my account
            </Link>
            <Link
              href="/shoes"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 font-medium text-stone-900 transition hover:bg-stone-50"
            >
              Back to shoes
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
