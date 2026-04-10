import { NextResponse } from "next/server";
import { createOrderEvent, createOrderPhoto, deleteOrderPhoto, getUserOrderById } from "@/lib/orders";
import {
  buildTrialPhotoPath,
  TRIAL_PHOTO_BUCKET,
  type TrialPhotoStage,
} from "@/lib/trial-photos";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const allowedStages: TrialPhotoStage[] = ["before", "return"];

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
  const stage = String(formData.get("stage") ?? "") as TrialPhotoStage;
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!orderId || !allowedStages.includes(stage)) {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "Select at least one photo." }, { status: 400 });
  }

  const { data: order } = await getUserOrderById(orderId, user.id);

  if (!order || order.mode !== "trial") {
    return NextResponse.json({ error: "Trial not found." }, { status: 404 });
  }

  try {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const path = buildTrialPhotoPath({
          fileName: file.name,
          sessionId: orderId,
          stage,
          userId: user.id,
        });

        const { error } = await supabase.storage
          .from(TRIAL_PHOTO_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        const photoRecord = await createOrderPhoto({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          orderId,
          stage,
          storagePath: path,
          userId: user.id,
        });

        if (photoRecord.error) {
          throw photoRecord.error;
        }

        await createOrderEvent({
          orderId,
          payload: {
            stage,
            storagePath: path,
          },
          type: "trial_photo_uploaded",
          userId: user.id,
        });

        return path;
      }),
    );

    return NextResponse.json({ ok: true, uploaded });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

  const url = new URL(request.url);
  const orderId = url.searchParams.get("sessionId") ?? "";
  const path = url.searchParams.get("path") ?? "";

  if (!orderId || !path) {
    return NextResponse.json({ error: "Invalid delete request." }, { status: 400 });
  }

  const { data: order } = await getUserOrderById(orderId, user.id);

  if (!order || order.mode !== "trial") {
    return NextResponse.json({ error: "Trial not found." }, { status: 404 });
  }

  if (!path.startsWith(`${user.id}/${orderId}/`)) {
    return NextResponse.json({ error: "Invalid photo path." }, { status: 403 });
  }

  const { error } = await supabase.storage.from(TRIAL_PHOTO_BUCKET).remove([path]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await deleteOrderPhoto({
    orderId,
    storagePath: path,
    userId: user.id,
  });

  await createOrderEvent({
    orderId,
    payload: {
      storagePath: path,
    },
    type: "trial_photo_deleted",
    userId: user.id,
  });

  return NextResponse.json({ ok: true });
}
