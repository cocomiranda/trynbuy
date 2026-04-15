import { NextResponse } from "next/server";
import { sendOrderTelegramNotification } from "@/lib/order-notifications";
import { createOrderEvent, getUserOrderById, updateOrderStatus } from "@/lib/orders";
import { saveTrialReturnRequest } from "@/lib/trial-photos";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!getSupabaseConfig().isConfigured) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const formData = await request.formData();
  const orderId = String(formData.get("sessionId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!orderId) {
    return NextResponse.json({ error: "Missing trial session." }, { status: 400 });
  }

  const { data: order } = await getUserOrderById(orderId, user.id);

  if (!order || order.mode !== "trial") {
    return NextResponse.json({ error: "Trial not found." }, { status: 404 });
  }

  const { error } = await saveTrialReturnRequest({
    notes,
    orderId,
    userId: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const statusUpdate = await updateOrderStatus({
    inspectionStatus: "pending",
    orderId,
    returnRequestedAt: new Date().toISOString(),
    status: "trial_pending_inspection",
    userId: user.id,
  });

  if (statusUpdate.error) {
    return NextResponse.json({ error: statusUpdate.error.message }, { status: 500 });
  }

  await createOrderEvent({
    orderId,
    payload: { notes },
    type: "return_requested",
    userId: user.id,
  });

  try {
    await sendOrderTelegramNotification("return_requested", order, {
      email: user.email,
      notes,
    });
  } catch {
    // Return flow should still succeed if Telegram is unavailable.
  }

  return NextResponse.json({ ok: true });
}
