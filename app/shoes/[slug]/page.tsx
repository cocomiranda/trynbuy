import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/app/components/site-footer";
import { getShoeBySlug, shoeCatalog } from "@/lib/shoes";

type ShoePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return shoeCatalog.map((shoe) => ({ slug: shoe.slug }));
}

export default async function ShoePage({ params }: ShoePageProps) {
  const { slug } = await params;
  const shoe = getShoeBySlug(slug);

  if (!shoe) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-5 pb-28 text-stone-50 sm:px-6 sm:py-8 lg:px-10 lg:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Link
          href="/"
          className="inline-flex w-fit rounded-full border border-white/10 px-4 py-2 text-sm text-stone-300 transition hover:bg-white/5"
        >
          Back to catalog
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <article
            className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${shoe.gradient} p-5 sm:rounded-[2.5rem] sm:p-8`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                  {shoe.brand}
                </p>
                <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">
                  {shoe.name}
                </h1>
              </div>
              <span className="w-fit rounded-full bg-white/15 px-4 py-2 text-sm">
                {shoe.cushion}
              </span>
            </div>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:mt-8 sm:text-lg sm:leading-8">
              {shoe.description}
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-white/10 p-4">
                <p className="text-sm text-white/70">Ideal runner</p>
                <p className="mt-2 font-semibold">{shoe.runnerType}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/10 p-4">
                <p className="text-sm text-white/70">Allowed surfaces</p>
                <p className="mt-2 font-semibold">{shoe.allowedSurfaces}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/10 p-4">
                <p className="text-sm text-white/70">Available sizes</p>
                <p className="mt-2 font-semibold leading-7">
                  {shoe.availableSizes.join(", ")}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
              Trial economics
            </p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-[1.5rem] bg-white/5 p-5">
                <p className="text-sm text-stone-400">Trial fee</p>
                <p className="mt-2 text-2xl font-semibold sm:text-3xl">
                  ${shoe.trialDailyFee}/day
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-300">
                  Choose a 3- or 5-day trial and only pay for the days you pick.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white/5 p-5">
                <p className="text-sm text-stone-400">Deposit hold</p>
                <p className="mt-2 text-2xl font-semibold sm:text-3xl">${shoe.deposit}</p>
                <p className="mt-2 text-sm leading-7 text-stone-300">
                  Authorized through Stripe and released after inspection if the
                  pair comes back in policy.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-amber-300 p-5 text-stone-950">
                <p className="text-sm text-stone-800">Keep it price</p>
                <p className="mt-2 text-2xl font-semibold sm:text-3xl">${shoe.keepPrice}</p>
                <p className="mt-2 text-sm leading-7 text-stone-800">
                  Lower than the ${shoe.retailPrice} retail tag so choosing to
                  buy feels better than ghosting the return.
                </p>
              </div>
            </div>

            <Link
              href={`/checkout?shoe=${shoe.slug}`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 font-medium text-stone-950 transition hover:bg-stone-200"
            >
              Reserve this trial
            </Link>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
              What you agree to
            </p>
            <div className="mt-5 space-y-3">
              {shoe.rules.map((rule) => (
                <div
                  key={rule}
                  className="rounded-[1.25rem] border border-white/10 px-4 py-3 text-sm leading-7 text-stone-300"
                >
                  {rule}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[#16110d] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
              Return assurance
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {shoe.returnControls.map((control) => (
                <div
                  key={control.title}
                  className="rounded-[1.5rem] bg-white/5 p-5"
                >
                  <h2 className="font-semibold">{control.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-stone-300">
                    {control.description}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
