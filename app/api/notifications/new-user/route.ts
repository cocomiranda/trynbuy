import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";

type ProfileInsertPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id?: string;
    email?: string | null;
    full_name?: string | null;
    created_at?: string | null;
  } | null;
  old_record: unknown;
};

function isAuthorized(request: Request) {
  const expectedSecret = process.env.NEW_USER_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return false;
  }

  return request.headers.get("x-webhook-secret") === expectedSecret;
}

function formatUserMessage(payload: ProfileInsertPayload) {
  const profile = payload.record;

  if (!profile) {
    return null;
  }

  const fullName = profile.full_name?.trim() || "Not provided";
  const email = profile.email?.trim() || "Not provided";
  const createdAt = profile.created_at
    ? new Date(profile.created_at).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/London",
      })
    : "Not available";

  return [
    "New user signed up",
    `Name: ${fullName}`,
    `Email: ${email}`,
    `User ID: ${profile.id ?? "Not available"}`,
    `Created: ${createdAt}`,
  ].join("\n");
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ProfileInsertPayload;

  try {
    payload = (await request.json()) as ProfileInsertPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (
    payload.type !== "INSERT" ||
    payload.schema !== "public" ||
    payload.table !== "profiles" ||
    !payload.record
  ) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const message = formatUserMessage(payload);

  if (!message) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await sendTelegramMessage(message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Telegram notification failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
