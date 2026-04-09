"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNav } from "@/app/components/site-nav";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"error" | "info">("info");
  const isSignup = mode === "signup";
  const { isConfigured } = getSupabaseConfig();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isConfigured) {
      setFeedbackTone("error");
      setFeedback("Add your Supabase URL and anon key first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      setFeedbackTone("info");

      const supabase = getSupabaseBrowserClient();

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          setFeedbackTone("error");
          setFeedback(error.message);
          return;
        }

        if (data.session) {
          window.location.href = "/";
          return;
        }

        setFeedbackTone("info");
        setFeedback("Account created. Check your email to confirm your sign-up.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFeedbackTone("error");
        setFeedback(error.message);
        return;
      }

      window.location.href = "/";
    } catch {
      setFeedbackTone("error");
      setFeedback("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-5 pb-28 text-stone-900 sm:px-6 sm:py-8 lg:px-10 lg:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <SiteNav current="account" />

        <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_60px_-30px_rgba(41,37,36,0.2)] sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              {isSignup ? "Sign up" : "Login"}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
              {isSignup
                ? "Create your account to start trials, manage returns, and keep the pairs that feel right."
                : "Sign in to track active trials, review return windows, and manage purchases from one place."}
            </p>

            {!isConfigured ? (
              <div className="mt-6 rounded-[1.5rem] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to start using real
                auth.
              </div>
            ) : null}

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
              {isSignup ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">
                    Name
                  </span>
                  <input
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                    onChange={(event) => setName(event.target.value)}
                    required
                    value={name}
                  />
                </label>
              ) : null}
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Email</span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Password
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {feedback ? (
                <div
                  className={`-mt-1 text-sm ${
                    feedbackTone === "error"
                      ? "font-medium text-red-600"
                      : "font-medium text-[#14213d]"
                  }`}
                >
                  {feedback}
                </div>
              ) : null}
              {!isSignup ? (
                <div className="-mt-1 text-sm text-stone-600">
                  <Link href="/" className="transition hover:text-stone-900">
                    Forgot password?
                  </Link>
                </div>
              ) : null}

              <button
                className="mt-8 w-full rounded-full bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? "Please wait..."
                  : isSignup
                    ? "Create account"
                    : "Login"}
              </button>
            </form>

            {isSignup ? (
              <p className="mt-4 text-center text-sm text-stone-600">
                Existing user?{" "}
                <button
                  className="font-medium text-stone-900"
                  onClick={() => setMode("login")}
                  type="button"
                >
                  Login
                </button>
              </p>
            ) : (
              <p className="mt-4 text-center text-sm text-stone-600">
                New user?{" "}
                <button
                  className="font-medium text-stone-900"
                  onClick={() => setMode("signup")}
                  type="button"
                >
                  Sign up
                </button>
              </p>
            )}
          </article>

          <article className="rounded-[2rem] border border-stone-900/10 bg-[#edf4ff] p-6 sm:rounded-[2.5rem] sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
              Your account
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-[1.5rem] bg-white/70 p-5">
                <h2 className="text-lg font-semibold">Track trial windows</h2>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  See exactly when each pair needs to be returned or converted
                  into a purchase.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white/70 p-5">
                <h2 className="text-lg font-semibold">Manage returns</h2>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Upload photos, confirm condition, and keep your return process
                  smooth.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white/70 p-5">
                <h2 className="text-lg font-semibold">Keep what feels right</h2>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Upgrade a trial into a purchase without starting checkout from
                  scratch.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
