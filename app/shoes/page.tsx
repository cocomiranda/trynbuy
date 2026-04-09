"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";
import { shoeCatalog } from "@/lib/shoes";

export default function ShoesPage() {
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
    Object.fromEntries(
      shoeCatalog.map((shoe) => [shoe.slug, shoe.availableSizes[0] ?? ""]),
    ),
  );

  return (
    <main className="min-h-screen bg-[#f5f5f3] px-4 py-5 pb-28 text-stone-950 sm:px-6 sm:py-8 lg:px-10 lg:pb-10">
      <div className="mx-auto max-w-7xl">
        <SiteNav current="shoes" />

        <header className="max-w-4xl py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#1769e8]">
            Shoe catalog
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl leading-[0.95] tracking-[-0.06em] sm:text-5xl lg:text-7xl">
            Find the pair you want to test in the real world.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-stone-600 sm:text-xl sm:leading-9">
            Start from just $5 per day, choose a 3- or 5-day trial, and keep
            the option to buy below standard retail.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {shoeCatalog.map((shoe) => (
            <article
              key={shoe.slug}
              className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_16px_36px_-28px_rgba(28,25,23,0.35)]"
            >
              {!shoe.isAvailable ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/35 backdrop-blur-[3px]">
                  <span className="rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm">
                    Currently unavailable
                  </span>
                </div>
              ) : null}

              <div className={`min-h-60 bg-gradient-to-br ${shoe.gradient} p-6 text-white`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/80">
                      {shoe.brand}
                    </p>
                    <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl tracking-[-0.05em]">
                      {shoe.name}
                    </h2>
                  </div>
                </div>
                <p className="mt-10 max-w-sm text-base leading-7 text-white/90">
                  {shoe.tagline}
                </p>
                <div className="mt-5">
                  <span className="rounded-full bg-black/15 px-3 py-1 text-xs font-medium text-white/90">
                    ~{shoe.trialCount * 30} km used
                  </span>
                </div>
              </div>

              <div className={`${!shoe.isAvailable ? "blur-[0.5px]" : ""} space-y-5 p-6`}>
                <div className="rounded-[1.5rem] bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-stone-500">Choose size</p>
                    <p className="text-sm font-medium text-stone-900">
                      {selectedSizes[shoe.slug]}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {shoe.availableSizes.map((size) => {
                      const isSelected = selectedSizes[shoe.slug] === size;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSelectedSizes((current) => ({
                              ...current,
                              [shoe.slug]: size,
                            }))
                          }
                          className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                            isSelected
                              ? "border-[#1769e8] bg-[#1769e8] text-white"
                              : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="rounded-2xl bg-stone-100 p-3">
                    <p className="text-stone-500">Buy now</p>
                    <p className="mt-1 font-semibold text-stone-900">
                      ${shoe.keepPrice}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={
                        shoe.isAvailable
                          ? `/checkout?shoe=${shoe.slug}&size=${encodeURIComponent(
                              selectedSizes[shoe.slug],
                            )}`
                          : "#"
                      }
                      aria-disabled={!shoe.isAvailable}
                      className={`inline-flex flex-1 items-center justify-center rounded-2xl px-5 py-3 font-semibold transition ${
                        shoe.isAvailable
                          ? "bg-[#1769e8] text-white hover:bg-[#0f5ed8]"
                          : "pointer-events-none bg-[#1769e8] text-white opacity-35"
                      }`}
                    >
                      Buy trial
                    </Link>
                    <Link
                      href={
                        shoe.isAvailable
                          ? `/checkout?shoe=${shoe.slug}&mode=buy&size=${encodeURIComponent(
                              selectedSizes[shoe.slug],
                            )}`
                          : "#"
                      }
                      aria-disabled={!shoe.isAvailable}
                      className={`inline-flex flex-1 items-center justify-center rounded-2xl border px-5 py-3 font-semibold transition ${
                        shoe.isAvailable
                          ? "border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
                          : "pointer-events-none border-stone-300 bg-white text-stone-900 opacity-35"
                      }`}
                    >
                      Buy now ${shoe.keepPrice}
                    </Link>
                  </div>
                  <p className="text-center text-xs text-stone-500 sm:text-right">
                    Retail price ${shoe.retailPrice}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700"
          >
            Home
          </Link>
          <Link
            href="/checkout"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1769e8] px-4 py-3 text-sm font-medium text-white"
          >
            Start Trial
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
