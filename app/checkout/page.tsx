import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";
import { getAccountOrders } from "@/lib/account-orders";
import { getShoeBySlug, getTrialPrice, shoeCatalog } from "@/lib/shoes";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type CheckoutPageProps = {
  searchParams?: Promise<{
    days?: string;
    mode?: string;
    size?: string;
    shoe?: string;
    trialSession?: string;
  }>;
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  if (!getSupabaseConfig().isConfigured) {
    redirect("/login");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const slug = resolvedSearchParams?.shoe;
  const mode = resolvedSearchParams?.mode;
  const sizeParam = resolvedSearchParams?.size;
  const trialSessionId = resolvedSearchParams?.trialSession;
  const daysParam = Number(resolvedSearchParams?.days);
  const selectedDays = daysParam === 3 || daysParam === 5 ? daysParam : 5;
  const shoe = slug ? getShoeBySlug(slug) ?? shoeCatalog[0] : shoeCatalog[0];
  const trialFee = getTrialPrice(selectedDays, shoe.trialDailyFee);
  const isBuyNow = mode === "buy";
  const isUpgrade = mode === "upgrade";
  const selectedSize = shoe.availableSizes.includes(sizeParam ?? "")
    ? (sizeParam as string)
    : shoe.availableSizes[0];
  const returnExample =
    selectedDays === 3
      ? "Example: if your pair arrives on Monday, return it by Thursday 00:00."
      : "Example: if your pair arrives on Monday, return it by Saturday 00:00.";
  const userEmail = user.email;
  const orders = await getAccountOrders(userEmail);
  const selectedTrial =
    isUpgrade && trialSessionId
      ? orders.find(
          (order) =>
            order.id === trialSessionId &&
            order.type === "Trial" &&
            order.isActiveTrial,
        )
      : null;

  if (isUpgrade && (!selectedTrial || selectedTrial.shoeSlug !== shoe.slug)) {
    redirect("/account");
  }

  const trialPaid = selectedTrial?.amount ?? 0;
  const upgradeAmount = Math.max(shoe.keepPrice - trialPaid, 0);
  const checkoutMode = isUpgrade ? "upgrade" : isBuyNow ? "buy" : "trial";
  const effectiveSize = isUpgrade ? (selectedTrial?.size ?? selectedSize) : selectedSize;

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-5 pb-28 text-stone-900 sm:px-6 sm:py-8 lg:px-10 lg:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <SiteNav />
        <Link
          href="/shoes"
          className="inline-flex w-fit rounded-full border border-stone-900/10 bg-white/80 px-4 py-2 text-sm text-stone-700 transition hover:bg-white"
        >
          Back
        </Link>

        <form
          action="/api/stripe/checkout"
          className="grid gap-6 lg:grid-cols-[1fr_0.95fr]"
          id="checkout-form"
          method="POST"
        >
          <input name="mode" type="hidden" value={checkoutMode} />
          <input name="shoe" type="hidden" value={shoe.slug} />
          {isUpgrade && selectedTrial ? (
            <input name="trialSession" type="hidden" value={selectedTrial.id} />
          ) : null}
          {!isBuyNow && !isUpgrade ? (
            <input name="days" type="hidden" value={String(selectedDays)} />
          ) : null}
          <article className="rounded-[2rem] border border-stone-900/10 bg-white p-5 shadow-[0_18px_60px_-30px_rgba(41,37,36,0.2)] sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              {isUpgrade ? "Complete purchase" : isBuyNow ? "Buy now" : "Checkout"}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">
              {isUpgrade
                ? `Keep your ${shoe.name}`
                : isBuyNow
                ? `Buy your ${shoe.name} today`
                : `Reserve your ${shoe.name} trial`}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
              {isUpgrade
                ? `You already paid $${trialPaid} for the trial. Pay the remaining $${upgradeAmount} now to keep the pair.`
                : isBuyNow
                ? "Buy directly at the discounted Try ’n Buy price, without starting a trial."
                : `Start from just $${shoe.trialDailyFee} per day, choose 3 or 5 days, and keep the option to buy later at a discount.`}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Email
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  defaultValue={userEmail}
                  name="email"
                  readOnly
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Size</span>
                {isUpgrade ? (
                  <>
                    <input name="size" type="hidden" value={effectiveSize} />
                    <input
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-700 outline-none"
                      readOnly
                      value={effectiveSize}
                    />
                  </>
                ) : (
                  <select
                    defaultValue={selectedSize}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                    name="size"
                  >
                    {shoe.availableSizes.map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>
                )}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  {isBuyNow || isUpgrade ? "Delivery date" : "Start date"}
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  defaultValue="2026-04-12"
                  name="deliveryDate"
                  type="date"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Delivery city
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  defaultValue="London"
                  name="city"
                />
              </label>
              {!isBuyNow && !isUpgrade ? (
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-7 text-stone-600 md:col-span-2">
                  We recommend using a credit card for the deposit. Debit cards
                  may temporarily hold funds from your balance.
                </div>
              ) : null}
              {!isBuyNow && !isUpgrade ? (
                <label id="trial-length" className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-stone-700">
                    Trial length
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[3, 5].map((days) => (
                      <Link
                        key={days}
                        href={`/checkout?shoe=${shoe.slug}&days=${days}&size=${encodeURIComponent(
                          selectedSize,
                        )}#trial-length`}
                        className={`rounded-2xl border px-4 py-4 ${
                          selectedDays === days
                            ? "border-[#1769e8] bg-[#edf4ff]"
                            : "border-stone-200 bg-stone-50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-stone-900">
                          {days}-day trial
                        </p>
                        <p className="mt-1 text-base text-stone-600">
                          Just ${shoe.trialDailyFee}/day
                        </p>
                      </Link>
                    ))}
                  </div>
                </label>
              ) : null}
            </div>

            {!isUpgrade ? (
              <div className="mt-8 rounded-[2rem] bg-stone-950 p-6 text-stone-50">
                <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
                  Payment plan
                </p>
                {isBuyNow ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-white/5 p-4">
                    <p className="text-sm text-stone-400">Pay now</p>
                    <p className="mt-2 font-semibold">${shoe.keepPrice} total</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-white/5 p-4">
                    <p className="text-sm text-stone-400">Shipping</p>
                    <p className="mt-2 font-semibold">Free both ways</p>
                  </div>
                </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.25rem] bg-white/5 p-4">
                      <p className="text-sm text-stone-400">1. Trial cost</p>
                      <p className="mt-2 font-semibold">${shoe.trialDailyFee}/day</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white/5 p-4">
                      <p className="text-sm text-stone-400">2. Pay today</p>
                      <p className="mt-2 font-semibold">${trialFee}</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white/5 p-4">
                      <p className="text-sm text-stone-400">3. Guarantee hold</p>
                      <p className="mt-2 font-semibold">
                        ${shoe.deposit} (not charged)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </article>

          <aside className="rounded-[2rem] border border-stone-900/10 bg-[#efe3cc] p-5 sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              Order summary
            </p>
            <div className="mt-6 rounded-[2rem] bg-white/65 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-stone-500">{shoe.brand}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{shoe.name}</h2>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm text-stone-700">
                {isUpgrade ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Selected size</span>
                      <span>{effectiveSize}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Keep price</span>
                      <span>${shoe.keepPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Trial already paid</span>
                      <span>-${trialPaid}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-200 pt-3 font-semibold text-stone-900">
                      <span>Pay now</span>
                      <span>${upgradeAmount}</span>
                    </div>
                  </>
                ) : isBuyNow ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Selected size</span>
                      <span>{selectedSize}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Try ’n Buy price</span>
                      <span>${shoe.keepPrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Retail price</span>
                      <span>${shoe.retailPrice}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-200 pt-3 font-semibold text-stone-900">
                      <span>You save</span>
                      <span>${shoe.retailPrice - shoe.keepPrice}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Selected size</span>
                      <span>{selectedSize}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Trial rate</span>
                      <span>${shoe.trialDailyFee}/day</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Trial length</span>
                      <span>{selectedDays} days</span>
                    </div>
                    <div className="text-xs leading-6 text-stone-500">
                      {returnExample}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Guarantee hold</span>
                      <span>${shoe.deposit} (not charged)</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-200 pt-3 font-semibold text-stone-900">
                      <span>Pay now</span>
                      <span>${trialFee}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {!isBuyNow && !isUpgrade ? (
                <div className="rounded-[1.25rem] border border-stone-900/10 bg-white/60 px-4 py-3 text-sm leading-7 text-stone-700">
                  <strong>
                    <em>
                      Guarantee hold is released after inspection, usually within
                      24-48h.
                    </em>
                  </strong>
                </div>
              ) : null}
              {!isUpgrade
                ? shoe.rules.slice(1, 3).map((rule) => (
                <div
                  key={rule}
                  className="rounded-[1.25rem] border border-stone-900/10 bg-white/60 px-4 py-3 text-sm leading-7 text-stone-700"
                >
                  {rule}
                </div>
                ))
                : null}
            </div>

            <button
              className="mt-8 w-full rounded-full bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700"
              type="submit"
            >
              {isUpgrade
                ? `Buy now for $${upgradeAmount}`
                : isBuyNow
                  ? `Buy now for $${shoe.keepPrice}`
                  : "Start your trial"}
            </button>

            <p className="mt-4 text-sm leading-7 text-stone-600">
              {isUpgrade
                ? `You already paid $${trialPaid}. Stripe will only charge the remaining $${upgradeAmount} now.`
                : isBuyNow
                ? "You will be redirected to Stripe test checkout to complete this purchase."
                : "You pay $" +
                  trialFee +
                  " today. Guarantee hold automation is coming next."}
            </p>
            {isBuyNow || isUpgrade ? (
              <p className="mt-2 text-sm leading-7 text-stone-600">
                Use Stripe test card details there to complete the payment flow.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-7 text-stone-600">
                This Stripe step currently charges the trial fee only. The
                guarantee hold is not automated yet.
              </p>
            )}
          </aside>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-900/10 bg-[#f4efe6]/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
              {isUpgrade ? "Due today" : isBuyNow ? "Due today" : "Starts at"}
            </p>
            <p className="truncate font-semibold text-stone-900">
              {isUpgrade
                ? `$${upgradeAmount} remaining`
                : isBuyNow
                ? `$${shoe.keepPrice} total`
                : `$${shoe.trialDailyFee}/day, $${shoe.deposit} hold`}
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white"
            formAction="/api/stripe/checkout"
            form="checkout-form"
            formMethod="POST"
            type="submit"
          >
            {isUpgrade ? "Buy now" : "Checkout"}
          </button>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
