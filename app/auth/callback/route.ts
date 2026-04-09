import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") || "/";
  const loginUrl = new URL("/login", request.url);

  if (!getSupabaseConfig().isConfigured) {
    loginUrl.searchParams.set("error", "config");
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      loginUrl.searchParams.set("error", "oauth");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch {
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl);
  }
}
