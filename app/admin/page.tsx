import { adminInventory, adminRentals } from "@/lib/shoes";
import { SiteFooter } from "@/app/components/site-footer";

const actions = [
  "Release deposit after manual inspection",
  "Capture 20 to 100% of deposit for damage or no return",
  "Approve extension for high-intent runners",
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#16110d] px-4 py-5 text-stone-50 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
              Admin operations
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">
              Review trials, protect inventory, and close the loop fast.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base sm:leading-8">
              This dashboard models the operational layer behind the MVP:
              returns, partial deposit capture, inventory quality, and active
              trial oversight.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {actions.map((action, index) => (
                <div
                  key={action}
                  className="rounded-[1.75rem] bg-white/5 p-5"
                >
                  <p className="text-sm text-stone-400">Action {index + 1}</p>
                  <p className="mt-3 text-sm leading-7 text-stone-200">
                    {action}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[#f1e5d0] p-5 text-stone-900 sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              Business pulse
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-white/80 p-5">
                <p className="text-sm text-stone-500">Expected avg. profit</p>
                <p className="mt-2 text-3xl font-semibold sm:text-4xl">$12 to $21</p>
              </div>
              <div className="rounded-[1.75rem] bg-white/80 p-5">
                <p className="text-sm text-stone-500">Break-even path</p>
                <p className="mt-2 text-3xl font-semibold sm:text-4xl">Month 2-3</p>
              </div>
              <div className="rounded-[1.75rem] bg-white/80 p-5">
                <p className="text-sm text-stone-500">Initial inventory</p>
                <p className="mt-2 text-3xl font-semibold sm:text-4xl">10 to 20 pairs</p>
              </div>
              <div className="rounded-[1.75rem] bg-white/80 p-5">
                <p className="text-sm text-stone-500">Initial capital</p>
                <p className="mt-2 text-3xl font-semibold sm:text-4xl">$2.5k</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
                  Active rentals
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl tracking-tight sm:text-4xl">
                  Current trial queue
                </h2>
              </div>
              <div className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm text-emerald-300">
                3 live trials
              </div>
            </div>

            <div className="mt-8 hidden overflow-hidden rounded-[2rem] border border-white/10 md:block">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/5 text-stone-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Runner</th>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">Mileage</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-stone-950/20">
                  {adminRentals.map((rental) => (
                    <tr key={rental.runner}>
                      <td className="px-4 py-4 text-stone-200">{rental.runner}</td>
                      <td className="px-4 py-4 text-stone-200">{rental.shoe}</td>
                      <td className="px-4 py-4 text-stone-300">{rental.km}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-stone-200">
                          {rental.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-stone-300">
                        {rental.decision}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-4 md:hidden">
              {adminRentals.map((rental) => (
                <article
                  key={rental.runner}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-stone-100">{rental.runner}</h3>
                      <p className="mt-1 text-sm text-stone-400">{rental.shoe}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-stone-200">
                      {rental.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-stone-950/40 p-3">
                      <p className="text-stone-400">Mileage</p>
                      <p className="mt-1 text-stone-200">{rental.km}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-950/40 p-3">
                      <p className="text-stone-400">Decision</p>
                      <p className="mt-1 text-stone-200">{rental.decision}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
              Inventory health
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl tracking-tight sm:text-4xl">
              Shoe-by-shoe condition
            </h2>

            <div className="mt-8 space-y-4">
              {adminInventory.map((item) => (
                <div
                  key={item.model}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{item.model}</h3>
                      <p className="mt-1 text-sm text-stone-400">
                        {item.stock} pairs in rotation
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-200 px-3 py-1 text-sm text-stone-900">
                      {item.condition}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 text-sm text-stone-300 sm:flex-row sm:items-center sm:justify-between">
                    <span>Most requested size: {item.bestSize}</span>
                    <span>Last inspection: {item.lastInspection}</span>
                  </div>
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
