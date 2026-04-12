import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient, type LooseQueryBuilder } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe";

export type OrderMode = "trial" | "buy_now" | "trial_upgrade";

export type OrderStatus =
  | "checkout_pending"
  | "trial_active"
  | "trial_return_requested"
  | "trial_pending_inspection"
  | "trial_return_completed"
  | "trial_converted_to_purchase"
  | "purchase_paid"
  | "purchase_to_be_delivered"
  | "purchase_delivered"
  | "purchase_cancelled";

export type DeliveryStatus =
  | "not_applicable"
  | "pending"
  | "preparing"
  | "shipped"
  | "delivered"
  | "returned";

export type InspectionStatus =
  | "not_required"
  | "not_started"
  | "pending"
  | "passed"
  | "failed"
  | "partial_charge";

export type OrderRow = {
  id: string;
  user_id: string;
  shoe_slug: string;
  shoe_name: string;
  size: string;
  mode: OrderMode;
  status: OrderStatus;
  delivery_status: DeliveryStatus;
  inspection_status: InspectionStatus;
  trial_days: number | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_fee_paid: number;
  buy_price: number;
  remaining_buy_amount: number;
  guarantee_hold_amount: number;
  return_requested_at: string | null;
  delivered_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OrderEventRow = {
  id: string;
  order_id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type OrderPhotoRow = {
  id: string;
  order_id: string;
  user_id: string;
  stage: "before" | "return";
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  notes: string | null;
  created_at: string;
};

export type CreateOrderInput = {
  buyPrice: number;
  guaranteeHoldAmount: number;
  metadata?: Record<string, unknown>;
  mode: OrderMode;
  remainingBuyAmount: number;
  shoeName: string;
  shoeSlug: string;
  size: string;
  status?: OrderStatus;
  trialDays?: number | null;
  trialEndsAt?: string | null;
  trialFeePaid?: number;
  trialStartedAt?: string | null;
  userId: string;
};

export async function createOrder(input: CreateOrderInput) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("orders")
    .insert({
      buy_price: input.buyPrice,
      guarantee_hold_amount: input.guaranteeHoldAmount,
      metadata: input.metadata ?? {},
      mode: input.mode,
      remaining_buy_amount: input.remainingBuyAmount,
      shoe_name: input.shoeName,
      shoe_slug: input.shoeSlug,
      size: input.size,
      status: input.status ?? "checkout_pending",
      trial_days: input.trialDays ?? null,
      trial_ends_at: input.trialEndsAt ?? null,
      trial_fee_paid: input.trialFeePaid ?? 0,
      trial_started_at: input.trialStartedAt ?? null,
      user_id: input.userId,
    })
    .select("*")
    .single<OrderRow>();
}

export async function getUserOrders(userId: string) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();
}

export async function getUserOrderById(orderId: string, userId: string) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single<OrderRow>();
}

export async function getOrderByCheckoutSessionId(
  stripeCheckoutSessionId: string,
) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("orders")
    .select("*")
    .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
    .single<OrderRow>();
}

export async function getOrderByIdAdmin(orderId: string) {
  const supabase = getSupabaseAdminClient();

  return supabase.from("orders").select("*").eq("id", orderId).single<OrderRow>();
}

export async function finalizePaidOrderAdmin(params: {
  deliveryStatus?: DeliveryStatus;
  inspectionStatus?: InspectionStatus;
  orderId: string;
  paymentIntentId?: string | null;
  remainingBuyAmount?: number;
  status: OrderStatus;
  stripeCheckoutSessionId: string;
  stripeCustomerEmail?: string | null;
  trialEndsAt?: string | null;
  trialFeePaid?: number;
  trialStartedAt?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const ordersTable = supabase.from("orders") as unknown as LooseQueryBuilder;

  return ordersTable
    .update({
      delivery_status: params.deliveryStatus,
      inspection_status: params.inspectionStatus,
      remaining_buy_amount: params.remainingBuyAmount,
      status: params.status,
      stripe_checkout_session_id: params.stripeCheckoutSessionId,
      stripe_customer_email: params.stripeCustomerEmail ?? null,
      stripe_payment_intent_id: params.paymentIntentId ?? null,
      trial_ends_at: params.trialEndsAt,
      trial_fee_paid: params.trialFeePaid,
      trial_started_at: params.trialStartedAt,
    })
    .eq("id", params.orderId)
    .select("*")
    .single<OrderRow>();
}

export async function updateOrderStatus(params: {
  orderId: string;
  userId: string;
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  inspectionStatus?: InspectionStatus;
  returnRequestedAt?: string | null;
}) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("orders")
    .update({
      delivery_status: params.deliveryStatus,
      inspection_status: params.inspectionStatus,
      return_requested_at: params.returnRequestedAt,
      status: params.status,
    })
    .eq("id", params.orderId)
    .eq("user_id", params.userId)
    .select("*")
    .single<OrderRow>();
}

export async function updateOrderCheckoutData(params: {
  orderId: string;
  userId: string;
  stripeCheckoutSessionId: string;
  stripeCustomerEmail?: string | null;
}) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("orders")
    .update({
      stripe_checkout_session_id: params.stripeCheckoutSessionId,
      stripe_customer_email: params.stripeCustomerEmail ?? null,
    })
    .eq("id", params.orderId)
    .eq("user_id", params.userId)
    .select("*")
    .single<OrderRow>();
}

export async function finalizePaidOrder(params: {
  deliveryStatus?: DeliveryStatus;
  inspectionStatus?: InspectionStatus;
  orderId: string;
  paymentIntentId?: string | null;
  remainingBuyAmount?: number;
  status: OrderStatus;
  stripeCheckoutSessionId: string;
  stripeCustomerEmail?: string | null;
  trialEndsAt?: string | null;
  trialFeePaid?: number;
  trialStartedAt?: string | null;
  userId: string;
}) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("orders")
    .update({
      delivery_status: params.deliveryStatus,
      inspection_status: params.inspectionStatus,
      remaining_buy_amount: params.remainingBuyAmount,
      status: params.status,
      stripe_checkout_session_id: params.stripeCheckoutSessionId,
      stripe_customer_email: params.stripeCustomerEmail ?? null,
      stripe_payment_intent_id: params.paymentIntentId ?? null,
      trial_ends_at: params.trialEndsAt,
      trial_fee_paid: params.trialFeePaid,
      trial_started_at: params.trialStartedAt,
    })
    .eq("id", params.orderId)
    .eq("user_id", params.userId)
    .select("*")
    .single<OrderRow>();
}

export async function createOrderEvent(params: {
  orderId: string;
  payload?: Record<string, unknown>;
  type:
    | "order_created"
    | "checkout_started"
    | "checkout_completed"
    | "trial_activated"
    | "trial_photo_uploaded"
    | "trial_photo_deleted"
    | "return_requested"
    | "inspection_started"
    | "inspection_passed"
    | "inspection_failed"
    | "trial_upgraded"
    | "purchase_paid"
    | "delivery_updated";
  userId: string;
}) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("order_events")
    .insert({
      order_id: params.orderId,
      payload: params.payload ?? {},
      type: params.type,
      user_id: params.userId,
    })
    .select("*")
    .single<OrderEventRow>();
}

export async function createOrderEventAdmin(params: {
  orderId: string;
  payload?: Record<string, unknown>;
  type:
    | "order_created"
    | "checkout_started"
    | "checkout_completed"
    | "trial_activated"
    | "trial_photo_uploaded"
    | "trial_photo_deleted"
    | "return_requested"
    | "inspection_started"
    | "inspection_passed"
    | "inspection_failed"
    | "trial_upgraded"
    | "purchase_paid"
    | "delivery_updated";
  userId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const orderEventsTable = supabase.from("order_events") as unknown as LooseQueryBuilder;

  return orderEventsTable
    .insert({
      order_id: params.orderId,
      payload: params.payload ?? {},
      type: params.type,
      user_id: params.userId,
    })
    .select("*")
    .single<OrderEventRow>();
}

export async function syncOrderPaymentState(order: OrderRow) {
  if (
    order.status !== "checkout_pending" ||
    !order.stripe_checkout_session_id
  ) {
    return order;
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(
    order.stripe_checkout_session_id,
  );

  if (session.payment_status !== "paid") {
    return order;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  const email = session.customer_details?.email ?? session.customer_email ?? null;

  if (order.mode === "trial") {
    const selectedDays = order.trial_days === 3 || order.trial_days === 5 ? order.trial_days : 5;
    const requestedDeliveryDate =
      typeof order.metadata?.deliveryDate === "string"
        ? new Date(`${order.metadata.deliveryDate}T00:00:00Z`)
        : null;
    const trialStartDate =
      requestedDeliveryDate && !Number.isNaN(requestedDeliveryDate.getTime())
        ? requestedDeliveryDate
        : new Date(session.created * 1000);
    const trialStartedAt = trialStartDate.toISOString();
    const trialFeePaid = (session.amount_total ?? 0) / 100;
    const trialEndsAt = new Date(
      trialStartDate.getTime() + selectedDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data } = await finalizePaidOrder({
      deliveryStatus: "delivered",
      inspectionStatus: "not_started",
      orderId: order.id,
      paymentIntentId,
      remainingBuyAmount: Math.max(order.buy_price - trialFeePaid, 0),
      status: "trial_active",
      stripeCheckoutSessionId: session.id,
      stripeCustomerEmail: email,
      trialEndsAt,
      trialFeePaid,
      trialStartedAt,
      userId: order.user_id,
    });

    await createOrderEvent({
      orderId: order.id,
      payload: {
        checkoutSessionId: session.id,
        source: "account_sync",
      },
      type: "trial_activated",
      userId: order.user_id,
    });

    return data ?? order;
  }

  if (order.mode === "trial_upgrade") {
    const { data } = await finalizePaidOrder({
      deliveryStatus: "delivered",
      inspectionStatus: "not_required",
      orderId: order.id,
      paymentIntentId,
      remainingBuyAmount: 0,
      status: "trial_converted_to_purchase",
      stripeCheckoutSessionId: session.id,
      stripeCustomerEmail: email,
      trialEndsAt: order.trial_ends_at,
      trialFeePaid: order.trial_fee_paid,
      trialStartedAt: order.trial_started_at,
      userId: order.user_id,
    });

    await createOrderEvent({
      orderId: order.id,
      payload: {
        checkoutSessionId: session.id,
        source: "account_sync",
      },
      type: "trial_upgraded",
      userId: order.user_id,
    });

    return data ?? order;
  }

  const { data } = await finalizePaidOrder({
    deliveryStatus: "pending",
    inspectionStatus: "not_required",
    orderId: order.id,
    paymentIntentId,
    remainingBuyAmount: 0,
    status: "purchase_to_be_delivered",
    stripeCheckoutSessionId: session.id,
    stripeCustomerEmail: email,
    userId: order.user_id,
  });

  await createOrderEvent({
    orderId: order.id,
    payload: {
      checkoutSessionId: session.id,
      source: "account_sync",
    },
    type: "purchase_paid",
    userId: order.user_id,
  });

  return data ?? order;
}

export async function createOrderPhoto(params: {
  fileName: string;
  mimeType: string;
  notes?: string | null;
  orderId: string;
  stage: "before" | "return";
  storageBucket?: string;
  storagePath: string;
  userId: string;
}) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("order_photos")
    .insert({
      file_name: params.fileName,
      mime_type: params.mimeType,
      notes: params.notes ?? null,
      order_id: params.orderId,
      stage: params.stage,
      storage_bucket: params.storageBucket ?? "trial-photos",
      storage_path: params.storagePath,
      user_id: params.userId,
    })
    .select("*")
    .single<OrderPhotoRow>();
}

export async function getOrderPhotos(params: {
  orderId: string;
  stage?: "before" | "return";
  userId: string;
}) {
  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from("order_photos")
    .select("*")
    .eq("order_id", params.orderId)
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false });

  if (params.stage) {
    query = query.eq("stage", params.stage);
  }

  return query.returns<OrderPhotoRow[]>();
}

export async function deleteOrderPhoto(params: {
  orderId: string;
  storagePath: string;
  userId: string;
}) {
  const supabase = await getSupabaseServerClient();

  return supabase
    .from("order_photos")
    .delete()
    .eq("order_id", params.orderId)
    .eq("user_id", params.userId)
    .eq("storage_path", params.storagePath);
}

export function formatOrderDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getMetadataDeliveryDate(metadata?: Record<string, unknown>) {
  const deliveryDate = metadata?.deliveryDate;

  if (typeof deliveryDate !== "string" || !deliveryDate) {
    return null;
  }

  const date = new Date(`${deliveryDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getResolvedTrialEndsAt(
  order: Pick<OrderRow, "created_at" | "metadata" | "trial_days" | "trial_ends_at">,
) {
  if (order.trial_ends_at) {
    return order.trial_ends_at;
  }

  if (order.trial_days !== 3 && order.trial_days !== 5) {
    return null;
  }

  const startDate =
    getMetadataDeliveryDate(order.metadata) ??
    (order.created_at ? new Date(order.created_at) : null);

  if (!startDate || Number.isNaN(startDate.getTime())) {
    return null;
  }

  return new Date(
    startDate.getTime() + order.trial_days * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export function getTrialDueLabel(trialEndsAt?: string | null) {
  if (!trialEndsAt) {
    return null;
  }

  const dueAt = new Date(trialEndsAt).getTime();
  const remainingMs = dueAt - Date.now();

  if (remainingMs <= 0) {
    return "ended";
  }

  const totalHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const remainingDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  return `in ${remainingDays}d ${remainingHours}h`;
}

export function getOrderTypeTag(order: OrderRow) {
  if (
    order.mode === "buy_now" ||
    order.status === "trial_converted_to_purchase" ||
    order.status === "purchase_paid" ||
    order.status === "purchase_to_be_delivered" ||
    order.status === "purchase_delivered"
  ) {
    return "Purchase";
  }

  return "Trial";
}

export function getOrderStateTag(order: OrderRow) {
  if (
    order.status === "trial_return_requested" ||
    order.status === "trial_pending_inspection"
  ) {
    return "Pending inspection";
  }

  if (order.status === "trial_return_completed") {
    return "Returned";
  }

  if (
    order.status === "purchase_to_be_delivered" ||
    order.status === "purchase_paid" ||
    order.status === "purchase_delivered" ||
    order.delivery_status === "pending" ||
    order.delivery_status === "preparing" ||
    order.delivery_status === "shipped" ||
    order.delivery_status === "delivered"
  ) {
    // MVP: keep purchase states simple in the UI until real carrier tracking
    // is wired in, even though the fuller delivery workflow exists in code.
    return "Received";
  }

  if (
    order.status === "purchase_cancelled" ||
    order.delivery_status === "returned"
  ) {
    return "Returned";
  }

  if (order.status === "checkout_pending") {
    return "Pending payment";
  }

  return "Received";
}
