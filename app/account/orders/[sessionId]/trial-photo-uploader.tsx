"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { TrialPhotoItem, TrialPhotoStage } from "@/lib/trial-photos";

type TrialPhotoUploaderProps = {
  beforePhotos: TrialPhotoItem[];
  returnPhotos: TrialPhotoItem[];
  sessionId: string;
};

type UploadState = {
  before: File[];
  return: File[];
};

const stageCopy: Record<
  TrialPhotoStage,
  { helper: string; title: string; uploadLabel: string }
> = {
  before: {
    helper: "Toe box, outsole, heel, and side profile.",
    title: "Before photos",
    uploadLabel: "Upload before photos",
  },
  return: {
    helper: "Upload these when you are ready to send the pair back.",
    title: "Return photos",
    uploadLabel: "Upload return photos",
  },
};

export function TrialPhotoUploader({
  beforePhotos,
  returnPhotos,
  sessionId,
}: TrialPhotoUploaderProps) {
  const router = useRouter();
  const inputRefs = useRef<Record<TrialPhotoStage, HTMLInputElement | null>>({
    before: null,
    return: null,
  });
  const [selectedFiles, setSelectedFiles] = useState<UploadState>({
    before: [],
    return: [],
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [pendingStage, setPendingStage] = useState<TrialPhotoStage | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelection(stage: TrialPhotoStage, fileList: FileList | null) {
    setSelectedFiles((current) => ({
      ...current,
      [stage]: fileList ? Array.from(fileList) : [],
    }));
  }

  function openPicker(stage: TrialPhotoStage) {
    inputRefs.current[stage]?.click();
  }

  function uploadStage(stage: TrialPhotoStage) {
    const files = selectedFiles[stage];

    if (files.length === 0) {
      setError("Select at least one photo first.");
      setFeedback(null);
      return;
    }

    setPendingStage(stage);
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("sessionId", sessionId);
      formData.set("stage", stage);
      files.forEach((file) => formData.append("files", file));

      try {
        const response = await fetch("/api/trial-photos", {
          body: formData,
          method: "POST",
        });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Upload failed.");
        }

        setSelectedFiles((current) => ({ ...current, [stage]: [] }));
        setFeedback(
          stage === "before"
            ? "Before photos uploaded."
            : "Return photos uploaded.",
        );
        router.refresh();
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed. Please try again.",
        );
      } finally {
        setPendingStage(null);
      }
    });
  }

  function deletePhoto(path: string) {
    setDeletingPath(path);
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/trial-photos?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(
            path,
          )}`,
          {
            method: "DELETE",
          },
        );
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Delete failed.");
        }

        setFeedback("Photo deleted.");
        router.refresh();
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Delete failed. Please try again.",
        );
      } finally {
        setDeletingPath(null);
      }
    });
  }

  function renderGallery(stage: TrialPhotoStage, photos: TrialPhotoItem[]) {
    if (photos.length === 0) {
      return (
        <p className="mt-4 rounded-xl bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
          No {stage} photos uploaded yet.
        </p>
      );
    }

    return (
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <div
            key={photo.path}
            className="relative overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-100"
          >
            <button
              aria-label="Delete photo"
              className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deletingPath === photo.path}
              onClick={() => deletePhoto(photo.path)}
              type="button"
            >
              x
            </button>
            <a
              href={photo.publicUrl}
              target="_blank"
              rel="noreferrer"
            >
            <div className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={photo.name}
                className="h-full w-full object-cover"
                src={photo.publicUrl}
              />
            </div>
            </a>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
      <h2 className="text-xl font-semibold text-stone-950">
        Upload condition photos
      </h2>
      <p className="mt-3 text-sm leading-7 text-stone-600">
        Add a few clear photos before your first run and again before return so
        inspection stays simple and fair.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["before", "return"] as TrialPhotoStage[]).map((stage) => {
          const photos = stage === "before" ? beforePhotos : returnPhotos;
          const pending = isPending && pendingStage === stage;

          return (
            <div
              key={stage}
              className="rounded-[1.5rem] border border-stone-200 bg-white p-4"
            >
              <span className="text-sm font-medium text-stone-900">
                {stageCopy[stage].title}
              </span>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {stageCopy[stage].helper}
              </p>
              <input
                ref={(element) => {
                  inputRefs.current[stage] = element;
                }}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                multiple
                onChange={(event) => handleSelection(stage, event.target.files)}
                type="file"
              />
              <div className="mt-4 rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900">
                      Choose files or drop them here
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      JPEG, PNG, or WEBP, up to 5MB each
                    </p>
                    {selectedFiles[stage].length > 0 ? (
                      <p className="mt-2 inline-flex rounded-full bg-[#edf4ff] px-3 py-1 text-sm font-semibold text-[#1769e8]">
                        {selectedFiles[stage].length} file
                        {selectedFiles[stage].length === 1 ? "" : "s"} selected
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="inline-flex shrink-0 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
                    onClick={() => openPicker(stage)}
                    type="button"
                  >
                    Browse file
                  </button>
                </div>
              </div>
              <button
                className="mt-4 inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                disabled={pending || selectedFiles[stage].length === 0}
                onClick={() => uploadStage(stage)}
                type="button"
              >
                {pending ? "Uploading..." : stageCopy[stage].uploadLabel}
              </button>
              {renderGallery(stage, photos)}
            </div>
          );
        })}
      </div>

      {feedback ? (
        <p className="mt-4 text-sm font-medium text-emerald-700">{feedback}</p>
      ) : null}
      {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
      <p className="mt-4 text-sm text-stone-500">
        Uploads are saved to Supabase Storage in the <code>trial-photos</code>{" "}
        bucket.
      </p>
    </div>
  );
}
