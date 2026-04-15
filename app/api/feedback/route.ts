import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { getUserProfile } from "@/lib/profiles";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type FeedbackRequestBody = {
  message?: string;
  page?: string;
};

function formatDate(value: Date) {
  return value.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  });
}

function getTrimmedMessage(message: string | undefined) {
  return message?.trim().slice(0, 2000) ?? "";
}

export async function POST(request: Request) {
  let body: FeedbackRequestBody;

  try {
    body = (await request.json()) as FeedbackRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const message = getTrimmedMessage(body.message);

  if (!message) {
    return NextResponse.json(
      { error: "Please add a feedback note first." },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName = "Guest";
  let email = "Not available";
  let userId = "Anonymous";

  if (user) {
    const profileResponse = await getUserProfile(user.id);
    const profile = profileResponse.data;

    fullName =
      profile?.full_name?.trim() ||
      user.user_metadata.full_name ||
      user.email?.split("@")[0] ||
      "Not provided";
    email = user.email ?? profile?.email ?? "Not available";
    userId = user.id;
  }

  const page = body.page?.trim() || "Not available";
  const submittedAt = formatDate(new Date());

  const feedbackInsert = await supabase
    .from("feedback_messages")
    .insert({
      email: email === "Not available" ? null : email,
      full_name: fullName === "Guest" ? null : fullName,
      message,
      metadata: {
        submitted_at: submittedAt,
      },
      page,
      source: "feedback_widget",
      user_id: user?.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (feedbackInsert.error) {
    return NextResponse.json(
      { error: "Feedback could not be saved right now." },
      { status: 500 },
    );
  }

  const telegramMessage = [
    "New feedback received",
    `Name: ${fullName}`,
    `Email: ${email}`,
    `User ID: ${userId}`,
    `Page: ${page}`,
    `Submitted: ${submittedAt}`,
    `Feedback ID: ${feedbackInsert.data?.id ?? "Not available"}`,
    "",
    message,
  ].join("\n");

  try {
    await sendTelegramMessage(telegramMessage);
    return NextResponse.json({ ok: true, sentToTelegram: true, stored: true });
  } catch {
    return NextResponse.json({
      ok: true,
      sentToTelegram: false,
      stored: true,
      warning: "Feedback was saved, but the Telegram alert could not be sent.",
    });
  }
}
