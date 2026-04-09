import { getShoeBySlug } from "@/lib/shoes";
import { getStripeClient } from "@/lib/stripe";

export type AccountOrder = {
  amount: number | null;
  created: number;
  dueDate?: string;
  dueLabel?: string;
  id: string;
  model?: string;
  size: string;
  status: string;
  type: "Purchase" | "Trial";
};

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getTrialDeadline(created: number, days?: string) {
  const parsedDays = Number(days);
  const selectedDays = parsedDays === 3 || parsedDays === 5 ? parsedDays : 5;
  const createdAt = created * 1000;
  const dueAt = createdAt + selectedDays * 24 * 60 * 60 * 1000;
  const remainingMs = dueAt - Date.now();

  if (remainingMs <= 0) {
    return {
      dueDate: formatDate(new Date(dueAt).toISOString()),
      label: "Return window ended",
    };
  }

  const totalHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const remainingDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  return {
    dueDate: formatDate(new Date(dueAt).toISOString()),
    label: `Due in ${remainingDays}d ${remainingHours}h`,
  };
}

export function formatAccountDate(value?: string) {
  return formatDate(value);
}

export function formatAccountTimestamp(timestamp: number) {
  return formatDate(new Date(timestamp * 1000).toISOString());
}

export async function getAccountOrders(email: string) {
  const stripe = getStripeClient();
  const sessions = await stripe.checkout.sessions.list({ limit: 50 });

  return sessions.data
    .filter((session) => {
      const sessionEmail =
        session.customer_details?.email ?? session.customer_email ?? "";
      const purchaseMode = session.metadata?.mode;

      return (
        session.mode === "payment" &&
        session.payment_status === "paid" &&
        (purchaseMode === "buy_now" || purchaseMode === "trial") &&
        sessionEmail.toLowerCase() === email.toLowerCase()
      );
    })
    .map((session) => {
      const shoe = getShoeBySlug(session.metadata?.shoe ?? "");
      const purchaseType: "Purchase" | "Trial" =
        session.metadata?.mode === "trial" ? "Trial" : "Purchase";
      const trialDeadline =
        purchaseType === "Trial"
          ? getTrialDeadline(session.created, session.metadata?.days)
          : null;

      return {
        amount: session.amount_total ? session.amount_total / 100 : null,
        created: session.created,
        dueDate: trialDeadline?.dueDate,
        dueLabel: trialDeadline?.label,
        id: session.id,
        model: shoe ? `${shoe.brand} ${shoe.name}` : session.metadata?.shoe,
        size: session.metadata?.size || "Not provided",
        status: session.payment_status,
        type: purchaseType,
      } satisfies AccountOrder;
    })
    .sort((left, right) => right.created - left.created);
}

