import { NextResponse } from "next/server";
import { getShoeBySlug } from "@/lib/shoes";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ purchases: [] }, { status: 401 });
    }

    const stripe = getStripeClient();
    const sessions = await stripe.checkout.sessions.list({ limit: 50 });

    const purchases = sessions.data
      .filter((session) => {
        const sessionEmail =
          session.customer_details?.email ?? session.customer_email ?? "";

        return (
          session.mode === "payment" &&
          session.payment_status === "paid" &&
          session.metadata?.mode === "buy_now" &&
          sessionEmail.toLowerCase() === user.email?.toLowerCase()
        );
      })
      .map((session) => {
        const shoe = getShoeBySlug(session.metadata?.shoe ?? "");

        return {
          amount: session.amount_total ? session.amount_total / 100 : null,
          created: session.created,
          id: session.id,
          model: shoe ? `${shoe.brand} ${shoe.name}` : session.metadata?.shoe,
          size: session.metadata?.size || "Not provided",
          status: session.payment_status,
        };
      })
      .sort((left, right) => right.created - left.created);

    return NextResponse.json({ purchases });
  } catch {
    return NextResponse.json(
      { message: "We could not load purchases right now.", purchases: [] },
      { status: 500 },
    );
  }
}
