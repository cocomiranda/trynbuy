import { getOrderPhotos, type OrderPhotoRow } from "@/lib/orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const TRIAL_PHOTO_BUCKET = "trial-photos";
export const TRIAL_REQUEST_BUCKET = "trial-requests";

export type TrialPhotoStage = "before" | "return";

export type TrialPhotoItem = {
  name: string;
  path: string;
  publicUrl: string;
  uploadedAt: string;
};

export type TrialReturnRequest = {
  notes: string;
  requestedAt: string;
};

function normalizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export function buildTrialPhotoPath(params: {
  userId: string;
  sessionId: string;
  stage: TrialPhotoStage;
  fileName: string;
}) {
  const timestamp = Date.now();
  return `${params.userId}/${params.sessionId}/${params.stage}/${timestamp}-${normalizeFileName(
    params.fileName,
  )}`;
}

export async function listTrialPhotos(params: {
  orderId: string;
  userId: string;
  stage: TrialPhotoStage;
}) {
  const { data, error } = await getOrderPhotos({
    orderId: params.orderId,
    stage: params.stage,
    userId: params.userId,
  });

  if (error || !data) {
    return [];
  }

  const supabase = await getSupabaseServerClient();

  return Promise.all(
    data.map(async (item: OrderPhotoRow) => {
      const path = item.storage_path;
        const { data: signedUrlData } = await supabase.storage
          .from(TRIAL_PHOTO_BUCKET)
          .createSignedUrl(path, 60 * 60);

        return {
          name: item.file_name,
          path,
          publicUrl: signedUrlData?.signedUrl ?? "",
          uploadedAt: item.created_at ?? "",
        } satisfies TrialPhotoItem;
      }),
  );
}

function getReturnRequestPath(params: { orderId: string; userId: string }) {
  return `${params.userId}/${params.orderId}/return-request.json`;
}

export async function getTrialReturnRequest(params: {
  orderId: string;
  userId: string;
}) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(TRIAL_REQUEST_BUCKET)
    .download(getReturnRequestPath(params));

  if (error || !data) {
    return null;
  }

  try {
    const payload = (await data.text()) as string;
    return JSON.parse(payload) as TrialReturnRequest;
  } catch {
    return null;
  }
}

export async function getTrialReturnRequests(params: {
  orderIds: string[];
  userId: string;
}) {
  const entries = await Promise.all(
    params.orderIds.map(async (orderId) => {
      const request = await getTrialReturnRequest({
        orderId,
        userId: params.userId,
      });

      return [orderId, request] as const;
    }),
  );

  return new Map(entries);
}

export async function saveTrialReturnRequest(params: {
  notes: string;
  orderId: string;
  userId: string;
}) {
  const supabase = await getSupabaseServerClient();
  const path = getReturnRequestPath(params);
  const body = JSON.stringify({
    notes: params.notes,
    requestedAt: new Date().toISOString(),
  } satisfies TrialReturnRequest);

  return supabase.storage.from(TRIAL_REQUEST_BUCKET).upload(path, body, {
    contentType: "application/json",
    upsert: true,
  });
}
