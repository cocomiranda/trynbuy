"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/account";
  }

  return (
    <button
      className="mt-8 inline-flex rounded-full border border-stone-300 bg-white px-5 py-3 font-medium text-stone-900 transition hover:border-stone-500 hover:bg-stone-100"
      onClick={handleSignOut}
      type="button"
    >
      Sign out
    </button>
  );
}
