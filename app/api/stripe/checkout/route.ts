import { NextResponse } from "next/server";
import { getShoeBySlug } from "@/lib/shoes";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const shoeSlug = String(formData.get("shoe") ?? "");
  const size = String(formData.get("size") ?? "");
  const email = String(formData.get("email") ?? "");
  const deliveryDate = String(formData.get("deliveryDate") ?? "");
  const city = String(formData.get("city") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const days = Number(formData.get("days") ?? 5);

  const shoe = getShoeBySlug(shoeSlug);

  if (!shoe) {
    return NextResponse.redirect(new URL("/shoes", request.url));
  }

  const selectedDays = days === 3 || days === 5 ? days : 5;
  const isBuyNow = mode === "buy";
  const isTrial = mode === "trial";

  if (!isBuyNow && !isTrial) {
    return NextResponse.redirect(
      new URL(`/checkout?shoe=${shoeSlug}`, request.url),
    );
  }

  const stripe = getStripeClient();
  let priceId: string | undefined;

  if (isBuyNow && shoe.stripeProductId) {
    const product = await stripe.products.retrieve(shoe.stripeProductId, {
      expand: ["default_price"],
    });

    if (product.default_price && typeof product.default_price !== "string") {
      priceId = product.default_price.id;
    }
  }

  const successUrl = new URL("/checkout/success", request.url);
  successUrl.searchParams.set("shoe", shoe.slug);
  successUrl.searchParams.set("mode", isBuyNow ? "buy" : "trial");
  if (isTrial) {
    successUrl.searchParams.set("days", String(selectedDays));
  }

  const cancelUrl = new URL("/checkout", request.url);
  cancelUrl.searchParams.set("shoe", shoe.slug);
  cancelUrl.searchParams.set("mode", isBuyNow ? "buy" : "trial");
  if (size) {
    cancelUrl.searchParams.set("size", size);
  }
  if (isTrial) {
    cancelUrl.searchParams.set("days", String(selectedDays));
  }

  const session = await stripe.checkout.sessions.create({
    cancel_url: cancelUrl.toString(),
    customer_email: email || undefined,
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
                  : `${shoe.brand} ${shoe.name} ${selectedDays}-day trial`,
              },
              unit_amount: (isBuyNow
                ? shoe.keepPrice
                : shoe.trialDailyFee * selectedDays) * 100,
            },
            quantity: 1,
          },
        ],
    metadata: {
      city,
      days: String(selectedDays),
      deliveryDate,
      mode: isBuyNow ? "buy_now" : "trial",
      shoe: shoe.slug,
      size,
    },
    mode: "payment",
    success_url: successUrl.toString(),
  });

  if (!session.url) {
    return NextResponse.redirect(cancelUrl);
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
