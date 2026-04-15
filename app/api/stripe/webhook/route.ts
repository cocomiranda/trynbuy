import Stripe from "stripe";
import { NextResponse } from "next/server";
import {
  createOrderEventAdmin,
  finalizePaidOrderAdmin,
  getOrderByIdAdmin,
} from "@/lib/orders";
import { sendOrderTelegramNotification } from "@/lib/order-notifications";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid webhook signature.",
      },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const mode = session.metadata?.mode;

    if (orderId && session.payment_status === "paid") {
      const { data: order } = await getOrderByIdAdmin(orderId);

      if (order) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        const email =
          session.customer_details?.email ?? session.customer_email ?? null;

        if (mode === "trial" && order.status === "checkout_pending") {
          const selectedDays =
            order.trial_days === 3 || order.trial_days === 5 ? order.trial_days : 5;
          const requestedDeliveryDate =
            typeof order.metadata?.deliveryDate === "string"
              ? new Date(`${order.metadata.deliveryDate}T00:00:00Z`)
              : null;
          const trialStartDate =
            requestedDeliveryDate && !Number.isNaN(requestedDeliveryDate.getTime())
              ? requestedDeliveryDate
              : new Date(session.created * 1000);
          const trialStartedAt = trialStartDate.toISOString();
          const trialEndsAt = new Date(
            trialStartDate.getTime() + selectedDays * 24 * 60 * 60 * 1000,
          ).toISOString();

          const finalizedOrder = await finalizePaidOrderAdmin({
            deliveryStatus: "delivered",
            inspectionStatus: "not_started",
            orderId,
            paymentIntentId,
            remainingBuyAmount: Math.max(
              order.buy_price - (session.amount_total ?? 0) / 100,
              0,
            ),
            status: "trial_active",
            stripeCheckoutSessionId: session.id,
            stripeCustomerEmail: email,
            trialEndsAt,
            trialFeePaid: (session.amount_total ?? 0) / 100,
            trialStartedAt,
          });

          await createOrderEventAdmin({
            orderId,
            payload: {
              amountTotal: session.amount_total,
              checkoutSessionId: session.id,
              eventId: event.id,
            },
            type: "trial_activated",
            userId: order.user_id,
          });

          if (finalizedOrder.data) {
            try {
              await sendOrderTelegramNotification("trial_started", finalizedOrder.data, {
                amount: (session.amount_total ?? 0) / 100,
                email,
              });
            } catch {
              // Order updates should not fail if Telegram is unavailable.
            }
          }
        }

        if (mode === "buy_now" && order.status === "checkout_pending") {
          const finalizedOrder = await finalizePaidOrderAdmin({
            deliveryStatus: "pending",
            inspectionStatus: "not_required",
            orderId,
            paymentIntentId,
            remainingBuyAmount: 0,
            status: "purchase_to_be_delivered",
            stripeCheckoutSessionId: session.id,
            stripeCustomerEmail: email,
          });

          await createOrderEventAdmin({
            orderId,
            payload: {
              amountTotal: session.amount_total,
              checkoutSessionId: session.id,
              eventId: event.id,
            },
            type: "purchase_paid",
            userId: order.user_id,
          });

          if (finalizedOrder.data) {
            try {
              await sendOrderTelegramNotification("purchase_paid", finalizedOrder.data, {
                amount: (session.amount_total ?? 0) / 100,
                email,
              });
            } catch {
              // Order updates should not fail if Telegram is unavailable.
            }
          }
        }

        if (
          mode === "trial_upgrade" &&
          (order.status === "trial_active" || order.status === "trial_pending_inspection")
        ) {
          const finalizedOrder = await finalizePaidOrderAdmin({
            deliveryStatus: "delivered",
            inspectionStatus: "not_required",
            orderId,
            paymentIntentId,
            remainingBuyAmount: 0,
            status: "trial_converted_to_purchase",
            stripeCheckoutSessionId: session.id,
            stripeCustomerEmail: email,
            trialEndsAt: order.trial_ends_at,
            trialFeePaid: order.trial_fee_paid,
            trialStartedAt: order.trial_started_at,
          });

          await createOrderEventAdmin({
            orderId,
            payload: {
              amountTotal: session.amount_total,
              checkoutSessionId: session.id,
              eventId: event.id,
            },
            type: "trial_upgraded",
            userId: order.user_id,
          });

          if (finalizedOrder.data) {
            try {
              await sendOrderTelegramNotification("trial_upgraded", finalizedOrder.data, {
                amount: (session.amount_total ?? 0) / 100,
                email,
              });
            } catch {
              // Order updates should not fail if Telegram is unavailable.
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
