import Link from "next/link";
import { SignOutButton } from "@/app/components/sign-out-button";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";
import {
  formatOrderDate,
  getOrderStateTag,
  getOrderTypeTag,
  getResolvedTrialEndsAt,
  getTrialDueLabel,
  syncOrderPaymentState,
  getUserOrders,
  type OrderRow,
} from "@/lib/orders";
import { getShoeBySlug } from "@/lib/shoes";
import { getUserProfile } from "@/lib/profiles";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { isConfigured } = getSupabaseConfig();
  const user = isConfigured
    ? (
        await (await getSupabaseServerClient()).auth.getUser()
      ).data.user
    : null;

  let purchases: OrderRow[] = [];
  let profileName: string | null = null;

  if (user?.id) {
    try {
      const [{ data: profile }, { data: orders }] = await Promise.all([
        getUserProfile(user.id),
        getUserOrders(user.id),
      ]);
      profileName = profile?.full_name?.trim() || null;
      purchases = orders
        ? await Promise.all(orders.map((order) => syncOrderPaymentState(order)))
        : [];
    } catch {
      profileName = null;
      purchases = [];
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-5 pb-28 text-stone-900 sm:px-6 sm:py-8 lg:px-10 lg:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <SiteNav current="account" />

        <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_60px_-30px_rgba(41,37,36,0.2)] sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              My account
            </p>

            {!user ? (
              <div className="mt-6 rounded-[1.75rem] border border-stone-900/10 bg-stone-50 p-6">
                <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                  You are not signed in
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
                  Sign in to view your trials, returns, and purchase decisions.
                </p>
                {!isConfigured ? (
                  <p className="mt-4 text-sm text-stone-600">
                    Auth is not configured in this environment yet.
                  </p>
                ) : null}
                <Link
                  href="/login"
                  className="mt-8 inline-flex rounded-full bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.75rem] border border-stone-900/10 bg-stone-50 p-6">
                <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                  Welcome back
                </h1>
                <div className="mt-6 space-y-4">
                  <div className="rounded-[1.25rem] bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                      Name
                    </p>
                    <p className="mt-2 text-lg font-medium text-stone-950">
                      {profileName ||
                        (typeof user.user_metadata?.full_name === "string"
                          ? user.user_metadata.full_name
                          : user.email
                            ? user.email.split("@")[0]
                            : "Not provided")}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                      Email
                    </p>
                    <p className="mt-2 text-lg font-medium text-stone-950">
                      {user.email || "Not available"}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] bg-white p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                        Member since
                      </p>
                      <p className="mt-2 text-lg font-medium text-stone-950">
                        {formatOrderDate(user.created_at)}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                        Account ID
                      </p>
                      <p className="mt-2 break-all text-sm font-medium text-stone-950">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </div>

                <SignOutButton />
              </div>
            )}
          </article>

          <article className="rounded-[2rem] border border-stone-900/10 bg-[#edf4ff] p-6 sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              Purchases
            </p>
            {!user ? (
              <div className="mt-6 rounded-[1.5rem] bg-white/70 p-5">
                <h2 className="text-lg font-semibold">Sign in to view purchases</h2>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Your completed Stripe purchases will appear here once you are
                  logged in.
                </p>
              </div>
            ) : purchases.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] bg-white/70 p-5">
                <h2 className="text-lg font-semibold">No purchases yet</h2>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Once you complete a checkout, your paid orders and trials will
                  show up here.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {purchases.map((purchase) => {
                  const typeTag = getOrderTypeTag(purchase);
                  const stateTag = getOrderStateTag(purchase);
                  const resolvedTrialEndsAt = getResolvedTrialEndsAt(purchase);
                  const isTrial = typeTag === "Trial";
                  const dueLabel = getTrialDueLabel(resolvedTrialEndsAt);
                  const shoe = purchase.shoe_slug
                    ? getShoeBySlug(purchase.shoe_slug)
                    : undefined;
                  const trialAmountPaid =
                    isTrial && shoe
                      ? purchase.trial_fee_paid > 0
                        ? purchase.trial_fee_paid
                        : shoe.trialDailyFee * (purchase.trial_days ?? 5)
                      : purchase.trial_fee_paid;
                  return (
                    <div key={purchase.id} className="rounded-[1.5rem] bg-white/70 p-5">
                      <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/account/orders/${purchase.id}`}
                          className="inline-flex text-lg font-semibold text-stone-950 underline-offset-4 hover:underline"
                        >
                          {purchase.shoe_name || "Order"}
                        </Link>
                        {isTrial ? (
                          <div className="mt-3 min-h-[24px] space-y-1">
                            {purchase.status === "trial_pending_inspection" ||
                            purchase.status === "trial_return_requested" ? (
                              <p className="text-sm leading-6 font-medium text-stone-600">
                                Pending inspection
                              </p>
                            ) : purchase.status === "trial_return_completed" ? (
                              <p className="text-sm leading-6 font-medium text-stone-600">
                                Returned
                              </p>
                            ) : (
                              <p className="text-sm leading-6 text-stone-500">
                                Due date {formatOrderDate(resolvedTrialEndsAt)}{" "}
                                <span className="font-medium text-red-600">
                                  ({dueLabel ?? "ended"})
                                </span>
                              </p>
                            )}
                            <p className="text-sm text-stone-500">
                              {formatOrderDate(purchase.created_at)}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 min-h-[24px]">
                            <p className="text-sm text-stone-500">
                              {formatOrderDate(purchase.created_at)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="min-w-[120px] text-right">
                        <div className="flex flex-col items-end gap-2">
                          <div className="inline-flex rounded-full bg-[#dff0ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1769e8]">
                            {typeTag}
                          </div>
                          <div className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
                            {stateTag}
                          </div>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-stone-950">
                          {typeTag === "Trial"
                            ? `$${trialAmountPaid}`
                            : `$${purchase.buy_price}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
