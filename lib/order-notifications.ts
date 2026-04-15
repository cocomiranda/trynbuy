import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderRow } from "@/lib/orders";
import { sendTelegramMessage } from "@/lib/telegram";

type OrderNotificationType =
  | "trial_started"
  | "purchase_paid"
  | "trial_upgraded"
  | "return_requested"
  | "before_photo_uploaded"
  | "return_photo_uploaded";

type OrderNotificationContext = {
  amount?: number | null;
  count?: number;
  email?: string | null;
  notes?: string | null;
};

type NotificationIdentity = {
  email: string;
  fullName: string;
};

function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  });
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-GB", {
    currency: "GBP",
    style: "currency",
  }).format(value);
}

async function getNotificationIdentity(
  userId: string,
  fallbackEmail?: string | null,
): Promise<NotificationIdentity> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single<{ email: string | null; full_name: string | null }>();

  return {
    email: data?.email?.trim() || fallbackEmail?.trim() || "Not available",
    fullName: data?.full_name?.trim() || "Not provided",
  };
}

function buildLines(
  type: OrderNotificationType,
  order: OrderRow,
  identity: NotificationIdentity,
  context: OrderNotificationContext,
) {
  const commonLines = [
    `Name: ${identity.fullName}`,
    `Email: ${identity.email}`,
    `Shoe: ${order.shoe_name}`,
    `Size: ${order.size}`,
    `Order ID: ${order.id}`,
  ];

  switch (type) {
    case "trial_started":
      return [
        "New trial started",
        ...commonLines,
        `Trial fee: ${formatMoney(context.amount ?? order.trial_fee_paid)}`,
        `Trial length: ${order.trial_days ?? "Not available"} days`,
        `Due date: ${order.trial_ends_at ? formatDate(order.trial_ends_at) : "Not available"}`,
      ];
    case "purchase_paid":
      return [
        "New purchase received",
        ...commonLines,
        `Amount paid: ${formatMoney(context.amount ?? order.buy_price)}`,
        `Status: ${order.status}`,
      ];
    case "trial_upgraded":
      return [
        "Trial converted to purchase",
        ...commonLines,
        `Upgrade paid: ${formatMoney(context.amount ?? order.remaining_buy_amount)}`,
        `Original trial fee: ${formatMoney(order.trial_fee_paid)}`,
      ];
    case "return_requested":
      return [
        "Return requested",
        ...commonLines,
        `Requested: ${formatDate(new Date())}`,
        `Notes: ${context.notes?.trim() || "None provided"}`,
      ];
    case "before_photo_uploaded":
      return [
        "Before photos uploaded",
        ...commonLines,
        `Files added: ${context.count ?? 0}`,
      ];
    case "return_photo_uploaded":
      return [
        "Return photos uploaded",
        ...commonLines,
        `Files added: ${context.count ?? 0}`,
      ];
    default:
      return commonLines;
  }
}

export async function sendOrderTelegramNotification(
  type: OrderNotificationType,
  order: OrderRow,
  context: OrderNotificationContext = {},
) {
  const identity = await getNotificationIdentity(order.user_id, context.email);
  const message = buildLines(type, order, identity, context).join("\n");

  return sendTelegramMessage(message);
}
