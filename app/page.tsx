import Link from "next/link";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-emerald-500"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 12.3l2.2 2.2 4.8-5.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7 text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 7.2 12 11.5l7.5-4.3M12 11.5V21"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7 text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7 text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 7.5h4.5V3M17.2 9A7 7 0 1 0 19 13.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const steps = [
  {
    title: "1. Choose & Receive",
    description:
      "Pick your shoes, choose your trial period, and get them delivered.",
    icon: BoxIcon,
  },
  {
    title: "2. Test Them Out",
    description:
      "Run in real conditions on your usual routes and get a proper feel for the pair.",
    icon: SparkIcon,
  },
  {
    title: "3. Decide",
    description:
      "Keep them at a discount or send them back if they are not the right fit.",
    icon: RefreshIcon,
  },
];

const smartChoiceCards = [
  {
    title: "Traditional Retail",
    price: "$150",
    subtitle: "Full price, no testing",
    details: [
      "Pay everything upfront",
      "No real-world trial",
      "Higher risk of the wrong fit",
    ],
    tone: "plain",
  },
  {
    title: "Trial Only",
    price: "$25",
    subtitle: "$5/day for a 5-day trial",
    details: [
      "Low-commitment way to test",
      "Run in your real routine",
      "Return if it is not the right fit",
    ],
    tone: "soft",
  },
  {
    title: "Trial + Buy",
    price: "$135",
    subtitle: "$25 trial + $110 to keep them",
    details: [
      "Starts at $5/day",
      "Most confidence before buying",
      "Better value than standard retail",
    ],
    tone: "featured",
  },
  {
    title: "Buy Now",
    price: "$140",
    subtitle: "Fast direct-buy pricing",
    details: [
      "Skip the trial period",
      "Best for impatient runners",
      "Good if you already know the shoe",
      "Still below standard retail",
    ],
    tone: "plain",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] text-stone-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-10 lg:pb-10">
        <SiteNav current="home" />

        <div className="flex flex-1 flex-col justify-center py-10 sm:py-16">
          <div className="max-w-4xl">
            <h1 className="font-[family-name:var(--font-heading)] text-[3.25rem] leading-[0.9] tracking-[-0.06em] text-stone-950 sm:text-[4.5rem] lg:text-[5.8rem]">
              You&apos;re not buying shoes.{" "}
              <span className="text-[#1769e8]">You&apos;re buying confidence.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-600 sm:text-2xl sm:leading-10">
              Test premium running shoes in real conditions for 5 days. Return
              them if they don&apos;t feel right, or keep them at a discount.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shoes"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1769e8] px-6 py-4 text-base font-semibold text-white shadow-[0_12px_30px_-18px_rgba(23,105,232,0.9)] transition hover:bg-[#0f5ed8]"
            >
              Browse Shoes
              <span className="ml-3 text-lg">→</span>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white px-6 py-4 text-base font-semibold text-stone-900 transition hover:bg-stone-50"
            >
              How It Works
            </Link>
          </div>

          <div className="mt-10 flex flex-col gap-4 text-sm text-stone-600 sm:flex-row sm:flex-wrap sm:gap-8 sm:text-xl">
            <div className="flex items-center gap-3">
              <CheckIcon />
              <span>Free shipping both ways</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon />
              <span>No questions asked returns</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-t border-stone-200 bg-white px-4 py-20 sm:px-6 lg:px-10 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-4xl tracking-[-0.05em] sm:text-6xl">
              How It Works
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-stone-500 sm:text-2xl">
              Three simple steps to find your perfect running shoes
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-10">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="rounded-[2rem] bg-[#f7f7f7] px-6 py-8 text-center"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1769e8] shadow-[0_18px_34px_-20px_rgba(23,105,232,0.9)]">
                    <Icon />
                  </div>
                  <h3 className="mt-7 font-[family-name:var(--font-heading)] text-3xl tracking-[-0.04em]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-lg leading-8 text-stone-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-[#f5f5f3] px-4 py-20 pb-28 sm:px-6 lg:px-10 lg:py-28 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-4xl tracking-[-0.05em] sm:text-6xl">
              The Smart Choice
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-stone-500 sm:text-2xl">
              Buying through Try ’n Buy is always cheaper than retail when you
              want confidence first.
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-sm text-stone-500 sm:text-base">
              Example shown below: a $150 shoe with a 5-day trial at $5/day.
            </p>
          </div>

          <div className="mt-12 grid gap-5 xl:grid-cols-4">
            {smartChoiceCards.map((card) => (
              <article
                key={card.title}
                className={`rounded-[2rem] border p-7 shadow-[0_18px_40px_-28px_rgba(28,25,23,0.25)] sm:p-8 ${
                  card.tone === "featured"
                    ? "border-[#1769e8]/20 bg-[#edf4ff]"
                    : card.tone === "soft"
                      ? "border-[#d3fb0d]/30 bg-[#fbffe8]"
                      : "border-stone-300 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <p
                    className={`text-2xl font-semibold tracking-[-0.04em] ${
                      card.tone === "featured" ? "text-[#1769e8]" : "text-stone-700"
                    }`}
                  >
                    {card.title}
                  </p>
                  {card.tone === "featured" ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                      Best Value
                    </span>
                  ) : null}
                </div>

                <p className="mt-8 text-6xl font-bold tracking-[-0.07em] text-stone-950">
                  {card.price}
                </p>
                <p className="mt-2 text-lg leading-8 text-stone-500">
                  {card.subtitle}
                </p>

                <div className="mt-10 space-y-4 text-lg text-stone-800">
                  {card.details.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      {card.title === "Traditional Retail" ? (
                        <span className="pt-0.5 text-xl text-red-500">×</span>
                      ) : (
                        <span className="pt-0.5">
                          <CheckIcon />
                        </span>
                      )}
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
