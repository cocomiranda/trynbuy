import Link from "next/link";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";
import { getShoeBySlug } from "@/lib/shoes";

type SuccessPageProps = {
  searchParams?: Promise<{
    days?: string;
    mode?: string;
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
  const selectedDays = days === 3 || days === 5 ? days : 5;
  const isTrial = mode === "trial";

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-5 pb-28 text-stone-900 sm:px-6 sm:py-8 lg:px-10 lg:pb-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <SiteNav current="account" />
        <section className="rounded-[2rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_60px_-30px_rgba(41,37,36,0.2)] sm:rounded-[2.5rem] sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
            {isTrial ? "Trial reserved" : "Payment received"}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">
            {isTrial ? "Your trial is confirmed" : "Your order is confirmed"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
            {isTrial
              ? shoe
                ? `Your ${selectedDays}-day ${shoe.name} trial was booked in Stripe test mode.`
                : `Your ${selectedDays}-day trial was booked in Stripe test mode.`
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
