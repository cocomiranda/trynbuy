import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";
import {
  formatAccountTimestamp,
  getAccountOrders,
} from "@/lib/account-orders";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type TrialDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function TrialDetailPage({
  params,
}: TrialDetailPageProps) {
  const { sessionId } = await params;
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    redirect("/login");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const orders = await getAccountOrders(user.email);
  const trial = orders.find(
    (order) => order.id === sessionId && order.type === "Trial",
  );

  if (!trial) {
    notFound();
  }

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
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              Trial details
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl tracking-tight sm:text-5xl">
              {trial.model || "Your trial"}
            </h1>
            <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
              Keep track of your return window and upload condition photos from
              this view.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {trial.dueLabel} · Due date {trial.dueDate}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-stone-50 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                  Trial fee paid
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-950">
                  {trial.amount ? `$${trial.amount}` : "Paid"}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-stone-50 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                  Reserved on
                </p>
                <p className="mt-2 text-lg font-medium text-stone-950">
                  {formatAccountTimestamp(trial.created)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-stone-50 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                  Usage guidance
                </p>
                <p className="mt-2 text-lg font-medium text-stone-950">
                  Run only on approved surfaces and keep the pair ready for
                  return inspection.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
              <h2 className="text-xl font-semibold text-stone-950">
                Upload condition photos
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Add a few clear photos before your first run and again before
                return so inspection stays simple and fair.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-4">
                  <span className="text-sm font-medium text-stone-900">
                    Before photos
                  </span>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Toe box, outsole, heel, and side profile.
                  </p>
                  <input
                    className="mt-4 block w-full text-sm text-stone-600"
                    multiple
                    type="file"
                  />
                </label>
                <label className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-4">
                  <span className="text-sm font-medium text-stone-900">
                    Return photos
                  </span>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Upload these when you are ready to send the pair back.
                  </p>
                  <input
                    className="mt-4 block w-full text-sm text-stone-600"
                    multiple
                    type="file"
                  />
                </label>
              </div>

              <button
                className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700"
                type="button"
              >
                Save photos
              </button>
              <p className="mt-3 text-sm text-stone-500">
                This is an MVP upload UI for now. The next step would be wiring
                these files into Supabase Storage.
              </p>
            </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
