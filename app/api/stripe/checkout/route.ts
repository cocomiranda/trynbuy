import { NextResponse } from "next/server";
import {
  createOrder,
  createOrderEvent,
  getUserOrderById,
  updateOrderCheckoutData,
} from "@/lib/orders";
import { getShoeBySlug } from "@/lib/shoes";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!getSupabaseConfig().isConfigured) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const shoeSlug = String(formData.get("shoe") ?? "");
  const size = String(formData.get("size") ?? "");
  const email = user.email;
  const addressLine1 = String(formData.get("addressLine1") ?? "");
  const addressLine2 = String(formData.get("addressLine2") ?? "");
  const city = String(formData.get("city") ?? "");
  const postcode = String(formData.get("postcode") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const days = Number(formData.get("days") ?? 5);
  const trialSessionId = String(formData.get("trialSession") ?? "");

  const shoe = getShoeBySlug(shoeSlug);

  if (!shoe) {
    return NextResponse.redirect(new URL("/shoes", request.url));
  }

  const selectedDays = days === 3 || days === 5 ? days : 5;
  const isBuyNow = mode === "buy";
  const isTrial = mode === "trial";
  const isUpgrade = mode === "upgrade";

  if (!isBuyNow && !isTrial && !isUpgrade) {
    return NextResponse.redirect(
      new URL(`/checkout?shoe=${shoeSlug}`, request.url),
    );
  }

  const stripe = getStripeClient();
  let priceId: string | undefined;
  let unitAmount = (isBuyNow
    ? shoe.keepPrice
    : shoe.trialDailyFee * selectedDays) * 100;
  let upgradeTrialAmount = 0;
  let orderId: string | null = null;

  if (isBuyNow && shoe.stripeProductId) {
    const product = await stripe.products.retrieve(shoe.stripeProductId, {
      expand: ["default_price"],
    });

    if (product.default_price && typeof product.default_price !== "string") {
      priceId = product.default_price.id;
    }
  }

  if (isUpgrade) {
    const { data: sourceTrial } = await getUserOrderById(trialSessionId, user.id);

    if (
      !sourceTrial ||
      sourceTrial.mode !== "trial" ||
      sourceTrial.shoe_slug !== shoe.slug ||
      sourceTrial.status !== "trial_active" ||
      !sourceTrial.trial_fee_paid
    ) {
      return NextResponse.redirect(new URL("/account", request.url), {
        status: 303,
      });
    }

    upgradeTrialAmount = sourceTrial.trial_fee_paid;
    unitAmount = Math.max(shoe.keepPrice - sourceTrial.trial_fee_paid, 0) * 100;
    priceId = undefined;
  } else {
    const draftOrder = await createOrder({
      buyPrice: shoe.keepPrice,
      guaranteeHoldAmount: shoe.deposit,
      metadata: {
        addressLine1,
        addressLine2,
        city,
        postcode,
        source: "stripe_checkout",
      },
      mode: isBuyNow ? "buy_now" : "trial",
      remainingBuyAmount: isBuyNow ? 0 : shoe.keepPrice - shoe.trialDailyFee * selectedDays,
      shoeName: `${shoe.brand} ${shoe.name}`,
      shoeSlug: shoe.slug,
      size,
      status: "checkout_pending",
      trialDays: isBuyNow ? null : selectedDays,
      trialFeePaid: 0,
      trialStartedAt: null,
      userId: user.id,
    });

    if (draftOrder.error) {
      return NextResponse.json({ error: draftOrder.error.message }, { status: 500 });
    }

    orderId = draftOrder.data.id;

    await createOrderEvent({
      orderId,
      payload: {
        city,
        mode: isBuyNow ? "buy_now" : "trial",
        postcode,
        addressLine1,
        addressLine2,
      },
      type: "order_created",
      userId: user.id,
    });
  }

  const successUrl = new URL("/checkout/success", request.url);
  successUrl.searchParams.set("shoe", shoe.slug);
  successUrl.searchParams.set("mode", isUpgrade ? "upgrade" : isBuyNow ? "buy" : "trial");
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  if (orderId) {
    successUrl.searchParams.set("orderId", orderId);
  }
  if (isTrial) {
    successUrl.searchParams.set("days", String(selectedDays));
  }

  const cancelUrl = new URL("/checkout", request.url);
  cancelUrl.searchParams.set("shoe", shoe.slug);
  cancelUrl.searchParams.set("mode", isUpgrade ? "upgrade" : isBuyNow ? "buy" : "trial");
  if (size) {
    cancelUrl.searchParams.set("size", size);
  }
  if (isUpgrade && trialSessionId) {
    cancelUrl.searchParams.set("trialSession", trialSessionId);
  }
  if (isTrial) {
    cancelUrl.searchParams.set("days", String(selectedDays));
  }

  const session = await stripe.checkout.sessions.create({
    cancel_url: cancelUrl.toString(),
    customer_email: email || undefined,
    customer_creation: "always",
    line_items: priceId
      ? [
          {
            price: priceId,
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: isBuyNow
                  ? `${shoe.brand} ${shoe.name}`
                  : isUpgrade
                    ? `${shoe.brand} ${shoe.name} trial upgrade`
                    : `${shoe.brand} ${shoe.name} ${selectedDays}-day trial`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
    metadata: {
      city,
      days: String(selectedDays),
      mode: isUpgrade ? "trial_upgrade" : isBuyNow ? "buy_now" : "trial",
      orderId: orderId ?? trialSessionId,
      postcode,
      addressLine1,
      addressLine2,
      shoe: shoe.slug,
      size,
      trialPaid: String(upgradeTrialAmount),
      trialSession: trialSessionId,
    },
    mode: "payment",
    payment_intent_data: {
      metadata: {
        mode: isUpgrade ? "trial_upgrade" : isBuyNow ? "buy_now" : "trial",
        orderId: orderId ?? trialSessionId,
        shoe: shoe.slug,
        size,
        trialSession: trialSessionId,
      },
      receipt_email: email || undefined,
    },
    success_url: successUrl.toString(),
  });

  if (orderId) {
    await updateOrderCheckoutData({
      orderId,
      stripeCheckoutSessionId: session.id,
      stripeCustomerEmail: email,
      userId: user.id,
    });

    await createOrderEvent({
      orderId,
      payload: {
        stripeCheckoutSessionId: session.id,
      },
      type: "checkout_started",
      userId: user.id,
    });
  }

  if (!session.url) {
    return NextResponse.redirect(cancelUrl);
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
